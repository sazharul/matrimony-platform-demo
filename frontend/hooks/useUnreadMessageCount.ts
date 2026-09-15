'use client';

import {useQuery} from '@tanstack/react-query';
import {useAuthStore} from '@/store/authStore';
import {userQueryKey} from '@/lib/userQueryKey';
import {chatService} from '@/services/chatService';

/** Total unread chat messages for the current user (sidebar badge). */
export function useUnreadMessageCount(): number {
    const userId = useAuthStore((s) => s.user?.id);

    const {data} = useQuery({
        queryKey: userQueryKey(userId, 'messages-unread-count'),
        queryFn: () => chatService.getUnreadMessageCount(),
        enabled: !!userId,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    return data ?? 0;
}
