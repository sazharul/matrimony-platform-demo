'use client';

import {useState, useCallback} from 'react';
import Swal from 'sweetalert2';
import { swalDefaults } from '@/lib/toast';
import {useCallStore} from '@/store/callStore';
import {callService} from '@/services/callService';
import type {CallParticipant, CallType} from '@/types/call';

interface CallButtonProps {
    receiverId: number;
    receiver: CallParticipant;
    type: CallType;
    className?: string;
}

/**
 * CallButton — initiates an outgoing audio or video call.
 * Used in the ChatWindow header.
 */
export function CallButton({receiverId, receiver, type, className = ''}: CallButtonProps) {
    const {activeCall, startOutgoingCall} = useCallStore();
    const [isInitiating, setIsInitiating] = useState(false);

    const handleCall = useCallback(async () => {
        if (activeCall || isInitiating) return;
        setIsInitiating(true);
        try {
            const {call, ice_servers} = await callService.initiateCall(receiverId, type);
            startOutgoingCall(call.id, type, receiver, ice_servers);
        } catch (err: unknown) {
            const errObj = err && typeof err === 'object' ? err as {response?: {status?: number; data?: {message?: string; data?: {active_call_id?: number}}}} : null;
            const status = errObj?.response?.status;
            const msg = errObj?.response?.data?.message ?? null;
            const staleCallId = errObj?.response?.data?.data?.active_call_id ?? null;

            // 409: stale call still "active" in the backend (e.g. after reload)
            // Auto-end it silently and retry once
            if (status === 409 && staleCallId) {
                try {
                    await callService.endCall(staleCallId);
                    const {call, ice_servers} = await callService.initiateCall(receiverId, type);
                    startOutgoingCall(call.id, type, receiver, ice_servers);
                    return; // success — skip the error dialog
                } catch {
                    // Retry also failed — fall through to show generic error
                }
            }

            await Swal.fire({
                ...swalDefaults,
                title: type === 'video' ? 'Video Call Failed' : 'Audio Call Failed',
                text: msg ?? 'Unable to start the call. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
            });
        } finally {
            setIsInitiating(false);
        }
    }, [activeCall, isInitiating, receiverId, type, receiver, startOutgoingCall]);

    const disabled = !!activeCall || isInitiating;

    return (
        <button
            onClick={handleCall}
            disabled={disabled}
            title={type === 'video' ? 'Video call' : 'Audio call'}
            aria-label={type === 'video' ? 'Start video call' : 'Start audio call'}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                text-meta hover:text-[#1A1208] hover:bg-[#FFCF00]/10 ${className}`}
        >
            {isInitiating ? (
                <span className="w-4 h-4 border-2 border-[#FFCF00]/30 border-t-[#FFCF00] rounded-full animate-spin"/>
            ) : type === 'video' ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
            ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
            )}
        </button>
    );
}
