import {stopAllCallSounds} from '@/lib/soundPlayer';
import {useCallStore} from '@/store/callStore';

/** Compare call IDs safely (WebSocket payloads may be string or number). */
export function matchesCallId(
    a: number | string | null | undefined,
    b: number | string | null | undefined,
): boolean {
    if (a == null || b == null) return false;
    return Number(a) === Number(b);
}

/** Dismiss incoming/active call UI for a matching call id. */
export function dismissCallById(callId: number | string): void {
    const {incomingCall, activeCall, clearIncomingCall, endCall} = useCallStore.getState();
    let dismissed = false;

    if (matchesCallId(incomingCall?.callId, callId)) {
        stopAllCallSounds();
        clearIncomingCall();
        dismissed = true;
    }
    if (matchesCallId(activeCall?.callId, callId)) {
        stopAllCallSounds();
        endCall();
        dismissed = true;
    }

    if (dismissed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('call:ended'));
    }
}
