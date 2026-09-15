'use client';

import {useQuery, type UseQueryOptions, type QueryKey} from '@tanstack/react-query';
import {useAuthStore} from '@/store/authStore';
import {userQueryKey} from '@/lib/userQueryKey';

type UserQueryOptions<
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
> = Omit<UseQueryOptions<TQueryFnData, TError, TData, QueryKey>, 'queryKey'> & {
    queryKey: unknown[];
};

/** User-scoped useQuery — keys are isolated per account and refetch when stale. */
export function useUserQuery<
    TQueryFnData = unknown,
    TError = Error,
    TData = TQueryFnData,
>(options: UserQueryOptions<TQueryFnData, TError, TData>) {
    const userId = useAuthStore((s) => s.user?.id);
    const {queryKey, enabled, ...rest} = options;

    return useQuery({
        ...rest,
        queryKey: userQueryKey(userId, ...queryKey),
        enabled: (enabled ?? true) && !!userId,
    });
}
