import type {QueryClient} from '@tanstack/react-query';

/** Invalidate queries whose key contains any of the given roots. */
export function invalidateUserQueries(queryClient: QueryClient, ...roots: string[]): void {
    queryClient.invalidateQueries({
        predicate: (query) => roots.some((root) => query.queryKey.includes(root)),
    });
}

export function invalidateInterestQueries(queryClient: QueryClient): void {
    invalidateUserQueries(
        queryClient,
        'interests',
        'interests-received',
        'interests-status',
        'interests-status-card',
    );
}

export function invalidateShortlistQueries(queryClient: QueryClient): void {
    invalidateUserQueries(
        queryClient,
        'shortlist',
        'shortlist-status',
        'shortlist-status-card',
    );
}

export function invalidateConversationQueries(queryClient: QueryClient): void {
    invalidateUserQueries(queryClient, 'conversations');
}

export function invalidateMessageUnreadQueries(queryClient: QueryClient): void {
    invalidateUserQueries(queryClient, 'messages-unread-count');
}

export function invalidateDashboardQueries(queryClient: QueryClient): void {
    invalidateUserQueries(
        queryClient,
        'profile-completion',
        'dashboard',
        'matches',
        'interests-received',
        'profile-views',
    );
}

export function invalidateProfileQueries(queryClient: QueryClient): void {
    invalidateUserQueries(queryClient, 'my-profile', 'profile-completion', 'profile', 'compatibility-score');
}

export function invalidateNotificationQueries(queryClient: QueryClient): void {
    invalidateUserQueries(queryClient, 'notifications');
}

export function invalidateSubscriptionQueries(queryClient: QueryClient): void {
    invalidateUserQueries(queryClient, 'subscription-status', 'subscription-history');
}
