'use client';

import {
    CheckIcon,
    ChatIcon,
    ClockIcon,
    MailIcon,
    XIcon,
} from '@/components/ui/icons';

export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';

export interface InterestConnectionMeta {
    connection_status: ConnectionStatus;
    interest_id: number | null;
    is_interest_sender: boolean;
    conversation_id: number | null;
    can_send_interest?: boolean;
}

interface InterestConnectionActionsProps extends InterestConnectionMeta {
    onSendInterest: () => void;
    onInterestAction?: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage: () => void;
    isSendingInterest?: boolean;
    isMessaging?: boolean;
}

const TERMINAL_LABELS: Record<'declined' | 'ignored', { label: string; className: string }> = {
    declined: {
        label: 'Declined',
        className: 'bg-red-50 text-red-500 border border-red-200',
    },
    ignored: {
        label: 'Ignored',
        className: 'bg-gray-50 text-meta border border-gray-200',
    },
};

export function InterestConnectionActions({
    connection_status,
    interest_id,
    is_interest_sender,
    can_send_interest,
    onSendInterest,
    onInterestAction,
    onMessage,
    isSendingInterest,
    isMessaging,
}: InterestConnectionActionsProps) {
    const canSend = can_send_interest ?? connection_status === 'none';
    const receivedPending =
        connection_status === 'pending' && !is_interest_sender && interest_id && onInterestAction;
    const sentPending = connection_status === 'pending' && is_interest_sender && !canSend;

    return (
        <>
            {canSend && connection_status !== 'pending' && connection_status !== 'accepted' && (
                <button
                    onClick={onSendInterest}
                    disabled={isSendingInterest}
                    className="btn-gold flex items-center gap-1"
                    style={{ height: '2rem', borderRadius: '0.5rem', padding: '0 0.875rem', fontSize: '0.75rem' }}
                >
                    {isSendingInterest
                        ? <><ClockIcon size={12} strokeWidth={1.8} /> Sending…</>
                        : <><MailIcon size={12} strokeWidth={1.8} /> Interest</>
                    }
                </button>
            )}

            {receivedPending && (
                <>
                    <button
                        onClick={() => onInterestAction!(interest_id!, 'accept')}
                        className="btn-gold flex items-center gap-1"
                        style={{ height: '2rem', borderRadius: '0.5rem', padding: '0 0.875rem', fontSize: '0.75rem' }}
                    >
                        <CheckIcon size={12} strokeWidth={2.5} /> Accept
                    </button>
                    <button
                        onClick={() => onInterestAction!(interest_id!, 'decline')}
                        className="px-4 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                    >
                        <XIcon size={12} strokeWidth={2.5} /> Decline
                    </button>
                    <button
                        onClick={() => onInterestAction!(interest_id!, 'ignore')}
                        className="px-3 py-1.5 border border-[var(--border)] text-muted-foreground hover:bg-[var(--muted)] text-xs rounded-lg transition-colors"
                    >
                        Ignore
                    </button>
                </>
            )}

            {sentPending && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                    <CheckIcon size={12} strokeWidth={2.5} /> Already Sent
                </span>
            )}

            {(connection_status === 'declined' || connection_status === 'ignored') && (
                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${TERMINAL_LABELS[connection_status].className}`}>
                    {TERMINAL_LABELS[connection_status].label}
                </span>
            )}

            {connection_status === 'accepted' && (
                <button
                    onClick={onMessage}
                    disabled={isMessaging}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--accent)] transition-colors"
                >
                    {isMessaging
                        ? <><ClockIcon size={12} strokeWidth={1.8} /> Opening…</>
                        : <><ChatIcon size={12} strokeWidth={1.8} /> Message</>
                    }
                </button>
            )}
        </>
    );
}
