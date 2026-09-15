export type CallType = 'audio' | 'video';

export type CallStatus =
    | 'idle'           // no call
    | 'initiating'     // waiting for server response
    | 'calling'        // outgoing — waiting for receiver to get the call
    | 'ringing'        // outgoing — receiver is ringing
    | 'incoming'       // incoming — waiting for user action
    | 'connecting'     // answered, setting up WebRTC
    | 'active'         // call connected
    | 'ended';         // call ended / declined / missed

export interface CallParticipant {
    id: number;
    name: string;
    avatar: string | null;
    profile_id: string | null;
}

export interface IceServer {
    urls: string;
    username?: string;
    credential?: string;
}

export interface CallLog {
    id: number;
    type: CallType;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    created_at: string;
    caller: CallParticipant | null;
    receiver: CallParticipant | null;
}

export interface InitiateCallResponse {
    call: CallLog;
    ice_servers: IceServer[];
}

export interface IncomingCallPayload {
    call_id: number;
    type: CallType;
    caller: CallParticipant;
}

export interface WebRTCSignalPayload {
    call_id: number;
    from_user_id: number;
    type: 'offer' | 'answer' | 'ice-candidate' | 'media-status';
    payload: RTCSessionDescriptionInit | RTCIceCandidateInit | Record<string, unknown>;
}

