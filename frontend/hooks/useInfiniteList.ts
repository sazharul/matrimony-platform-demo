'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { userQueryKey } from '@/lib/userQueryKey';
import type { NormalizedPage } from '@/lib/pagination';

interface UseInfiniteListOptions<T> {
    queryKey: unknown[];
    queryFn: (page: number) => Promise<NormalizedPage<T>>;
    enabled?: boolean;
    retry?: boolean | number;
    staleTime?: number;
    refetchOnMount?: boolean | 'always';
}

export function useInfiniteList<T>({
    queryKey,
    queryFn,
    enabled = true,
    retry = true,
    staleTime,
    refetchOnMount,
}: UseInfiniteListOptions<T>) {
    const userId = useAuthStore((s) => s.user?.id);

    const query = useInfiniteQuery({
        queryKey: userQueryKey(userId, ...queryKey),
        queryFn: ({ pageParam }) => queryFn(pageParam),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
        enabled: enabled && !!userId,
        retry,
        staleTime,
        refetchOnMount,
    });

    const items = query.data?.pages.flatMap((page) => page.items) ?? [];
    const total = query.data?.pages[0]?.total ?? 0;

    return {
        ...query,
        items,
        total,
    };
}
