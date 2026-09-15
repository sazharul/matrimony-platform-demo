'use client';

import type {CallLog} from '@/types/call';

interface CallLogBubbleProps {
    callLog: CallLog;
    currentUserId: number;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return `${h}:${String(rem).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * WhatsApp-style call log entry shown inline in the chat message timeline.
 * Centered, pill-shaped, shows call type, direction, status and duration.
 */
export function CallLogBubble({callLog, currentUserId}: CallLogBubbleProps) {
    const isOutgoing = callLog.caller?.id === currentUserId;
    const isMissed   = callLog.status === 'missed';
    const isDeclined = callLog.status === 'declined';
    const isEnded    = callLog.status === 'ended';
    const isVideo    = callLog.type === 'video';

    // Label logic — matches WhatsApp conventions
    let label: string;
    if (isMissed) {
        label = isOutgoing ? 'No answer' : 'Missed call';
    } else if (isDeclined) {
        label = isOutgoing ? 'Declined' : 'Call declined';
    } else if (isEnded) {
        label = isVideo ? 'Video call' : 'Audio call';
    } else {
        // initiated / answered (shouldn't normally appear but handle gracefully)
        label = isVideo ? 'Video call' : 'Audio call';
    }

    const duration = isEnded && callLog.duration_seconds ? formatDuration(callLog.duration_seconds) : null;
    const isAlert  = isMissed || isDeclined;

    return (
        <div className="flex justify-center my-1.5 px-2">
            <div className={`
                inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2 shadow-sm border
                bg-white
                ${isAlert ? 'border-red-100' : 'border-gray-200'}
                max-w-[260px]
            `}>
                {/* Call type icon */}
                <span className={`flex-shrink-0 ${isAlert ? 'text-red-500' : 'text-[#1A1208]'}`}>
                    {isVideo ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                  d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                        </svg>
                    )}
                </span>

                {/* Direction arrow for outgoing */}
                {isOutgoing && !isAlert && (
                    <svg className="w-3 h-3 text-[#1A1208] flex-shrink-0 -ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                )}
                {!isOutgoing && !isAlert && (
                    <svg className="w-3 h-3 text-green-500 flex-shrink-0 -ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                )}

                {/* Label + duration */}
                <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-medium leading-tight ${isAlert ? 'text-red-600' : 'text-gray-700'}`}>
                        {label}
                    </span>
                    {duration && (
                        <span className="text-[10px] text-[#4A3F2E] leading-tight">{duration}</span>
                    )}
                </div>

                {/* Timestamp */}
                <span className="text-[10px] text-[#4A3F2E] flex-shrink-0 ml-auto pl-1">
                    {formatTime(callLog.created_at)}
                </span>
            </div>
        </div>
    );
}

