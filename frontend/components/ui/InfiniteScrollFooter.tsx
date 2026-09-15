'use client';

import { useEffect, useRef, type RefObject } from 'react';

interface InfiniteScrollFooterProps {
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    onLoadMore: () => void;
    showEndMessage?: boolean;
    endMessage?: string;
    className?: string;
    /** When the list scrolls inside a container, pass that element as the observer root. */
    scrollRootRef?: RefObject<Element | null>;
}

export function InfiniteScrollFooter({
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    showEndMessage = false,
    endMessage = 'No more results',
    className = '',
    scrollRootRef,
}: InfiniteScrollFooterProps) {
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    onLoadMore();
                }
            },
            {root: scrollRootRef?.current ?? null, rootMargin: '240px'},
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, onLoadMore, scrollRootRef]);

    if (!hasNextPage && !isFetchingNextPage && !showEndMessage) {
        return null;
    }

    return (
        <div ref={sentinelRef} className={`flex flex-col items-center justify-center py-6 ${className}`}>
            {isFetchingNextPage && (
                <div
                    className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"
                    aria-label="Loading more"
                />
            )}
            {!hasNextPage && !isFetchingNextPage && showEndMessage && (
                <p className="text-sm text-muted-foreground">{endMessage}</p>
            )}
        </div>
    );
}
