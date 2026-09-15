'use client';

import {useEffect, useRef, useState, useCallback} from 'react';
import Swal from 'sweetalert2';
import { swalDefaults } from '@/lib/toast';
import {useCallStore} from '@/store/callStore';
import {callService} from '@/services/callService';
import {retryIncomingCallRingtoneIfNeeded, startIncomingCallRingtone, stopIncomingCallRingtone} from '@/lib/soundPlayer';
import {cfImageUrl} from '@/lib/utils';

/**
 * IncomingCallModal — WhatsApp-style ring screen.
 * Fully responsive: 320px → 1800px.
 * Bottom sheet on mobile, centered card on desktop.
 */
export function IncomingCallModal() {
    const {incomingCall, clearIncomingCall, startActiveCall} = useCallStore();
    const [isAnswering, setIsAnswering] = useState(false);
    const [isDeclining, setIsDeclining] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState(45);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Track callId to detect re-use of handleDecline after timer fires
    const callIdRef = useRef<number | null>(null);

    // ── Call ringtone + countdown ─────────────────────────────────────────
    useEffect(() => {
        if (!incomingCall) return;
        callIdRef.current = incomingCall.callId;
        setRemainingSeconds(45);
        setIsAnswering(false);
        setIsDeclining(false);

        void startIncomingCallRingtone();
        callService.notifyRinging(incomingCall.callId).catch(() => {});

        // Countdown: just decrement — don't call any store action inside the updater
        intervalRef.current = setInterval(() => {
            setRemainingSeconds((s) => (s <= 1 ? 0 : s - 1));
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopIncomingCallRingtone();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [incomingCall?.callId]);

    // ── Auto-decline when timer reaches 0 ────────────────────────────────
    // Separate effect so we never update Zustand inside a React state updater
    useEffect(() => {
        if (remainingSeconds === 0 && incomingCall && !isAnswering && !isDeclining) {
            const callId = incomingCall.callId;
            stopRing();
            clearIncomingCall();
            callService.declineCall(callId).catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    const stopRing = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        stopIncomingCallRingtone();
    }, []);

    const handleAnswer = useCallback(async () => {
        if (!incomingCall || isAnswering) return;
        setIsAnswering(true);
        stopRing();
        try {
            const {ice_servers} = await callService.answerCall(incomingCall.callId);
            startActiveCall(ice_servers);
        } catch (err: unknown) {
            const msg =
                err && typeof err === 'object' && 'response' in err
                    ? (err as {response?: {data?: {message?: string}}}).response?.data?.message
                    : null;
            clearIncomingCall();
            await Swal.fire({
                ...swalDefaults,
                title: 'Could Not Answer',
                text: msg ?? 'Failed to answer the call. Please try again.',
                icon: 'error',
            });
        }
    }, [incomingCall, isAnswering, stopRing, startActiveCall, clearIncomingCall]);

    const handleDecline = useCallback(async () => {
        if (!incomingCall || isDeclining) return;
        setIsDeclining(true);
        const callId = incomingCall.callId;
        stopRing();
        clearIncomingCall();
        try {
            await callService.declineCall(callId);
        } catch {
            // UI already dismissed — ignore network errors
        }
    }, [incomingCall, isDeclining, stopRing, clearIncomingCall]);

    if (!incomingCall) return null;

    const {caller, callType} = incomingCall;
    const initials = caller.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
            onTouchStart={retryIncomingCallRingtoneIfNeeded}
        >
            {/* Backdrop blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"/>

            {/* Modal — bottom sheet on <sm, centered card on sm+ */}
            <div className="relative z-10 w-full sm:w-[380px] sm:max-w-[90vw] rounded-t-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl">
                {/* Background */}
                <div className="absolute inset-0 bg-linear-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460]"/>

                {/* Top countdown bar */}
                <div className="relative z-10 h-1 bg-white/10">
                    <div
                        className="h-full bg-[#FFCF00] transition-all duration-1000 ease-linear"
                        style={{width: `${(remainingSeconds / 45) * 100}%`}}
                    />
                </div>

                {/* Drag handle (mobile) */}
                <div className="relative z-10 flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20"/>
                </div>

                <div className="relative z-10 flex flex-col items-center px-5 sm:px-8 pt-4 sm:pt-8 pb-8 sm:pb-10 text-center">
                    {/* Label */}
                    <p className="text-[11px] sm:text-xs text-[#FFCF00] font-bold uppercase tracking-widest mb-4 sm:mb-5">
                        {callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Audio Call'}
                    </p>

                    {/* Ripple avatar */}
                    <div className="relative mb-5">
                        <div className="absolute inset-0 rounded-full bg-[#FFCF00]/20 animate-ping"/>
                        <div className="absolute -inset-2 rounded-full bg-[#FFCF00]/10 animate-ping" style={{animationDelay: '0.35s'}}/>
                        <div className="absolute -inset-4 rounded-full bg-[#FFCF00]/5 animate-ping" style={{animationDelay: '0.7s'}}/>
                        {caller.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cfImageUrl(caller.avatar) ?? ''} alt={caller.name}
                                 className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white/20"/>
                        ) : (
                            <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center border-2 border-white/20">
                                <span className="text-2xl sm:text-3xl font-bold text-white">{initials}</span>
                            </div>
                        )}
                    </div>

                    {/* Name + profile ID */}
                    <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight truncate max-w-[260px] sm:max-w-full mb-0.5">
                        {caller.name}
                    </h2>
                    {caller.profile_id && (
                        <p className="text-[11px] text-white/35 font-mono mb-2">{caller.profile_id}</p>
                    )}

                    {/* Breathing dots */}
                    <div className="flex items-center gap-1.5 my-3">
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                                  style={{animationDelay: `${i * 0.18}s`}}/>
                        ))}
                    </div>

                    {/* Auto-dismiss timer */}
                    <p className="text-[11px] text-white/30 mb-6 tabular-nums">
                        Auto-dismiss in {remainingSeconds}s
                    </p>

                    {/* Decline / Answer */}
                    <div className="flex items-center justify-center gap-12 sm:gap-14 w-full">
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={handleDecline}
                                disabled={isDeclining || isAnswering}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 disabled:opacity-55
                                           flex items-center justify-center shadow-xl shadow-red-500/40 transition-all"
                                aria-label="Decline"
                            >
                                {isDeclining ? (
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                                ) : (
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                                        <line x1="4" y1="4" x2="20" y2="20" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                    </svg>
                                )}
                            </button>
                            <span className="text-xs sm:text-sm text-white/50">Decline</span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={handleAnswer}
                                disabled={isAnswering || isDeclining}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-55
                                           flex items-center justify-center shadow-xl shadow-green-500/40 transition-all"
                                aria-label="Answer"
                            >
                                {isAnswering ? (
                                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                                ) : callType === 'video' ? (
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                                    </svg>
                                )}
                            </button>
                            <span className="text-xs sm:text-sm text-white/50">Answer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

