import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { NormalizedPage } from '@/lib/pagination';
import { userQueryKey } from '@/lib/userQueryKey';
import type { MatchScore } from '@/types/match';
import type { Interest } from '@/types/interest';
import type { ProfileView, ProfileCard, ShortlistItem } from '@/types/profile';
import type { DashboardSummary } from '@/services/dashboardService';

function patchDashboardCandidates(
    queryClient: QueryClient,
    userId: number | undefined | null,
    candidateUserId: number,
    patch: Partial<ProfileCard>,
) {
    if (!userId) return;

    queryClient.setQueriesData<DashboardSummary>(
        { queryKey: userQueryKey(userId, 'dashboard'), exact: false },
        (old) => {
            if (!old) return old;
            return {
                ...old,
                matches: old.matches.map((match) =>
                    match.candidate.id === candidateUserId
                        ? { ...match, candidate: { ...match.candidate, ...patch } }
                        : match,
                ),
            };
        },
    );
}

export function patchProfileShortlistInCaches(
    queryClient: QueryClient,
    userId: number | undefined | null,
    candidateUserId: number,
    isShortlisted: boolean,
) {
    if (!userId) return;

    const patch = { is_shortlisted: isShortlisted };

    patchDashboardCandidates(queryClient, userId, candidateUserId, patch);

    queryClient.setQueriesData<InfiniteData<NormalizedPage<MatchScore>>>(
        { queryKey: userQueryKey(userId, 'matches'), exact: false },
        (old) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((match) =>
                        match.candidate.id === candidateUserId
                            ? { ...match, candidate: { ...match.candidate, ...patch } }
                            : match,
                    ),
                })),
            };
        },
    );

    queryClient.setQueriesData<InfiniteData<NormalizedPage<Interest>>>(
        { queryKey: userQueryKey(userId, 'interests'), exact: false },
        (old) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((interest) => ({
                        ...interest,
                        sender: interest.sender?.id === candidateUserId
                            ? { ...interest.sender, ...patch }
                            : interest.sender,
                        receiver: interest.receiver?.id === candidateUserId
                            ? { ...interest.receiver, ...patch }
                            : interest.receiver,
                        connected_user: interest.connected_user?.id === candidateUserId
                            ? { ...interest.connected_user, ...patch }
                            : interest.connected_user,
                    })),
                })),
            };
        },
    );

    queryClient.setQueriesData<InfiniteData<NormalizedPage<ProfileView>>>(
        { queryKey: userQueryKey(userId, 'profile-views'), exact: false },
        (old) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((view) =>
                        view.viewer.id === candidateUserId
                            ? { ...view, viewer: { ...view.viewer, ...patch } }
                            : view,
                    ),
                })),
            };
        },
    );

    queryClient.setQueriesData<InfiniteData<NormalizedPage<ShortlistItem>>>(
        { queryKey: userQueryKey(userId, 'shortlist'), exact: false },
        (old) => {
            if (!old) return old;
            if (!isShortlisted) {
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        items: page.items.filter((item) => item.user.id !== candidateUserId),
                        total: Math.max(0, page.total - 1),
                    })),
                };
            }
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((item) =>
                        item.user.id === candidateUserId
                            ? { ...item, user: { ...item.user, ...patch } }
                            : item,
                    ),
                })),
            };
        },
    );
}

export function patchProfileConnectionInCaches(
    queryClient: QueryClient,
    userId: number | undefined | null,
    candidateUserId: number,
    connectionPatch: Partial<ProfileCard>,
) {
    if (!userId) return;

    patchDashboardCandidates(queryClient, userId, candidateUserId, connectionPatch);

    queryClient.setQueriesData<InfiniteData<NormalizedPage<MatchScore>>>(
        { queryKey: userQueryKey(userId, 'matches'), exact: false },
        (old) => {
            if (!old) return old;
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((match) =>
                        match.candidate.id === candidateUserId
                            ? { ...match, candidate: { ...match.candidate, ...connectionPatch } }
                            : match,
                    ),
                })),
            };
        },
    );
}
