'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSettings } from '@/lib/useSettings';
import { getPostAuthRedirect, needsEmailVerification, isFaceScanEnabled, isFaceScanComplete } from '@/lib/authRedirect';
import { faceScanService, type FaceScanSessionResponse } from '@/services/faceScanService';
import { cfImageUrl } from '@/lib/utils';
import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_STEPS = ['front', 'left', 'right', 'up', 'down', 'smile'] as const;
type RequiredStep = typeof REQUIRED_STEPS[number];

const STEP_INSTRUCTIONS: Record<RequiredStep, { title: string; hint: string; icon: string }> = {
    front: { title: 'Look straight ahead', hint: 'Face the camera, then blink once naturally — a light blink is enough', icon: '👁️' },
    left:  { title: 'Turn head LEFT',       hint: 'Slowly turn left — auto-captures when detected',  icon: '←' },
    right: { title: 'Turn head RIGHT',      hint: 'Slowly turn right — auto-captures when detected', icon: '→' },
    up:    { title: 'Tilt head UP',         hint: 'Tilt chin up — auto-captures when detected',      icon: '↑' },
    down:  { title: 'Tilt head DOWN',       hint: 'Tilt chin down — auto-captures when detected',    icon: '↓' },
    smile: { title: 'Now smile!',           hint: 'Show your teeth — auto-captures when detected',   icon: '😄' },
};

// ─── MediaPipe singleton ──────────────────────────────────────────────────────

let _landmarkerInstance: FaceLandmarker | null = null;
let _landmarkerLoading: Promise<FaceLandmarker> | null = null;

async function getFaceLandmarker(): Promise<FaceLandmarker> {
    if (_landmarkerInstance) return _landmarkerInstance;
    if (_landmarkerLoading) return _landmarkerLoading;

    _landmarkerLoading = (async () => {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        _landmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: '/mediapipe-wasm/face_landmarker.task',
                delegate: 'CPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
        });
        return _landmarkerInstance;
    })();

    return _landmarkerLoading;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Returns true only when the video element has real frames ready to read */
function isVideoReady(video: HTMLVideoElement): boolean {
    return (
        video.readyState >= 2 &&          // HAVE_CURRENT_DATA or better
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused &&
        !video.ended
    );
}

function estimateYaw(result: FaceLandmarkerResult): number {
    return result.facialTransformationMatrixes?.[0]?.data?.[8] ?? 0;
}

function estimatePitchValue(result: FaceLandmarkerResult): number {
    return result.facialTransformationMatrixes?.[0]?.data?.[9] ?? 0;
}

function estimateDirection(result: FaceLandmarkerResult): 'front' | 'left' | 'right' {
    const yaw = estimateYaw(result);
    if (yaw > 0.22) return 'right';
    if (yaw < -0.22) return 'left';
    return 'front';
}

function estimatePitch(result: FaceLandmarkerResult): 'up' | 'down' | 'ok' {
    const pitch = estimatePitchValue(result);
    if (pitch < -0.20) return 'down';    // chin up = negative pitch
    if (pitch > 0.20)  return 'up';  // chin down = positive pitch
    return 'ok';
}

function getSmileScore(result: FaceLandmarkerResult): number {
    const shapes = result.faceBlendshapes?.[0]?.categories;
    if (!shapes) return 0;
    const l = shapes.find(c => c.categoryName === 'mouthSmileLeft')?.score ?? 0;
    const r = shapes.find(c => c.categoryName === 'mouthSmileRight')?.score ?? 0;
    return (l + r) / 2;
}

function getEyeOpenScore(result: FaceLandmarkerResult): number {
    const shapes = result.faceBlendshapes?.[0]?.categories;
    if (!shapes) return 1;
    const lOpen = 1 - (shapes.find(c => c.categoryName === 'eyeBlinkLeft')?.score ?? 0);
    const rOpen = 1 - (shapes.find(c => c.categoryName === 'eyeBlinkRight')?.score ?? 0);
    return (lOpen + rOpen) / 2;
}

/** Max of left/right blink blendshape — one eye closing is enough. */
function getEyeBlinkBlendScore(result: FaceLandmarkerResult): number {
    const shapes = result.faceBlendshapes?.[0]?.categories;
    if (!shapes) return 0;
    const l = shapes.find(c => c.categoryName === 'eyeBlinkLeft')?.score ?? 0;
    const r = shapes.find(c => c.categoryName === 'eyeBlinkRight')?.score ?? 0;
    return Math.max(l, r);
}

/** Lenient blink detection — works for partial / light blinks across several frames. */
function detectBlink(
    eyeOpen: number,
    blinkBlend: number,
    history: number[],
    blinkPending: boolean,
    cooldown: boolean,
): { blinked: boolean; pending: boolean } {
    if (cooldown) return { blinked: false, pending: false };

    const CLOSED_EYE = 0.58;
    const OPEN_EYE = 0.38;
    const BLINK_BLEND = 0.18;

    let pending = blinkPending;

    if (!pending && (eyeOpen < CLOSED_EYE || blinkBlend > BLINK_BLEND)) {
        pending = true;
    }

    if (pending && eyeOpen > OPEN_EYE) {
        return { blinked: true, pending: false };
    }

    if (history.length >= 3) {
        const recent = history.slice(-5);
        const minOpen = Math.min(...recent);
        const maxOpen = Math.max(...recent);
        if (maxOpen - minOpen >= 0.14 && minOpen < CLOSED_EYE && eyeOpen >= OPEN_EYE) {
            return { blinked: true, pending: false };
        }
    }

    return { blinked: false, pending };
}

function checkFacePosition(
    result: FaceLandmarkerResult,
    videoWidth: number,
    videoHeight: number,
): 'ok' | 'too_far' | 'too_close' | 'offcenter' {
    const lm = result.faceLandmarks?.[0];
    if (!lm) return 'too_far';

    const xs = lm.map(p => p.x);
    const ys = lm.map(p => p.y);
    const faceW  = (Math.max(...xs) - Math.min(...xs)) * videoWidth;
    const faceCx = ((Math.max(...xs) + Math.min(...xs)) / 2) * videoWidth;
    const faceCy = ((Math.max(...ys) + Math.min(...ys)) / 2) * videoHeight;

    const offsetX = Math.abs(faceCx - videoWidth / 2) / videoWidth;
    const offsetY = Math.abs(faceCy - videoHeight / 2) / videoHeight;
    if (offsetX > 0.18 || offsetY > 0.18) return 'offcenter';

    const ratio = faceW / videoWidth;
    if (ratio < 0.28) return 'too_far';
    if (ratio > 0.75) return 'too_close';
    return 'ok';
}

function detectGlasses(
    result: FaceLandmarkerResult,
    ctx: CanvasRenderingContext2D,
    videoWidth: number,
    videoHeight: number,
): boolean {
    return false;
}

function drawFrameToCanvas(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
): CanvasRenderingContext2D | null {
    if (!isVideoReady(video)) return null;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx;
}

async function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File | null> {
    if (canvas.width === 0 || canvas.height === 0) return null;
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.90));
    if (!blob || blob.size < 200) return null;
    return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
}

function trackStepUpload(prev: RequiredStep[], captureKey: string): RequiredStep[] {
    const step = captureKey as RequiredStep;
    if (!REQUIRED_STEPS.includes(step)) return prev;
    return prev.includes(step) ? prev : [...prev, step];
}

function shouldResetScanProgress(session: FaceScanSessionResponse | null): boolean {
    if (!session) return true;
    if (!session.captures?.length) return true;
    if (session.review_note) return true;
    return false;
}

// ─── Overlay canvas ───────────────────────────────────────────────────────────

function drawOverlay(
    overlayCanvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    faceOk: boolean,
    glassesOn: boolean,
    blinkReady: boolean,
) {
    const w = video.clientWidth  || overlayCanvas.width;
    const h = video.clientHeight || overlayCanvas.height;
    overlayCanvas.width  = w;
    overlayCanvas.height = h;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 - h * 0.03;
    const rx = w * 0.28;
    const ry = h * 0.40;

    const color = glassesOn   ? '#ef4444'
        : blinkReady  ? '#3b82f6'
            : faceOk      ? '#22c55e'
                :               '#f59e0b';

    // Dim outside oval
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fill('evenodd');
    ctx.restore();

    // Oval border
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.setLineDash(blinkReady ? [12, 6] : []);
    ctx.stroke();
    ctx.setLineDash([]);

    // Corner dots
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
        ctx.beginPath();
        ctx.arc(
            cx + (rx + 8) * Math.cos(angle),
            cy + (ry + 8) * Math.sin(angle),
            4, 0, Math.PI * 2,
        );
        ctx.fillStyle = color;
        ctx.fill();
    });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type FaceStatus = {
    position:  'ok' | 'too_far' | 'too_close' | 'offcenter' | 'no_face';
    direction: 'front' | 'left' | 'right';
    pitch:     'up' | 'down' | 'ok';
    glasses:   boolean | null;
    smile:     number;
    eyeOpen:   number;
};

const DEFAULT_FACE_STATUS: FaceStatus = {
    position: 'no_face', direction: 'front', pitch: 'ok',
    glasses: null, smile: 0, eyeOpen: 1,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function FaceScanPage() {
    const router = useRouter();
    const { user, isAuthenticated, updateUser } = useAuthStore();
    const { settings } = useSettings();

    const videoRef          = useRef<HTMLVideoElement | null>(null);
    const overlayCanvasRef  = useRef<HTMLCanvasElement | null>(null);
    const streamRef         = useRef<MediaStream | null>(null);
    const captureCanvasRef  = useRef<HTMLCanvasElement | null>(null);
    const detectionTimerRef = useRef<number | null>(null);

    // Glasses debounce vote counter
    const glassesVoteRef    = useRef(0);
    // Mirror of glassesState as a ref so the interval loop always reads fresh value (no stale closure)
    const glassesStateRef   = useRef<boolean | null>(null);
    // Rolling eye-open history for blink detection
    const eyeHistoryRef     = useRef<number[]>([]);
    const blinkCooldownRef  = useRef(false);
    // Set true when eye goes closed; fires capture on next open frame
    const blinkPendingRef   = useRef(false);
    // Whether front step is "locked in" and waiting for a blink
    const blinkReadyRef     = useRef(false);
    // Guard against concurrent captures
    const capturingRef      = useRef(false);

    const [mounted,        setMounted]        = useState(false);
    const [loadingModels,  setLoadingModels]  = useState(false);
    const [cameraReady,    setCameraReady]    = useState(false);
    const [cameraError,    setCameraError]    = useState<string | null>(null);
    const [scanError,      setScanError]      = useState<string | null>(null);
    const [glassesConfirmed, setGlassesConfirmed] = useState(false);

    const [faceStatus,      setFaceStatus]      = useState<FaceStatus>(DEFAULT_FACE_STATUS);
    const [glassesState,    setGlassesState]    = useState<boolean | null>(null);
    const [blinkReady,      setBlinkReady]      = useState(false);

    const [currentStep,    setCurrentStep]    = useState<RequiredStep>('front');
    const [completedSteps, setCompletedSteps] = useState<RequiredStep[]>([]);
    const [session,        setSession]        = useState<FaceScanSessionResponse | null>(null);
    const [started,        setStarted]        = useState(false);
    const [uploading,      setUploading]      = useState(false);
    const [captureCountdown, setCaptureCountdown] = useState<number | null>(null);
    const [flashActive,    setFlashActive]    = useState(false);
    const [pageReady,      setPageReady]      = useState(false);

    const faceScanEnabled = useMemo(() => isFaceScanEnabled(settings.face_scan_enabled), [settings.face_scan_enabled]);
    const rejectionReason = session?.review_note ?? user?.face_scan_review_note ?? null;
    const showRejectionBanner = !!rejectionReason;

    // ── Mount ────────────────────────────────────────────────────────────────
    useEffect(() => { setMounted(true); }, []);

    // ── Auth guard ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated) { router.replace('/login'); return; }
        if (needsEmailVerification(user)) {
            router.replace('/verify-email');
            return;
        }

        if (!faceScanEnabled) {
            router.replace('/dashboard');
            return;
        }

        if (isFaceScanComplete(user?.face_scan_status)) {
            router.replace('/dashboard');
            return;
        }

        let cancelled = false;

        void faceScanService.getStatus().then(res => {
            if (cancelled) return;
            const srv = res.data.data.session;
            setSession(srv);
            setCompletedSteps(shouldResetScanProgress(srv) ? [] : REQUIRED_STEPS.filter(step =>
                srv?.captures?.some(c => c.capture_key === step) ?? false,
            ));

            if (srv?.status) {
                updateUser({
                    face_scan_status: srv.status,
                    face_scan_review_note: srv.review_note ?? undefined,
                });
            }

            if (srv && isFaceScanComplete(srv.status)) {
                router.replace('/dashboard');
                return;
            }

            setPageReady(true);
        }).catch(() => {
            if (!cancelled) setPageReady(true);
        });

        return () => { cancelled = true; };
    }, [mounted, isAuthenticated, router, faceScanEnabled, user?.face_scan_status]);

    // ── Off-screen capture canvas ─────────────────────────────────────────────
    useEffect(() => {
        captureCanvasRef.current = document.createElement('canvas');
        return () => { captureCanvasRef.current = null; };
    }, []);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => {
        return () => {
            if (detectionTimerRef.current) window.clearInterval(detectionTimerRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    // ── Redirect when server confirms submission ─────────────────────────────
    useEffect(() => {
        if (!session || !isFaceScanComplete(session.status)) return;

        const t = window.setTimeout(() => {
            updateUser({ face_scan_status: session.status });
            stopCamera();
            router.replace('/dashboard');
        }, 1200);

        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.status]);

    // ── Auto-redirect once server confirms all captures submitted ────────────
    useEffect(() => {
        if (completedSteps.length < REQUIRED_STEPS.length || !started || uploading) return;

        let cancelled = false;

        const t = window.setTimeout(async () => {
            if (session && isFaceScanComplete(session.status)) return;

            try {
                const res = await faceScanService.getStatus();
                if (cancelled) return;
                const srv = res.data.data.session;
                if (srv) {
                    setSession(srv);
                    if (isFaceScanComplete(srv.status)) {
                        updateUser({
                            face_scan_status: srv.status,
                            face_scan_review_note: srv.review_note,
                        });
                        stopCamera();
                        router.replace('/dashboard');
                    }
                }
            } catch { /* wait for next upload or user action */ }
        }, 1500);

        return () => {
            cancelled = true;
            window.clearTimeout(t);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [completedSteps.length, started, uploading]);

    // ── Main detection loop ───────────────────────────────────────────────────
    useEffect(() => {
        if (!started || !cameraReady) return;

        let countdownActive = false;
        let countdownVal    = 0;
        let countdownTimer: number | null = null;
        let frameSkip = 0;

        const clearCountdown = () => {
            countdownActive = false;
            if (countdownTimer) { window.clearTimeout(countdownTimer); countdownTimer = null; }
            setCaptureCountdown(null);
        };

        detectionTimerRef.current = window.setInterval(async () => {
            const video  = videoRef.current;
            const canvas = captureCanvasRef.current;

            // ── Guard: video must be truly ready ──────────────────────────────
            if (!video || !canvas || !isVideoReady(video)) return;
            if (video.videoWidth === 0 || video.videoHeight === 0) return;
            if (capturingRef.current) return;

            frameSkip++;
            const nextStepPreview = REQUIRED_STEPS.find(s => !completedSteps.includes(s));
            const frameSkipLimit = nextStepPreview === 'front' ? 1 : 3;
            if (frameSkip < frameSkipLimit) return;

            let landmarker: FaceLandmarker;
            try {
                landmarker = await getFaceLandmarker();
            } catch (e) {
                console.error('[FaceScan] landmarker load failed', e);
                return;
            }

            let result: FaceLandmarkerResult;
            try {
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    return;
                }
                result = landmarker.detectForVideo(video, performance.now());
            } catch (e) {
                // This is normal for the first few frames - don't log as warning
                const error = e as Error;
                // Only log real errors, not initialization hiccups
                if (error.message &&
                    !error.message.includes('TensorFlow') &&
                    !error.message.includes('XNNPACK') &&
                    !error.message.includes('Not yet') &&
                    !error.message.includes('internal')) {
                    console.debug('[FaceScan] Detection skipped (normal during initialization):', error.message);
                }
                return;
            }

            // ── No face ───────────────────────────────────────────────────────
            if (!result.faceLandmarks?.length) {
                setFaceStatus(prev => ({ ...prev, position: 'no_face' }));
                blinkReadyRef.current = false;
                blinkPendingRef.current = false;
                setBlinkReady(false);
                clearCountdown();
                if (overlayCanvasRef.current && video) {
                    drawOverlay(overlayCanvasRef.current, video, false, false, false);
                }
                return;
            }

            // ── Draw frame for glasses detection ──────────────────────────────
            const ctx = drawFrameToCanvas(video, canvas);
            if (!ctx) return;

            const glassesNow = detectGlasses(result, ctx, video.videoWidth, video.videoHeight);
            const direction  = estimateDirection(result);
            const pitch      = estimatePitch(result);
            const smileScore = getSmileScore(result);
            const eyeOpen    = getEyeOpenScore(result);
            const blinkBlend = getEyeBlinkBlendScore(result);
            const position   = checkFacePosition(result, video.videoWidth, video.videoHeight);

            // ── Glasses debounce (±5 vote) ────────────────────────────────────
            glassesVoteRef.current = glassesNow
                ? Math.min(5,  glassesVoteRef.current + 1)
                : Math.max(-5, glassesVoteRef.current - 1);
            const stableGlasses =
                glassesVoteRef.current >=  5 ? true  :
                    glassesVoteRef.current <= -5 ? false : glassesState;
            if (stableGlasses !== glassesState) setGlassesState(stableGlasses);

            // ── Blink detection (lenient — light blinks count) ───────────────
            eyeHistoryRef.current.push(eyeOpen);
            if (eyeHistoryRef.current.length > 10) eyeHistoryRef.current.shift();
            const blinkResult = detectBlink(
                eyeOpen,
                blinkBlend,
                eyeHistoryRef.current,
                blinkPendingRef.current,
                blinkCooldownRef.current,
            );
            blinkPendingRef.current = blinkResult.pending;
            const blinkNow = blinkResult.blinked;
            if (blinkNow) {
                blinkCooldownRef.current = true;
                blinkPendingRef.current = false;
                setTimeout(() => { blinkCooldownRef.current = false; }, 1000);
            }

            // ── Update UI ─────────────────────────────────────────────────────
            setFaceStatus({ position, direction, pitch, glasses: stableGlasses, smile: smileScore, eyeOpen });

            if (overlayCanvasRef.current) {
                drawOverlay(
                    overlayCanvasRef.current, video,
                    position === 'ok' && !glassesNow,
                    !!stableGlasses,
                    blinkReadyRef.current,
                );
            }

            // ── All steps done — nothing more to capture ──────────────────────
            if (completedSteps.length >= REQUIRED_STEPS.length) return;

            const nextStep = REQUIRED_STEPS.find(s => !completedSteps.includes(s));
            if (!nextStep) return;
            setCurrentStep(nextStep);

            // ── Block on glasses or bad position ─────────────────────────────
            if (stableGlasses === true || position !== 'ok') {
                blinkReadyRef.current = false;
                blinkPendingRef.current = false;
                setBlinkReady(false);
                clearCountdown();
                return;
            }

            // ═══════════════════════════════════════════════════════════════════
            // FRONT — blink to confirm
            // ═══════════════════════════════════════════════════════════════════
            if (nextStep === 'front') {
                const posGood = direction === 'front' && pitch === 'ok' && smileScore < 0.35;
                if (!posGood) {
                    blinkReadyRef.current = false;
                    blinkPendingRef.current = false;
                    setBlinkReady(false);
                    clearCountdown();
                    return;
                }

                if (!blinkReadyRef.current) {
                    blinkReadyRef.current = true;
                    setBlinkReady(true);
                }

                if (!blinkNow) return; // waiting for blink

                // Blink detected → capture immediately
                blinkReadyRef.current = false;
                blinkPendingRef.current = false;
                setBlinkReady(false);
                clearCountdown();

                await doCapture(video, canvas, landmarker, 'front', {
                    expression: smileScore >= 0.4 ? 'happy' : 'neutral',
                    face_turn: 'front',
                });
                return;
            }

            // ═══════════════════════════════════════════════════════════════════
            // Other steps — 2-second countdown then capture
            // ═══════════════════════════════════════════════════════════════════
            const stepMet =
                (nextStep === 'left'  && direction === 'left')  ||
                (nextStep === 'right' && direction === 'right') ||
                (nextStep === 'up'    && pitch === 'up')        ||
                (nextStep === 'down'  && pitch === 'down')      ||
                (nextStep === 'smile' && smileScore >= 0.40);

            if (!stepMet) {
                clearCountdown();
                return;
            }

            // Start countdown if not already running
            if (!countdownActive) {
                countdownActive = true;
                countdownVal    = 2;
                setCaptureCountdown(countdownVal);

                const tick = () => {
                    if (!countdownActive) return;
                    countdownVal--;
                    if (countdownVal > 0) {
                        setCaptureCountdown(countdownVal);
                        countdownTimer = window.setTimeout(tick, 1000);
                    } else {
                        setCaptureCountdown(0);
                        countdownTimer = window.setTimeout(async () => {
                            if (!countdownActive) return;
                            clearCountdown();

                            const vid = videoRef.current;
                            const cnv = captureCanvasRef.current;
                            if (!vid || !cnv || !isVideoReady(vid)) return;

                            await doCapture(vid, cnv, landmarker, nextStep, {
                                expression: getSmileScore(
                                    landmarker.detectForVideo(vid, performance.now()),
                                ) >= 0.4 ? 'happy' : 'neutral',
                                face_turn: estimateDirection(
                                    landmarker.detectForVideo(vid, performance.now()),
                                ),
                            });
                        }, 1000);
                    }
                };
                countdownTimer = window.setTimeout(tick, 1000);
            }

        }, 180); // 180 ms — responsive but not too aggressive

        return () => {
            if (detectionTimerRef.current) window.clearInterval(detectionTimerRef.current);
            if (countdownTimer) window.clearTimeout(countdownTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [started, cameraReady, completedSteps, glassesState]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Captures one frame and uploads it. Guards against double-captures. */
    const doCapture = async (
        video: HTMLVideoElement,
        canvas: HTMLCanvasElement,
        landmarker: FaceLandmarker,
        step: RequiredStep,
        extra: { expression?: string; face_turn?: string },
    ) => {
        if (capturingRef.current) return;
        capturingRef.current = true;
        try {
            // Final re-verify
            const ctx2 = drawFrameToCanvas(video, canvas);
            if (!ctx2) return;
            const r2 = landmarker.detectForVideo(video, performance.now());
            if (!r2.faceLandmarks?.length) return;
            if (checkFacePosition(r2, video.videoWidth, video.videoHeight) !== 'ok') return;

            const file = await canvasToFile(canvas, `${step}-${Date.now()}`);
            if (!file) return;

            triggerFlash();
            await uploadCapture(file, step, step, {
                has_glasses: false,
                expression:  extra.expression,
                confidence:  r2.faceBlendshapes?.[0]?.categories[0]?.score ?? 0.9,
                face_turn:   extra.face_turn ?? estimateDirection(r2),
            });
            setCompletedSteps(prev => prev.includes(step) ? prev : [...prev, step]);
        } finally {
            capturingRef.current = false;
        }
    };

    const triggerFlash = () => {
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 300);
    };

    const loadModels = async () => {
        setLoadingModels(true);
        setScanError(null);
        try {
            await getFaceLandmarker();
        } catch {
            setScanError('Failed to load face-analysis models. Check /public/mediapipe-wasm/ files.');
            throw new Error('model-load-failed');
        } finally {
            setLoadingModels(false);
        }
    };

    const startCamera = async () => {
        setScanError(null);
        setCameraError(null);
        if (!glassesConfirmed) {
            setScanError('Please confirm you are not wearing glasses before starting.');
            return;
        }
        try {
            await loadModels();
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                // Wait for metadata + first frame before marking ready
                await new Promise<void>((resolve, reject) => {
                    video.onloadeddata = () => resolve();
                    video.onerror = reject;
                    video.play().catch(reject);
                });
            }
            glassesVoteRef.current    = 0;
            eyeHistoryRef.current     = [];
            blinkCooldownRef.current  = false;
            blinkPendingRef.current   = false;
            blinkReadyRef.current     = false;
            capturingRef.current      = false;
            setGlassesState(null);
            setBlinkReady(false);
            setFaceStatus(DEFAULT_FACE_STATUS);
            setStarted(true);
            setCameraReady(true);
        } catch (err) {
            setCameraError(
                err instanceof DOMException && err.name === 'NotAllowedError'
                    ? 'Camera permission denied — allow camera access in browser settings.'
                    : 'Unable to open the camera. Make sure nothing else is using it.',
            );
        }
    };

    const stopCamera = () => {
        if (detectionTimerRef.current) window.clearInterval(detectionTimerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCameraReady(false);
        setStarted(false);
        setGlassesState(null);
        setBlinkReady(false);
        blinkReadyRef.current = false;
        blinkPendingRef.current = false;
        capturingRef.current  = false;
        setFaceStatus(DEFAULT_FACE_STATUS);
        setCaptureCountdown(null);
    };

    const uploadCapture = async (
        file: File,
        captureKey: string,
        captureType: string,
        meta: { has_glasses: boolean; expression?: string; confidence?: number; face_turn?: string },
    ) => {
        setUploading(true);
        try {
            const res = await faceScanService.uploadCapture({
                capture: file, capture_key: captureKey, capture_type: captureType,
                has_glasses: meta.has_glasses, expression: meta.expression,
                confidence: meta.confidence, face_turn: meta.face_turn,
            });
            const srv = res.data.data.session;
            setSession(srv);
            setCompletedSteps(prev => trackStepUpload(prev, captureKey));
            if (srv.status === 'submitted' || srv.status === 'approved') {
                updateUser({
                    face_scan_status: srv.status,
                    face_scan_review_note: srv.review_note,
                });
                stopCamera();
                router.replace('/dashboard');
            }
        } catch {
            setScanError('Upload failed — please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (!mounted || !pageReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(160deg,#f8f3e8_0%,#fffaf1_100%)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-stone-600">Preparing face verification…</p>
                </div>
            </div>
        );
    }

    // ── Derived UI ────────────────────────────────────────────────────────────

    const nextStep = REQUIRED_STEPS.find(s => !completedSteps.includes(s));
    const allDone  = completedSteps.length >= REQUIRED_STEPS.length;

    const getGuidance = (): { text: string; type: 'warn' | 'info' | 'ok' | 'error'; arrow?: string } => {
        if (!cameraReady) return { text: 'Start the camera to begin.', type: 'info' };
        if (glassesState === true)             return { text: '🕶️ Remove glasses to continue', type: 'error' };
        if (faceStatus.position === 'no_face') return { text: 'Move into frame — no face detected', type: 'warn' };
        if (faceStatus.position === 'too_far')   return { text: 'Move closer to the camera', type: 'warn', arrow: '↑' };
        if (faceStatus.position === 'too_close') return { text: 'Move further back', type: 'warn', arrow: '↓' };
        if (faceStatus.position === 'offcenter') return { text: 'Centre your face in the oval', type: 'warn', arrow: '⊕' };

        if (allDone) return { text: '✅ All poses captured — finishing up…', type: 'ok' };
        if (!nextStep) return { text: 'Done!', type: 'ok' };

        // Pitch feedback
        if (nextStep !== 'up' && nextStep !== 'down') {
            if (faceStatus.pitch === 'up')   return { text: 'Tilt your head down slightly', type: 'warn', arrow: '↓' };
            if (faceStatus.pitch === 'down') return { text: 'Tilt your head up slightly',   type: 'warn', arrow: '↑' };
        }

        if (nextStep === 'front') {
            if (faceStatus.direction !== 'front') return { text: 'Face straight ahead', type: 'warn', arrow: '⊕' };
            if (faceStatus.smile >= 0.35)         return { text: 'Relax your face — no smiling yet', type: 'warn' };
            if (blinkReady) return { text: '👁️  Position locked — blink once naturally (a light blink is enough)', type: 'ok' };
            return { text: 'Hold still and face forward…', type: 'info' };
        }
        if (nextStep === 'left') {
            if (faceStatus.direction === 'right')  return { text: 'Wrong way — turn LEFT', type: 'warn', arrow: '←' };
            if (faceStatus.direction === 'front')  return { text: 'Slowly turn your head to the LEFT', type: 'info', arrow: '←' };
            if (captureCountdown !== null && captureCountdown > 0) return { text: `Hold still… ${captureCountdown}`, type: 'ok' };
            if (captureCountdown === 0) return { text: '📸 Capturing left pose!', type: 'ok' };
            return { text: 'Good — hold that left turn', type: 'ok', arrow: '←' };
        }
        if (nextStep === 'right') {
            if (faceStatus.direction === 'left')   return { text: 'Wrong way — turn RIGHT', type: 'warn', arrow: '→' };
            if (faceStatus.direction === 'front')  return { text: 'Slowly turn your head to the RIGHT', type: 'info', arrow: '→' };
            if (captureCountdown !== null && captureCountdown > 0) return { text: `Hold still… ${captureCountdown}`, type: 'ok' };
            if (captureCountdown === 0) return { text: '📸 Capturing right pose!', type: 'ok' };
            return { text: 'Good — hold that right turn', type: 'ok', arrow: '→' };
        }
        if (nextStep === 'up') {
            if (faceStatus.pitch === 'down') return { text: 'Wrong way — tilt chin UP', type: 'warn', arrow: '↑' };
            if (faceStatus.pitch === 'ok')   return { text: 'Tilt your chin UP slowly', type: 'info', arrow: '↑' };
            if (captureCountdown !== null && captureCountdown > 0) return { text: `Hold still… ${captureCountdown}`, type: 'ok' };
            if (captureCountdown === 0) return { text: '📸 Capturing up pose!', type: 'ok' };
            return { text: 'Good — hold that upward tilt', type: 'ok', arrow: '↑' };
        }
        if (nextStep === 'down') {
            if (faceStatus.pitch === 'up')  return { text: 'Wrong way — tilt chin DOWN', type: 'warn', arrow: '↓' };
            if (faceStatus.pitch === 'ok')  return { text: 'Tilt your chin DOWN slowly', type: 'info', arrow: '↓' };
            if (captureCountdown !== null && captureCountdown > 0) return { text: `Hold still… ${captureCountdown}`, type: 'ok' };
            if (captureCountdown === 0) return { text: '📸 Capturing down pose!', type: 'ok' };
            return { text: 'Good — hold that downward tilt', type: 'ok', arrow: '↓' };
        }
        if (nextStep === 'smile') {
            if (faceStatus.smile < 0.2)  return { text: 'Show a big smile — teeth visible', type: 'info' };
            if (faceStatus.smile < 0.4)  return { text: 'Bigger smile! Show your teeth 😁', type: 'warn' };
            if (captureCountdown !== null && captureCountdown > 0) return { text: `Hold that smile… ${captureCountdown}`, type: 'ok' };
            if (captureCountdown === 0) return { text: '📸 Capturing smile!', type: 'ok' };
            return { text: 'Great smile — hold it!', type: 'ok' };
        }
        // return { text: STEP_INSTRUCTIONS[nextStep].hint, type: 'info' };
        return { text: 'Follow the on-screen instructions', type: 'info' };
    };

    const guidance = getGuidance();
    const guidanceColors = {
        warn:  'bg-amber-50 border-amber-200 text-amber-800',
        info:  'bg-stone-50 border-stone-200 text-stone-700',
        ok:    'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-700',
    };

    const progressPct = Math.round((completedSteps.length / REQUIRED_STEPS.length) * 100);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[linear-gradient(160deg,#f8f3e8_0%,#fffaf1_100%)] flex items-center justify-center px-4">
            <div className="w-full max-w-5xl bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-amber-100 overflow-hidden">

                {/* Header */}
                <div className="bg-[linear-gradient(90deg,#1a1207,#3c2904,#1a1207)] px-5 sm:px-8 pt-4 pb-2 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Secure identity verification</p>
                        <h1 className="text-2xl font-bold">Face scan</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-amber-100/80 tabular-nums">{completedSteps.length}/{REQUIRED_STEPS.length}</span>
                        <div className="w-28 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-sm text-amber-100/90">{settings.site_name}</span>
                    </div>
                </div>

                {showRejectionBanner && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl shrink-0">⚠️</span>
                            <div>
                                <p className="font-semibold text-red-800">Previous verification was rejected</p>
                                <p className="text-sm text-red-700 mt-1 leading-relaxed"><b>Reason : </b> {rejectionReason}</p>
                                <p className="text-xs mt-2">Please complete a new face scan below.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6 p-4 sm:p-6 lg:px-8">

                    {/* ── Left: camera ─────────────────────────────────────── */}
                    <div className="space-y-4">

                        {/* Controls */}
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-lg text-stone-900">Camera</h2>
                                    <p className="text-sm text-stone-600 mt-0.5">Good lighting · Remove glasses and headwear</p>
                                </div>
                                <div className="shrink-0">
                                    {cameraReady ? (
                                        <></>
                                        // <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                                        //     glassesState === null ? 'bg-stone-100 border-stone-200 text-stone-600'
                                        //         : glassesState ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                                        //             : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        // }`}>
                                        //     {glassesState === null && '🔍 Checking…'}
                                        //     {glassesState === true  && '🕶️ Remove glasses'}
                                        //     {glassesState === false && '✅ No glasses'}
                                        // </div>
                                    ) : (
                                        <label className="inline-flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={glassesConfirmed}
                                                onChange={e => setGlassesConfirmed(e.target.checked)}
                                                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                            />
                                            I am not wearing glasses
                                        </label>
                                    )}

                                    { cameraReady && (
                                        <button
                                            type="button" onClick={stopCamera}
                                            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-amber-200 bg-white px-5 py-3 font-semibold text-stone-700 hover:bg-amber-50 transition-colors"
                                        >
                                            Stop camera
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!cameraReady && (
                                <button
                                    type="button" onClick={startCamera} disabled={loadingModels}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#FFCF00,#FFE033)] px-5 py-3 font-semibold text-white shadow-md disabled:opacity-60 transition-opacity"
                                >
                                    {loadingModels && (
                                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                            <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {loadingModels ? 'Loading models…' : 'Allow camera & start scan'}
                                </button>
                            )}

                            {(scanError || cameraError) && (
                                <p className="mt-3 text-sm text-red-600 flex items-start gap-1.5">
                                    <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {scanError ?? cameraError}
                                </p>
                            )}
                        </div>

                        {/* Camera viewport */}
                        <div className={`rounded-2xl overflow-hidden relative bg-stone-950 transition-all ${
                            glassesState === true ? 'ring-2 ring-red-400'
                                : blinkReady ? 'ring-2 ring-blue-400'
                                    : faceStatus.position === 'ok' && cameraReady ? 'ring-2 ring-emerald-400'
                                        : 'ring-1 ring-stone-800'
                        }`}>

                            {/* Flash */}
                            {flashActive && (
                                <div className="absolute inset-0 z-30 bg-white pointer-events-none"
                                     style={{ opacity: 0.85, transition: 'opacity 0.3s' }} />
                            )}

                            {/* Badges */}
                            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                                {cameraReady && (
                                    <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white/90 backdrop-blur-sm flex items-center gap-1.5">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                        Live
                                    </span>
                                )}
                                {uploading && (
                                    <span className="rounded-full bg-amber-500/90 px-3 py-1 text-xs text-white font-medium animate-pulse">
                                        Uploading…
                                    </span>
                                )}
                            </div>

                            {/* Step title — top-centre */}
                            {cameraReady && nextStep && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                    <div className={`rounded-full backdrop-blur-sm px-4 py-1.5 text-sm font-semibold text-white text-center whitespace-nowrap flex items-center gap-2 ${
                                        blinkReady ? 'bg-blue-600/80' : 'bg-black/60'
                                    }`}>
                                        <span>{STEP_INSTRUCTIONS[nextStep].icon}</span>
                                        <span>{STEP_INSTRUCTIONS[nextStep].title}</span>
                                    </div>
                                </div>
                            )}

                            {/* Direction arrow — bottom-centre */}
                            {cameraReady && guidance.arrow && faceStatus.position !== 'no_face' && (
                                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                    <span className="text-5xl font-black text-white drop-shadow-lg opacity-90 animate-bounce select-none">
                                        {guidance.arrow}
                                    </span>
                                </div>
                            )}

                            {/* Blink prompt badge */}
                            {blinkReady && (
                                <div className="absolute bottom-14 right-4 z-20 pointer-events-none">
                                    <div className="rounded-xl bg-blue-600/90 backdrop-blur-sm px-3 py-2 text-white text-sm font-bold flex items-center gap-1.5 animate-pulse">
                                        👁️ Blink now
                                    </div>
                                </div>
                            )}

                            {/* Countdown */}
                            {captureCountdown !== null && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                    <div className={`text-7xl font-black text-white drop-shadow-lg transition-all ${
                                        captureCountdown === 0 ? 'scale-150 opacity-0' : 'scale-100 opacity-90'
                                    }`}>
                                        {captureCountdown === 0 ? '📸' : captureCountdown}
                                    </div>
                                </div>
                            )}

                            <video ref={videoRef} muted playsInline className="w-full aspect-4/3 object-cover bg-stone-900"/>
                            <canvas ref={overlayCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

                            {!cameraReady && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-stone-300 gap-4">
                                    <div className="h-16 w-16 rounded-full border-4 border-amber-300/30 border-t-amber-300 animate-spin" />
                                    <p className="text-sm max-w-xs">Camera feed will appear here after you grant permission.</p>
                                </div>
                            )}
                        </div>

                        {/* Guidance bar */}
                        {cameraReady && (
                            <div className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${guidanceColors[guidance.type]}`}>
                                {guidance.arrow && <span className="text-lg font-black leading-none">{guidance.arrow}</span>}
                                <span>{guidance.text}</span>
                            </div>
                        )}

                        {/* Live metrics */}
                        {cameraReady && faceStatus.position !== 'no_face' && (
                            <div className="grid grid-cols-4 gap-2 text-xs text-center">
                                {[
                                    {
                                        label: 'Position',
                                        value: faceStatus.position === 'ok' ? '✓ Good'
                                            : faceStatus.position === 'too_far' ? '↑ Closer'
                                                : faceStatus.position === 'too_close' ? '↓ Back' : '⊕ Centre',
                                        ok: faceStatus.position === 'ok',
                                    },
                                    {
                                        label: 'Turn',
                                        value: faceStatus.direction === 'front' ? '· Front'
                                            : faceStatus.direction === 'left' ? '← Left' : '→ Right',
                                        ok: nextStep === 'left'  ? faceStatus.direction === 'left'
                                            : nextStep === 'right' ? faceStatus.direction === 'right'
                                                : faceStatus.direction === 'front',
                                    },
                                    {
                                        label: 'Tilt',
                                        value: faceStatus.pitch === 'ok' ? '· Level'
                                            : faceStatus.pitch === 'up' ? '↑ Up' : '↓ Down',
                                        ok: nextStep === 'up'   ? faceStatus.pitch === 'up'
                                            : nextStep === 'down' ? faceStatus.pitch === 'down'
                                                : faceStatus.pitch === 'ok',
                                    },
                                    {
                                        label: 'Smile',
                                        value: faceStatus.smile > 0.6 ? '😄 Big'
                                            : faceStatus.smile > 0.3 ? '🙂 Light' : '😐 None',
                                        ok: nextStep === 'smile' ? faceStatus.smile >= 0.4 : faceStatus.smile < 0.35,
                                    },
                                ].map(m => (
                                    <div key={m.label} className={`rounded-xl border py-2 px-1 transition-colors ${
                                        m.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-stone-50 border-stone-200 text-stone-500'
                                    }`}>
                                        <div className="text-[10px] uppercase tracking-wide mb-0.5 opacity-70">{m.label}</div>
                                        <div className="font-semibold">{m.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Step cards */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {REQUIRED_STEPS.map(step => {
                                const done   = completedSteps.includes(step);
                                const active = currentStep === step && !done && cameraReady;
                                const isFrontBlink = active && step === 'front' && blinkReady;
                                return (
                                    <div key={step} className={`rounded-2xl border p-3 transition-colors text-center ${
                                        done         ? 'border-emerald-200 bg-emerald-50'
                                            : isFrontBlink ? 'border-blue-300 bg-blue-50 shadow-sm'
                                                : active     ? 'border-amber-300 bg-amber-50 shadow-sm'
                                                    :               'border-stone-200 bg-white'
                                    }`}>
                                        <div className="text-xl mb-1">{STEP_INSTRUCTIONS[step].icon}</div>
                                        <div className={`text-[11px] font-semibold capitalize ${
                                            done ? 'text-emerald-600'
                                                : isFrontBlink ? 'text-blue-600'
                                                    : active ? 'text-amber-600'
                                                        : 'text-stone-400'
                                        }`}>
                                            {done ? '✓ Done' : active ? (isFrontBlink ? 'Blink!' : 'Now') : step}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Right: progress + captures ───────────────────────── */}
                    <div className="space-y-4">

                        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                            <h3 className="font-semibold text-stone-900 mb-3">Scan progress</h3>
                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-stone-600">Poses captured</span>
                                    <span className="font-semibold">{completedSteps.length}/{REQUIRED_STEPS.length}</span>
                                </div>
                                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                                </div>
                            </div>

                            {/* Checklist */}
                            <div className="space-y-2">
                                {REQUIRED_STEPS.map(step => {
                                    const done   = completedSteps.includes(step);
                                    const active = currentStep === step && !done && cameraReady;
                                    return (
                                        <div key={step} className="flex items-center gap-2 text-xs">
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                done   ? 'bg-emerald-500 text-white'
                                                    : active ? 'bg-amber-400 text-white animate-pulse'
                                                        :          'bg-stone-200 text-stone-400'
                                            }`}>
                                                {done ? '✓' : STEP_INSTRUCTIONS[step].icon}
                                            </span>
                                            <span className={done ? 'text-emerald-700 font-medium' : active ? 'text-amber-700 font-medium' : 'text-stone-500'}>
                                                {step.charAt(0).toUpperCase() + step.slice(1)}
                                                {step === 'front' ? ' — blink to confirm' : ' — auto-capture'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 rounded-xl bg-stone-50 border border-stone-100 p-3 text-[11px] text-stone-500 space-y-1 leading-snug">
                                <p>• <strong>Front:</strong> face forward, no smile, then blink once naturally.</p>
                                <p>• <strong>Left / Right:</strong> turn head, hold 2 s — auto-captures.</p>
                                <p>• <strong>Up / Down:</strong> tilt chin, hold 2 s — auto-captures.</p>
                                <p>• <strong>Smile:</strong> show teeth, hold 2 s — auto-captures.</p>
                                <p>• Glasses detected? Remove them — all captures are blocked.</p>
                                <p>• Redirected to dashboard automatically when done.</p>
                            </div>
                        </div>

                        {/* Captured frames */}
                        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                            <h3 className="font-semibold text-stone-900 mb-3 text-sm">Captured frames</h3>
                            {session?.captures?.length ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {session.captures.slice(-4).reverse().map(capture => (
                                        <div key={capture.id} className="rounded-xl overflow-hidden bg-white border border-stone-200">
                                            <img src={cfImageUrl(capture.image_path) ?? ''} alt={capture.capture_key} className="w-full aspect-3/4 object-cover" />
                                            <div className="px-2 py-1.5 text-[10px] text-stone-500 flex justify-between gap-1">
                                                <span className="capitalize font-medium">{capture.capture_key}</span>
                                                <span>{capture.captured_at ? new Date(capture.captured_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-stone-400 text-center py-4">No captures yet.</p>
                            )}
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                            <h3 className="font-semibold text-stone-900 mb-1.5 text-sm">What happens next?</h3>
                            <p className="text-xs leading-relaxed text-stone-600">
                                After all 6 photos are taken you'll go straight to your dashboard — no waiting.
                                An admin reviews your photos in the background. Your account stays fully active while pending.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}