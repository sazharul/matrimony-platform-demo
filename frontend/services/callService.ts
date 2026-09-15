import api from '@/lib/api';
import type {CallLog, CallType, IceServer, InitiateCallResponse} from '@/types/call';

export const callService = {
    /** Fetch ICE server config (STUN + TURN) from the backend. */
    async getIceServers(): Promise<IceServer[]> {
        const res = await api.get('/calls/ice-servers');
        return res.data.data.ice_servers;
    },
    /**
     * Initiate an outgoing audio or video call to a user.
     * Returns the created CallLog + ICE server config.
     */
    async initiateCall(receiverId: number, type: CallType): Promise<InitiateCallResponse> {
        const res = await api.post('/calls/initiate', {receiver_id: receiverId, type});
        return res.data.data;
    },

    /** Accept an incoming call. Returns CallLog + ICE servers for the receiver. */
    async answerCall(callId: number): Promise<InitiateCallResponse> {
        const res = await api.put(`/calls/${callId}/answer`);
        return res.data.data;
    },

    /** Decline an incoming call. */
    async declineCall(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/decline`);
    },

    /** Tell the caller the receiver is now showing the incoming-call UI. */
    async notifyRinging(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/ringing`);
    },

    /** Caller: instant WebSocket push so receiver dismisses before full end completes. */
    async cancelNotify(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/cancel-notify`);
    },

    /** End an active call (caller or receiver can call this). */
    async endCall(callId: number): Promise<void> {
        await api.put(`/calls/${callId}/end`);
    },

    /**
     * Send a WebRTC signaling message (offer, answer, or ICE candidate).
     * The backend relays it to the target user via Reverb.
     */
    async sendSignal(
        callId: number,
        toUserId: number,
        type: 'offer' | 'answer' | 'ice-candidate' | 'media-status',
        payload: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, unknown>,
    ): Promise<void> {
        await api.post(`/calls/${callId}/signal`, {
            to_user_id: toUserId,
            type,
            payload,
        });
    },

    /** Fetch call history (paginated). Pass participantId to filter by conversation partner. */
    async getHistory(page = 1, participantId?: number): Promise<{data: CallLog[]; pagination: {has_more: boolean; total: number; current_page: number; last_page: number}}> {
        const params: Record<string, number> = {page};
        if (participantId) params.participant_id = participantId;
        const res = await api.get('/calls/history', {params});
        return res.data.data;
    },
};

