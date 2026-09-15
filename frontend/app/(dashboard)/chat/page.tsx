'use client';

import {ChatList} from '@/components/chat/ChatList';
import {useConversations} from '@/hooks/useConversations';
import Link from 'next/link';

export default function ChatPage() {
    const {
        items: conversations,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useConversations();

    const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937] flex items-center gap-2">
                        Messages
                        <svg className="w-5 h-5 text-[#1A1208]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </h1>
                    <p className="text-sm text-meta mt-1">
                        {totalUnread > 0
                            ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
                            : 'All messages read'}
                    </p>
                </div>
            </div>

            {/* Desktop: two-panel layout hint */}
            <div className="card-premium overflow-hidden">
                {/* Info banner */}
                <div className="px-4 py-3 bg-accent border-b border-[#FFCF00]/20 flex items-center gap-2">
                    <span className="text-sm">💡</span>
                    <p className="text-xs text-[#3D3220]">
                        Chat is available only between users with{' '}
                        <span className="font-semibold text-[#1A1208]">mutually accepted interests</span>.
                    </p>
                </div>

                <ChatList
                    conversations={conversations}
                    isLoading={isLoading}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                />

                {/* Empty CTA */}
                {!isLoading && conversations.length === 0 && (
                    <div className="p-8 text-center border-t border-gray-50">
                        <Link
                            href="/interests"
                            className="inline-block bg-[#FFCF00] text-[#1A1208] text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-[#E6BA00] transition-colors"
                        >
                            View Interests
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
