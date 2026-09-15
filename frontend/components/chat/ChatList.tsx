'use client';

import {useRef, type RefObject} from 'react';
import Link from 'next/link';
import {cn} from '@/lib/utils';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import type {Conversation} from '@/types/message';

interface ChatListProps {
    conversations: Conversation[];
    activeId?: number;
    isLoading?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
    /** Pass when the list scrolls inside a fixed-height panel (e.g. desktop chat sidebar). */
    scrollRootRef?: RefObject<HTMLDivElement | null>;
}

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-BD', {month: 'short', day: 'numeric'});
}

export function ChatList({
    conversations,
    activeId,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
    scrollRootRef,
}: ChatListProps) {
    if (isLoading) {
        return (
            <div className="space-y-2 p-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"/>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-2/3"/>
                            <div className="h-2.5 bg-gray-200 rounded w-4/5"/>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <svg className="w-10 h-10 text-gray-200 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <p className="text-sm font-medium text-[#3D3220]">No conversations yet</p>
                <p className="text-xs text-[#4A3F2E] mt-1">Accept an interest to start chatting</p>
            </div>
        );
    }

    return (
        <div ref={scrollRootRef} className={scrollRootRef ? 'h-full overflow-y-auto' : undefined}>
            {conversations.map((conv) => {
                const {participant} = conv;
                const isActive = conv.id === activeId;
                const hasUnread = conv.unread_count > 0;
                const initials = participant.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                return (
                    <Link
                        key={conv.id}
                        href={`/chat/${conv.id}`}
                        className={cn(
                            'flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-gray-50',
                            isActive
                                ? 'bg-[#FBF6E8] border-l-2 border-l-[#FFCF00]'
                                : 'hover:bg-gray-50'
                        )}
                    >
                        {/* Avatar with online dot */}
                        <div className="relative flex-shrink-0">
                            <div
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center text-[#1A1208] font-bold text-sm profile-photo-border">
                                {initials}
                            </div>
                            {participant.is_online && (
                                <span
                                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white"/>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                <span
                    className={cn(
                        'text-sm truncate',
                        hasUnread ? 'font-semibold text-[#1F2937]' : 'font-medium text-gray-700'
                    )}
                >
                  {participant.name}
                </span>
                                <span className="text-[10px] text-[#4A3F2E] flex-shrink-0 ml-1">
                  {conv.last_message_at ? formatRelativeTime(conv.last_message_at) : ''}
                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <p
                                    className={cn(
                                        'text-xs truncate',
                                        hasUnread ? 'text-[#1F2937] font-medium' : 'text-[#4A3F2E]'
                                    )}
                                >
                                    {conv.last_message?.is_deleted
                                        ? 'This message was deleted'
                                        : conv.last_message?.body ?? 'Start a conversation'}
                                </p>
                                {hasUnread && (
                                    <span
                                        className="ml-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#FFCF00] text-[#1A1208] text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count > 9 ? '9+' : conv.unread_count}
                  </span>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}

            {onLoadMore && (
                <InfiniteScrollFooter
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={!!isFetchingNextPage}
                    onLoadMore={onLoadMore}
                    scrollRootRef={scrollRootRef}
                    showEndMessage={conversations.length > 0}
                    endMessage="No more conversations"
                />
            )}
        </div>
    );
}

