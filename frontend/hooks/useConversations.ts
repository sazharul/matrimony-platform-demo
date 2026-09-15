'use client';

import {chatService} from '@/services/chatService';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizePaginationKeyPage} from '@/lib/pagination';
import type {Conversation} from '@/types/message';

export function useConversations() {
    return useInfiniteList<Conversation>({
        queryKey: ['conversations'],
        queryFn: (page) =>
            chatService.getConversations(page).then((r) => normalizePaginationKeyPage(r, page)),
    });
}
