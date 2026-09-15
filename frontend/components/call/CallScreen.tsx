'use client';

import {useEffect, useRef, useCallback, useState, type RefObject, type SyntheticEvent} from 'react';
import Swal from 'sweetalert2';
import { swalDefaults } from '@/lib/toast';
import {useCallStore} from '@/store/callStore';
import {callService} from '@/services/callService';
import {WebRTCManager} from '@/lib/webrtc';
import {matchesCallId} from '@/lib/callDismiss';
import {startCallerRingback, stopAllCallSounds, stopCallerRingback} from '@/lib/soundPlayer';
import type {WebRTCSignalPayload} from '@/types/call';
import {cfImageUrl} from '@/lib/utils';

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Renders WebRTC video centered with native camera aspect ratio (no crop). */
function CenteredCallVideo({
    videoRef,
    muted = false,
    className = '',
    hidden = false,
    fill = false,
}: {
    videoRef: RefObject<HTMLVideoElement | null>;
    muted?: boolean;
    className?: string;
    hidden?: boolean;
    /** Fill a fixed-size container (PiP) while preserving aspect ratio */
    fill?: boolean;
}) {
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    const syncAspectRatio = useCallback((video: HTMLVideoElement) => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            setAspectRatio(video.videoWidth / video.videoHeight);
        }
    }, []);

    const handleLoadedMetadata = useCallback((e: SyntheticEvent<HTMLVideoElement>) => {
        syncAspectRatio(e.currentTarget);
    }, [syncAspectRatio]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onResize = () => syncAspectRatio(video);
        video.addEventListener('resize', onResize);
        syncAspectRatio(video);

        return () => video.removeEventListener('resize', onResize);
    }, [videoRef, syncAspectRatio]);

    if (hidden) {
        return (
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="hidden"
                onLoadedMetadata={handleLoadedMetadata}
            />
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            onLoadedMetadata={handleLoadedMetadata}
            className={`block object-contain ${fill ? 'w-full h-full' : 'max-w-full max-h-full w-auto h-auto'} ${className}`}
            style={!fill && aspectRatio ? {aspectRatio: `${aspectRatio}`} : undefined}
        />
    );
}

interface CallScreenProps {
    currentUserId: number;
}

export function CallScreen({currentUserId}: CallScreenProps) {
    const {
        activeCall,
        toggleMic,
        toggleCamera,
        toggleSpeaker,
        endCall,
    } = useCallStore();

    const managerRef = useRef<WebRTCManager | null>(null);
    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [connectionState, setConnectionState] = useState<string>('Connecting…');
    const [isEnding, setIsEnding] = useState(false);
    const [isPipSwapped, setIsPipSwapped] = useState(false);

    const destroyManager = useCallback(() => {
        managerRef.current?.destroy();
        managerRef.current = null;
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
    }, []);

    const handleEnd = useCallback(async () => {
        if (!activeCall || isEnding) return;
        setIsEnding(true);

        const callId = activeCall.callId;
        const isCallerCancelling = activeCall.isCaller
            && (activeCall.status === 'calling' || activeCall.status === 'ringing');

        destroyManager();
        stopAllCallSounds();
        endCall();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('call:ended'));
        }

        // Lightweight notify first so receiver dismisses without waiting for end DB work
        if (isCallerCancelling) {
            void callService.cancelNotify(callId).catch(() => {});
        }
        try {
            await callService.endCall(callId);
        } catch (err: unknown) {
            const status = (err as {response?: {status?: number}})?.response?.status;
            if (status !== 409) {
                console.error('[endCall]', err);
            }
        }
    }, [activeCall, isEnding, destroyManager, endCall]);

    // ── beforeunload: end call when browser/tab closes ────────────────────
    useEffect(() => {
        if (!activeCall?.callId) return;
        const callId = activeCall.callId;
        const handleBeforeUnload = () => {
            const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
            const url = `${process.env.NEXT_PUBLIC_API_URL}/calls/${callId}/end`;
            // fetch with keepalive is reliable in beforeunload
            fetch(url, {
                method: 'PUT',
                headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                keepalive: true,
            }).catch(() => {});
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeCall?.callId]);

    // ── Caller ringback (bip-bip) only after receiver is ringing ─────────
    useEffect(() => {
        const shouldRingback = activeCall?.isCaller && activeCall?.status === 'ringing';
        if (!shouldRingback) {
            stopCallerRingback();
            return;
        }

        void startCallerRingback();
        return () => stopCallerRingback();
    }, [activeCall?.isCaller, activeCall?.status]);

    // ── Caller UI label: Calling… → Ringing… → Connecting… ───────────────
    useEffect(() => {
        if (!activeCall?.isCaller) return;
        if (activeCall.status === 'calling') setConnectionState('Calling…');
        else if (activeCall.status === 'ringing') setConnectionState('Ringing…');
        else if (activeCall.status === 'connecting') setConnectionState('Connecting…');
    }, [activeCall?.isCaller, activeCall?.status]);

    // ── Set up WebRTC + Reverb signaling ─────────────────────────────────
    useEffect(() => {
        if (!activeCall) return;

        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getPrivateChannel} = await import('@/lib/echo');
            channel = await getPrivateChannel(`user.${currentUserId}`);
            if (cancelled || !channel) return;

            const manager = new WebRTCManager({
                callId: activeCall.callId,
                localUserId: currentUserId,
                remoteUserId: activeCall.remoteParticipant.id,
                iceServers: activeCall.iceServers,
                callType: activeCall.callType,

                onRemoteStream: (stream) => {
                    if (remoteVideoRef.current) {
                        remoteVideoRef.current.srcObject = stream;
                        remoteVideoRef.current.play().catch(() => {});
                    }
                    // Ensure status is 'active' and timer is running
                    useCallStore.getState().setCallStatus('active');
                    setConnectionState('Connected');
                    if (!durationIntervalRef.current) {
                        durationIntervalRef.current = setInterval(
                            () => useCallStore.getState().tickDuration(),
                            1000,
                        );
                    }
                },

                onIceConnectionChange: (state) => {
                    const labels: Partial<Record<RTCIceConnectionState, string>> = {
                        checking:     'Connecting…',
                        connected:    'Connected',
                        completed:    'Connected',
                        failed:       'Connection failed',
                        disconnected: 'Reconnecting…',
                        closed:       'Ended',
                    };
                    setConnectionState(labels[state] ?? state);

                    // Fallback: start timer as soon as ICE connects in case ontrack fires late
                    if (state === 'connected' || state === 'completed') {
                        useCallStore.getState().setCallStatus('active');
                        if (!durationIntervalRef.current) {
                            durationIntervalRef.current = setInterval(
                                () => useCallStore.getState().tickDuration(),
                                1000,
                            );
                        }
                    }

                    if (state === 'failed') handleEnd();
                },

                onError: async (err) => {
                    const msg = err.message.toLowerCase();
                    const isDeviceError = msg.includes('device') || msg.includes('not found') || msg.includes('in use');
                    const isPermission = isDeviceError || msg.includes('permission') ||
                        msg.includes('access') || msg.includes('microphone') || msg.includes('camera');
                    const isLost = msg.includes('connection lost') || msg.includes('connection failed');

                    setConnectionState(isPermission ? 'Device error' : err.message);

                    if (isLost) {
                        destroyManager();
                        try { await callService.endCall(activeCall.callId); } catch { /* ignore */ }
                        endCall();
                        return;
                    }

                    await Swal.fire({
                        ...swalDefaults,
                        title: isDeviceError ? 'Device Not Found' : isPermission ? 'Permission Required' : 'Call Error',
                        text: err.message,
                        icon: 'error',
                    });

                    if (isPermission) handleEnd();
                },
            });

            managerRef.current = manager;

            // Inbound WebRTC signals
            channel.listen('.webrtc.signal', async (e: WebRTCSignalPayload) => {
                if (cancelled || e.call_id !== activeCall.callId) return;

                // Media-status is relayed via signaling (no data channel)
                if (e.type === 'media-status') {
                    const ms = e.payload as {isMuted: boolean; isCameraOff: boolean};
                    useCallStore.getState().setRemoteMediaStatus(
                        Boolean(ms.isMuted),
                        Boolean(ms.isCameraOff),
                    );
                    return;
                }

                await manager.handleRemoteSignal(
                    e.type as 'offer' | 'answer' | 'ice-candidate',
                    e.payload as RTCSessionDescriptionInit | RTCIceCandidateInit,
                );
            });

            // Remote party ended
            channel.listen('.call.ended', (e: {call_id: number | string}) => {
                if (cancelled || !matchesCallId(e.call_id, activeCall.callId)) return;
                destroyManager();
                endCall();
                Swal.fire({
                    ...swalDefaults,
                    title: 'Call Ended',
                    text: 'The other party has ended the call.',
                    icon: 'info',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            });

            // Remote party declined (while caller is ringing)
            channel.listen('.call.declined', (e: {call_id: number | string}) => {
                if (cancelled || !matchesCallId(e.call_id, activeCall.callId)) return;
                destroyManager();
                endCall();
                Swal.fire({
                    ...swalDefaults,
                    title: 'Call Declined',
                    text: 'The other party declined the call.',
                    icon: 'info',
                    timer: 2500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                });
            });

            // Caller starts after receiver answers
            if (activeCall.isCaller) {
                channel.listen('.call.answered', async (e: {call_id: number}) => {
                    if (cancelled || e.call_id !== activeCall.callId) return;
                    setConnectionState('Connecting…');
                    useCallStore.getState().setCallStatus('connecting');
                    await manager.startAsCaller();
                    const ls = manager.getLocalStream();
                    if (ls && localVideoRef.current) {
                        localVideoRef.current.srcObject = ls;
                        localVideoRef.current.play().catch(() => {});
                    }
                });
            } else {
                // Receiver: start immediately, offer will arrive
                await manager.startAsReceiver();
                setConnectionState('Connecting…');
                useCallStore.getState().setCallStatus('connecting');
                const ls = manager.getLocalStream();
                if (ls && localVideoRef.current) {
                    localVideoRef.current.srcObject = ls;
                    localVideoRef.current.play().catch(() => {});
                }
            }
        })();

        return () => {
            cancelled = true;
            destroyManager();
            (async () => {
                if (channel) {
                    channel.stopListening('.webrtc.signal');
                    channel.stopListening('.call.ended');
                    channel.stopListening('.call.declined');
                    channel.stopListening('.call.answered');
                }
            })();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCall?.callId]);

    // Sync local mute/camera to WebRTC tracks
    useEffect(() => {
        managerRef.current?.setAudioEnabled(!(activeCall?.isMicMuted ?? false));
    }, [activeCall?.isMicMuted]);

    useEffect(() => {
        managerRef.current?.setVideoEnabled(!(activeCall?.isCameraOff ?? false));
    }, [activeCall?.isCameraOff]);

    // Broadcast local media status to remote peer via signaling server
    useEffect(() => {
        if (!activeCall || activeCall.status !== 'active') return;
        callService.sendSignal(
            activeCall.callId,
            activeCall.remoteParticipant.id,
            'media-status',
            {isMuted: activeCall.isMicMuted, isCameraOff: activeCall.isCameraOff},
        ).catch(() => {});
    }, [activeCall?.isMicMuted, activeCall?.isCameraOff, activeCall?.status]);

    if (!activeCall) return null;

    const {callType, remoteParticipant, isMicMuted, isCameraOff, isSpeakerOff, durationSeconds, status, remoteMicMuted, remoteCameraOff} = activeCall;
    const isVideo = callType === 'video';
    const initials = remoteParticipant.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    // Wrapper handlers — toggle store state; the useEffect above broadcasts the change
    const handleToggleMic = () => { toggleMic(); };
    const handleToggleCamera = () => { toggleCamera(); };

    // ── Audio call layout ─────────────────────────────────────────────────
    if (!isVideo) {
        return (
            <div className="fixed inset-0 z-[9998] flex flex-col bg-linear-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
                {/* Hidden audio players */}
                <CenteredCallVideo videoRef={remoteVideoRef} hidden/>
                <CenteredCallVideo videoRef={localVideoRef} muted hidden/>

                {/* Status bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 shrink-0">
                    <span className="text-[11px] sm:text-xs text-white/40 font-medium uppercase tracking-widest">
                        Audio Call
                    </span>
                    <StatusIndicator state={status}/>
                </div>

                {/* Center — avatar */}
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="relative mb-6 sm:mb-8">
                        {status === 'active' && (
                            <>
                                <div className="absolute inset-0 rounded-full bg-[#FFCF00]/20 animate-ping"/>
                                <div className="absolute -inset-3 rounded-full bg-[#FFCF00]/10 animate-ping" style={{animationDelay: '0.4s'}}/>
                            </>
                        )}
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-white/20"/>
                        ) : (
                            <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-linear-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center">
                                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                    </div>

                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 text-center px-4 max-w-xs sm:max-w-sm truncate">
                        {remoteParticipant.name}
                    </h2>
                    {remoteParticipant.profile_id && (
                        <p className="text-xs text-white/30 font-mono mb-3">{remoteParticipant.profile_id}</p>
                    )}
                    <p className="text-base sm:text-lg text-white/60 tabular-nums">
                        {status === 'active' ? formatDuration(durationSeconds) : connectionState}
                    </p>

                    {/* Local mic muted indicator */}
                    {isMicMuted && (
                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                            <span className="text-xs text-red-400 font-medium">You are muted</span>
                        </div>
                    )}

                    {/* Remote mic muted indicator (WhatsApp-style) */}
                    {remoteMicMuted && status === 'active' && (
                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
                                <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                            <span className="text-xs text-orange-400 font-medium">{remoteParticipant.name} muted</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <CallControls
                    isVideo={false}
                    isMicMuted={isMicMuted}
                    isCameraOff={isCameraOff}
                    isSpeakerOff={isSpeakerOff}
                    isEnding={isEnding}
                    onToggleMic={handleToggleMic}
                    onToggleCamera={handleToggleCamera}
                    onToggleSpeaker={toggleSpeaker}
                    onEnd={handleEnd}
                />
            </div>
        );
    }

    // ── Video call layout ─────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[9998] bg-black flex flex-col min-h-0 min-w-0">
            {/* Remote video — centered, native camera aspect ratio */}
            <div className="relative flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
                <CenteredCallVideo videoRef={remoteVideoRef} className="mx-auto"/>

                {/* Remote placeholder while connecting */}
                {status !== 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-linear-to-b from-[#1a1a2e] to-[#0f0f1a]">
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-white/20 mb-4"/>
                        ) : (
                            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-linear-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center mb-4">
                                <span className="text-3xl sm:text-4xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                        <p className="text-white text-lg sm:text-xl font-semibold">{remoteParticipant.name}</p>
                        <p className="text-white/55 text-sm mt-1">{connectionState}</p>
                    </div>
                )}

                {/* Remote camera-off overlay (WhatsApp-style) */}
                {remoteCameraOff && status === 'active' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a2e]/90">
                        {remoteParticipant.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(remoteParticipant.avatar) ?? ''} alt={remoteParticipant.name}
                                 className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-2 border-white/20 mb-3"/>
                        ) : (
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-linear-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center mb-3">
                                <span className="text-3xl sm:text-4xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                        <p className="text-white/60 text-sm">Camera off</p>
                    </div>
                )}

                {/* Local video PiP — tappable to swap */}
                <div
                    className={`absolute z-20 flex items-center justify-center border-2 border-white/20 bg-black rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-2xl cursor-pointer transition-all active:scale-95
                        ${isPipSwapped
                            ? 'bottom-3 left-3 sm:bottom-4 sm:left-4 w-[72px] h-[96px] min-[360px]:w-20 min-[360px]:h-[108px] sm:w-28 sm:h-[148px] md:w-32 md:h-44'
                            : 'top-3 right-3 sm:top-4 sm:right-4 w-[72px] h-[96px] min-[360px]:w-20 min-[360px]:h-[108px] sm:w-28 sm:h-[148px] md:w-32 md:h-44'}`}
                    onClick={() => setIsPipSwapped((p) => !p)}
                    title="Tap to swap"
                >
                    <CenteredCallVideo
                        videoRef={localVideoRef}
                        muted
                        fill
                        className={isCameraOff ? 'invisible' : ''}
                    />
                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
                            <span className="text-sm font-bold text-white/50">OFF</span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                        </svg>
                    </div>
                </div>

                {/* Top HUD */}
                <div className="absolute top-0 left-0 right-0 px-3 sm:px-4 pt-safe py-3 sm:py-4 flex items-center justify-between
                                bg-linear-to-b from-black/60 to-transparent">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="text-white font-semibold text-sm min-[360px]:text-base sm:text-lg leading-tight truncate max-w-[120px] min-[360px]:max-w-[180px] sm:max-w-xs">
                                {remoteParticipant.name}
                            </p>
                            {/* Remote muted badge in HUD */}
                            {remoteMicMuted && status === 'active' && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500/30 border border-orange-500/40">
                                    <svg className="w-3 h-3 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                        <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        <p className="text-white/65 text-xs sm:text-sm tabular-nums">
                            {status === 'active' ? formatDuration(durationSeconds) : connectionState}
                        </p>
                    </div>
                    <StatusIndicator state={status}/>
                </div>
            </div>

            {/* Controls */}
            <CallControls
                isVideo={true}
                isMicMuted={isMicMuted}
                isCameraOff={isCameraOff}
                isSpeakerOff={isSpeakerOff}
                isEnding={isEnding}
                onToggleMic={handleToggleMic}
                onToggleCamera={handleToggleCamera}
                onToggleSpeaker={toggleSpeaker}
                onEnd={handleEnd}
            />
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

interface CallControlsProps {
    isVideo: boolean;
    isMicMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOff: boolean;
    isEnding: boolean;
    onToggleMic: () => void;
    onToggleCamera: () => void;
    onToggleSpeaker: () => void;
    onEnd: () => void;
}

function CallControls({isVideo, isMicMuted, isCameraOff, isSpeakerOff, isEnding, onToggleMic, onToggleCamera, onToggleSpeaker, onEnd}: CallControlsProps) {
    return (
        <div className="shrink-0 bg-black/85 backdrop-blur-md px-4 sm:px-8 py-4 sm:py-5 safe-area-pb">
            <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 max-w-sm sm:max-w-md mx-auto">
                {/* Mute / Unmute */}
                <CtrlBtn
                    active={isMicMuted}
                    label={isMicMuted ? 'Unmute' : 'Mute'}
                    onClick={onToggleMic}
                    icon={
                        isMicMuted ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                                <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v3M8 23h8"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/>
                            </svg>
                        )
                    }
                />

                {/* Camera toggle (video only) */}
                {isVideo && (
                    <CtrlBtn
                        active={isCameraOff}
                        label={isCameraOff ? 'Camera' : 'Hide'}
                        onClick={onToggleCamera}
                        icon={
                            isCameraOff ? (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18"/>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                </svg>
                            )
                        }
                    />
                )}

                {/* End Call */}
                <button
                    onClick={onEnd}
                    disabled={isEnding}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-60
                               flex items-center justify-center shadow-xl shadow-red-500/40 transition-all"
                    aria-label="End call"
                >
                    {isEnding ? (
                        <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                    ) : (
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white rotate-135" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                        </svg>
                    )}
                </button>

                {/* Speaker */}
                <CtrlBtn
                    active={isSpeakerOff}
                    label={isSpeakerOff ? 'Speaker' : 'Sound'}
                    onClick={onToggleSpeaker}
                    icon={
                        isSpeakerOff ? (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/>
                            </svg>
                        )
                    }
                />

                {/* Placeholder to balance when no camera button */}
                {!isVideo && <div className="w-12 sm:w-14 opacity-0 pointer-events-none"/>}
            </div>
        </div>
    );
}

function CtrlBtn({label, active, onClick, icon}: {label: string; active: boolean; onClick: () => void; icon: React.ReactNode}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={onClick}
                className={`w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all active:scale-95
                    ${active ? 'bg-white/25 text-white' : 'bg-white/10 hover:bg-white/20 text-white/75'}`}
                aria-label={label}
            >
                {icon}
            </button>
            <span className="text-[10px] sm:text-[11px] text-white/45 leading-none">{label}</span>
        </div>
    );
}

function StatusIndicator({state}: {state: string}) {
    const isLive = state === 'active';
    const isCalling = state === 'calling';
    const isRinging = state === 'ringing';
    const label = isLive ? 'Live' : isRinging ? 'Ringing' : isCalling ? 'Calling' : 'Connecting';
    return (
        <div className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-semibold
            ${isLive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}/>
            <span className="hidden xs:inline">{label}</span>
        </div>
    );
}
