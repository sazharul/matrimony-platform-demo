'use client';

interface MessageUnreadBadgeProps {
    count: number;
    className?: string;
}

/** Gold pill badge — hidden when count is 0. */
export function MessageUnreadBadge({count, className = ''}: MessageUnreadBadgeProps) {
    if (count <= 0) return null;

    const label = count > 99 ? '99+' : String(count);

    return (
        <span
            className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#FFCF00] text-[#1A1208] text-[10px] font-bold leading-none tabular-nums shrink-0 ${className}`}
            aria-label={`${count} unread message${count === 1 ? '' : 's'}`}
        >
            {label}
        </span>
    );
}
