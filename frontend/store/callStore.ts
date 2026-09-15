'use client';

import {create} from 'zustand';
import type {CallParticipant, CallStatus, CallType, IceServer} from '@/types/call';

export interface ActiveCallState {
    callId: number;
    callType: CallType;
    status: CallStatus;
    isCaller: boolean;
    remoteParticipant: CallParticipant;
    iceServers: IceServer[];
    isMicMuted: boolean;
    isCameraOff: boolean;
    isSpeakerOff: boolean;
    durationSeconds: number;
    startedAt: number | null; // timestamp ms
    remoteMicMuted: boolean;
    remoteCameraOff: boolean;
}

export interface IncomingCall {
    callId: number;
    callType: CallType;
    caller: CallParticipant;
}

interface CallStore {
    // Active call (in progress)
    activeCall: ActiveCallState | null;

    // Incoming call ring state
    incomingCall: IncomingCall | null;

    // Actions
    setIncomingCall: (incoming: IncomingCall) => void;
    clearIncomingCall: () => void;

    startOutgoingCall: (
        callId: number,
        callType: CallType,
        remoteParticipant: CallParticipant,
        iceServers: IceServer[],
    ) => void;

    startActiveCall: (iceServers: IceServer[]) => void;

    setCallStatus: (status: CallStatus) => void;

    toggleMic: () => void;
    toggleCamera: () => void;
    toggleSpeaker: () => void;

    tickDuration: () => void;

    endCall: () => void;

    /** Update the remote participant's media status (from data channel) */
    setRemoteMediaStatus: (isMuted: boolean, isCameraOff: boolean) => void;
}

export const useCallStore = create<CallStore>()((set, get) => ({
    activeCall: null,
    incomingCall: null,

    setIncomingCall: (incoming) => {
        // Don't override an active call ring
        if (get().activeCall) return;
        set({incomingCall: incoming});
    },

    clearIncomingCall: () => set({incomingCall: null}),

    startOutgoingCall: (callId, callType, remoteParticipant, iceServers) => {
        set({
            incomingCall: null,
            activeCall: {
                callId,
                callType,
                status: 'calling',
                isCaller: true,
                remoteParticipant,
                iceServers,
                isMicMuted: false,
                isCameraOff: false,
                isSpeakerOff: false,
                durationSeconds: 0,
                startedAt: null,
                remoteMicMuted: false,
                remoteCameraOff: false,
            },
        });
    },

    startActiveCall: (iceServers) => {
        // Used when the receiver answers — transition incoming → active
        const incoming = get().incomingCall;
        if (!incoming) return;

        set({
            incomingCall: null,
            activeCall: {
                callId: incoming.callId,
                callType: incoming.callType,
                status: 'connecting',
                isCaller: false,
                remoteParticipant: incoming.caller,
                iceServers,
                isMicMuted: false,
                isCameraOff: false,
                isSpeakerOff: false,
                durationSeconds: 0,
                startedAt: null,
                remoteMicMuted: false,
                remoteCameraOff: false,
            },
        });
    },

    setCallStatus: (status) => {
        const ac = get().activeCall;
        if (!ac) return;
        const startedAt = status === 'active' && !ac.startedAt ? Date.now() : ac.startedAt;
        set({activeCall: {...ac, status, startedAt}});
    },

    toggleMic: () => {
        const ac = get().activeCall;
        if (!ac) return;
        set({activeCall: {...ac, isMicMuted: !ac.isMicMuted}});
    },

    toggleCamera: () => {
        const ac = get().activeCall;
        if (!ac) return;
        set({activeCall: {...ac, isCameraOff: !ac.isCameraOff}});
    },

    toggleSpeaker: () => {
        const ac = get().activeCall;
        if (!ac) return;
        set({activeCall: {...ac, isSpeakerOff: !ac.isSpeakerOff}});
    },

    tickDuration: () => {
        const ac = get().activeCall;
        if (!ac || ac.status !== 'active') return;
        set({activeCall: {...ac, durationSeconds: ac.durationSeconds + 1}});
    },

    endCall: () => set({activeCall: null, incomingCall: null}),

    setRemoteMediaStatus: (isMuted, isCameraOff) => {
        const ac = get().activeCall;
        if (!ac) return;
        set({activeCall: {...ac, remoteMicMuted: isMuted, remoteCameraOff: isCameraOff}});
    },
}));

