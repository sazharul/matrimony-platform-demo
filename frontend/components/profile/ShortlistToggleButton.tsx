'use client';

import { ClockIcon, StarFilledIcon, StarIcon } from '@/components/ui/icons';

interface ShortlistToggleButtonProps {
    isShortlisted: boolean;
    onToggle: () => void;
    isLoading?: boolean;
}

export function ShortlistToggleButton({
    isShortlisted,
    onToggle,
    isLoading,
}: ShortlistToggleButtonProps) {
    return (
        <button
            onClick={onToggle}
            disabled={isLoading}
            title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                isShortlisted
                    ? 'border-[var(--primary)] text-[#1A1208] bg-[var(--accent)]'
                    : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)] hover:text-[#8A7000] hover:bg-[var(--accent)]'
            }`}
        >
            {isLoading ? (
                <><ClockIcon size={12} strokeWidth={1.8} /> Saving…</>
            ) : isShortlisted ? (
                <><StarFilledIcon size={12} strokeWidth={1.8} /> Shortlisted</>
            ) : (
                <><StarIcon size={12} strokeWidth={1.8} /> Shortlist</>
            )}
        </button>
    );
}
