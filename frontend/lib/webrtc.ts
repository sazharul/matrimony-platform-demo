import {callService} from '@/services/callService';
import type {IceServer} from '@/types/call';

type SignalType = 'offer' | 'answer' | 'ice-candidate';

/**
 * Sanitize SDP before setRemoteDescription / sendSignal.
 *
 * Removes attributes that cause "Invalid SDP line" across browsers:
 *
 *  a=ssrc:<id> msid:<value>    — Two-token msid value (stream-id + track-id) violates
 *                                RFC 5576 grammar (unquoted space in attribute value).
 *                                Strict parsers (Firefox, some Chrome versions) reject it.
 *                                Safe to remove: modern Unified Plan already carries the
 *                                stream→track binding via `a=msid` at the media-section level.
 *  a=ssrc:<id> mslabel:<value> — Deprecated Plan-B attribute, not in RFC 8830.
 *  a=ssrc:<id> label:<value>   — Deprecated Plan-B attribute, not in RFC 8830.
 */
function sanitizeSdp(sdp: string): string {
    if (!sdp) return sdp;
    const lines = sdp.split(/\r?\n/);

    const filtered = lines.filter((line) => {
        // Keep empty lines (including the trailing empty string after split)
        if (line === '') return true;

        if (line.startsWith('a=ssrc:') || line.startsWith('a=ssrc-group:')) {
            return false;
        }
        if (line.includes('telephone-event')) {
            return false;
        }
        if (line.includes('CN/')) {
            return false;
        }
        return true;
    });

    if (process.env.NODE_ENV === 'development' && filtered.length !== lines.length) {
        console.debug(`[WebRTC] sanitizeSdp removed ${lines.length - filtered.length} problematic lines`);
    }

    // SDP MUST end with \r\n — Chrome's parser rejects SDPs without the trailing CRLF.
    // After split(/\r?\n/), the last element is '' (empty string from the trailing newline).
    // join('\r\n') reconstructs it correctly only if that empty string is preserved above.
    const result = filtered.join('\r\n');

    // Belt-and-suspenders: ensure trailing CRLF is always present
    return result.endsWith('\r\n') ? result : result + '\r\n';
}

interface WebRTCManagerOptions {
    callId: number;
    localUserId: number;
    remoteUserId: number;
    iceServers: IceServer[];
    callType: 'audio' | 'video';
    onRemoteStream: (stream: MediaStream) => void;
    onIceConnectionChange: (state: RTCIceConnectionState) => void;
    onError: (err: Error) => void;
}

/**
 * WebRTCManager — handles the full peer-to-peer WebRTC lifecycle.
 */
export class WebRTCManager {
    private pc: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;  // accumulated remote tracks (Chrome-safe)
    private pendingCandidates: RTCIceCandidateInit[] = [];
    private opts: WebRTCManagerOptions;
    private destroyed = false;
    private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(opts: WebRTCManagerOptions) {
        this.opts = opts;
    }

    // ── Public API ──────────────────────────────────────────────────────────

    /** Called by the CALLER after receiving answerCall response. */
    async startAsCaller(): Promise<void> {
        await this._initPeerConnection();

        // NOTE: Do NOT pass offerToReceiveAudio/Video — those are Plan-B era options
        // deprecated in Unified Plan (Chrome M96+). Since we called addTrack() above,
        // transceivers are already configured as sendrecv. Just createOffer().
        const offer = await this.pc!.createOffer();
        await this.pc!.setLocalDescription(offer);

        // Send sanitized offer — receiver may reject ssrc-level msid/mslabel/label lines
        const cleanOffer: RTCSessionDescriptionInit = {
            type: offer.type,
            sdp: sanitizeSdp(offer.sdp ?? ''),
        };
        if (process.env.NODE_ENV === 'development') {
            console.debug('[WebRTC] Sending offer:', cleanOffer.sdp?.split(/\r?\n/).length, 'lines');
        }
        await this._sendSignal('offer', cleanOffer);
    }

    /** Called by the RECEIVER after answering, before creating answer. */
    async startAsReceiver(): Promise<void> {
        await this._initPeerConnection();
    }

    /** Called when a WebRTC signal arrives from Reverb. */
    async handleRemoteSignal(
        type: SignalType,
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
    ): Promise<void> {
        if (this.destroyed || !this.pc) return;

        if (type === 'offer') {
            const desc = payload as RTCSessionDescriptionInit;
            const cleanSdp = sanitizeSdp(desc.sdp ?? '');
            if (process.env.NODE_ENV === 'development') {
                console.debug('[WebRTC] Received offer, setting remote description');
            }
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                type: desc.type,
                sdp: cleanSdp,
            }));
            await this._flushPendingCandidates();
            const answer = await this.pc.createAnswer();
            await this.pc.setLocalDescription(answer);

            // Send sanitized answer
            const cleanAnswer: RTCSessionDescriptionInit = {
                type: answer.type,
                sdp: sanitizeSdp(answer.sdp ?? ''),
            };
            if (process.env.NODE_ENV === 'development') {
                console.debug('[WebRTC] Sending answer:', cleanAnswer.sdp?.split(/\r?\n/).length, 'lines');
            }
            await this._sendSignal('answer', cleanAnswer);

        } else if (type === 'answer') {
            const desc = payload as RTCSessionDescriptionInit;
            const cleanSdp = sanitizeSdp(desc.sdp ?? '');
            if (process.env.NODE_ENV === 'development') {
                console.debug('[WebRTC] Received answer, setting remote description');
            }
            await this.pc.setRemoteDescription(new RTCSessionDescription({
                type: desc.type,
                sdp: cleanSdp,
            }));
            await this._flushPendingCandidates();

        } else if (type === 'ice-candidate') {
            const candidate = payload as RTCIceCandidateInit;
            if (this.pc.remoteDescription) {
                await this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            } else {
                this.pendingCandidates.push(candidate);
            }
        }
    }

    /** Get the local MediaStream (for local video preview). */
    getLocalStream(): MediaStream | null {
        return this.localStream;
    }

    /** Toggle local audio track. */
    setAudioEnabled(enabled: boolean): void {
        this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    }

    /** Toggle local video track (video calls only). */
    setVideoEnabled(enabled: boolean): void {
        this.localStream?.getVideoTracks().forEach((t) => (t.enabled = enabled));
    }

    /** Clean up everything. */
    destroy(): void {
        this.destroyed = true;
        if (this.disconnectTimer) {
            clearTimeout(this.disconnectTimer);
            this.disconnectTimer = null;
        }
        this.localStream?.getTracks().forEach((t) => t.stop());
        this.localStream = null;
        // Don't stop remote tracks — they're owned by the remote peer.
        // Just clear our reference so the stream can be GC'd.
        this.remoteStream = null;
        this.pc?.close();
        this.pc = null;
        this.pendingCandidates = [];
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private async _initPeerConnection(): Promise<void> {
        const rtcConfig: RTCConfiguration = {
            iceServers: this.opts.iceServers,
            iceCandidatePoolSize: 10,
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
        };

        (rtcConfig as any).sdpSemantics = 'unified-plan';

        this.pc = new RTCPeerConnection(rtcConfig);

        if (process.env.NODE_ENV === 'development') {
            console.debug('[WebRTC] PeerConnection created');
        }

        // Acquire local media
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: this.opts.callType === 'video'
                    ? {width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 30}}
                    : false,
            });
            if (process.env.NODE_ENV === 'development') {
                const tracks = this.localStream.getTracks().map((t) => `${t.kind}:${t.label}`);
                console.debug('[WebRTC] Local media acquired:', tracks);
            }
        } catch (err) {
            const name = (err instanceof Error) ? err.name : '';
            let message: string;
            if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                message = 'No microphone or camera device was found. Please connect a device and try again.';
            } else if (name === 'NotReadableError' || name === 'TrackStartError') {
                message = 'Your microphone or camera is already in use by another application.';
            } else if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                message = 'Could not access microphone/camera. Please allow permissions.';
            } else {
                message = 'Could not access microphone/camera. Please check your device and permissions.';
            }
            this.opts.onError(new Error(message));
            throw err;
        }

        // Add tracks to peer connection
        this.localStream.getTracks().forEach((track) => {
            this.pc!.addTrack(track, this.localStream!);
        });

        // Remote stream
        // ─────────────────────────────────────────────────────────────────
        // Chrome (Unified Plan) fires ontrack with event.streams[0] as an
        // EMPTY MediaStream object before the track is inserted into it —
        // setting that empty stream as srcObject plays nothing.
        // Firefox populates event.streams[0] correctly before firing ontrack.
        //
        // Fix: maintain our own remoteStream and add every received track to
        // it ourselves. This is safe and idempotent across all browsers.
        // ─────────────────────────────────────────────────────────────────
        this.pc.ontrack = (event) => {
            if (this.destroyed) return;

            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
            }
            // Guard against duplicate track events (Chrome can re-fire)
            if (!this.remoteStream.getTrackById(event.track.id)) {
                this.remoteStream.addTrack(event.track);
            }

            if (process.env.NODE_ENV === 'development') {
                const kinds = this.remoteStream.getTracks().map((t) => t.kind);
                console.debug('[WebRTC] Remote track added:', event.track.kind,
                    '| remoteStream tracks now:', kinds);
            }

            this.opts.onRemoteStream(this.remoteStream);
        };

        // ICE candidates
        this.pc.onicecandidate = (event) => {
            if (event.candidate && !this.destroyed) {
                this._sendSignal('ice-candidate', event.candidate.toJSON()).catch(() => {});
            }
        };

        // Connection state
        this.pc.oniceconnectionstatechange = () => {
            if (!this.pc || this.destroyed) return;
            const state = this.pc.iceConnectionState;
            if (process.env.NODE_ENV === 'development') {
                console.debug('[WebRTC] ICE connection state:', state);
            }
            this.opts.onIceConnectionChange(state);

            if (state === 'disconnected') {
                this.disconnectTimer = setTimeout(() => {
                    if (this.pc?.iceConnectionState === 'disconnected' ||
                        this.pc?.iceConnectionState === 'failed') {
                        this.opts.onError(new Error('Connection lost. The call has ended.'));
                    }
                }, 8000);
            } else {
                if (this.disconnectTimer) {
                    clearTimeout(this.disconnectTimer);
                    this.disconnectTimer = null;
                }
            }
        };

        this.pc.onconnectionstatechange = () => {
            if (!this.pc || this.destroyed) return;
            if (process.env.NODE_ENV === 'development') {
                console.debug('[WebRTC] Connection state:', this.pc.connectionState);
            }
            if (this.pc.connectionState === 'failed') {
                this.opts.onError(new Error('WebRTC connection failed.'));
            }
        };
    }

    private async _sendSignal(type: SignalType, payload: RTCSessionDescriptionInit | RTCIceCandidateInit): Promise<void> {
        if (this.destroyed) return;
        await callService.sendSignal(
            this.opts.callId,
            this.opts.remoteUserId,
            type,
            payload,
        );
    }

    private async _flushPendingCandidates(): Promise<void> {
        for (const c of this.pendingCandidates) {
            await this.pc?.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        this.pendingCandidates = [];
    }
}
