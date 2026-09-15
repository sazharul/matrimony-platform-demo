"use client";

import {use, useRef} from "react";
import {ChatList} from "@/components/chat/ChatList";
import {ChatWindow} from "@/components/chat/ChatWindow";
import {useConversations} from "@/hooks/useConversations";
import {useAuthStore} from "@/store/authStore";

interface PageProps {
    params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({params}: PageProps) {
    const {conversationId} = use(params);
    const convId = Number(conversationId);
    const user = useAuthStore((s) => s.user);
    const scrollRef = useRef<HTMLDivElement>(null);

    const {
        items: conversations,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useConversations();

    const currentUserId = user?.id ?? 0;

    return (
        // Fill the space given by layout (layout now has p-2 sm:p-4 lg:p-6 pb-20 md:pb-4)
        <div className="w-full max-w-[1400px] mx-auto">
            {/* Mobile: full chat window */}
            <div
                className="md:hidden h-[calc(100dvh-7rem)] flex flex-col bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden">
                <ChatWindow conversationId={convId} currentUserId={currentUserId}/>
            </div>

            {/* Desktop: two-panel split */}
            <div
                className="hidden md:flex h-[calc(100vh-7rem)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Left: conversation list — narrower on medium screens */}
                <div className="w-56 lg:w-72 shrink-0 flex flex-col border-r border-gray-100">
                    <div className="px-3 lg:px-4 py-3.5 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-[#1F2937]">Messages 💬</h2>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ChatList
                            conversations={conversations}
                            activeId={convId}
                            isLoading={isLoading}
                            hasNextPage={hasNextPage}
                            isFetchingNextPage={isFetchingNextPage}
                            onLoadMore={() => fetchNextPage()}
                            scrollRootRef={scrollRef}
                        />
                    </div>
                </div>

                {/* Right: chat window */}
                <div className="flex-1 flex flex-col min-w-0">
                    <ChatWindow conversationId={convId} currentUserId={currentUserId}/>
                </div>
            </div>
        </div>
    );
}
