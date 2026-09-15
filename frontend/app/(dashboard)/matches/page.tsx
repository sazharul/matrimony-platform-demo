'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { matchService, interestService, shortlistService } from '@/services/profileService';
import { chatService } from '@/services/chatService';
import { MatchBarCard } from '@/components/match/MatchBarCard';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeMetaPage } from '@/lib/pagination';
import { patchProfileConnectionInCaches, patchProfileShortlistInCaches } from '@/lib/profileListCache';
import { userQueryKey } from '@/lib/userQueryKey';
import { useAuthStore } from '@/store/authStore';
import { showErrorToast, showSuccessToast, getErrorMessage } from '@/lib/toast';
import { handleSendInterestError } from '@/lib/interest';
import {
    invalidateInterestQueries,
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateShortlistQueries,
} from '@/lib/cacheInvalidation';
import { HeartIcon, SearchIcon, XIcon } from '@/components/ui/icons';
import type { MatchScore } from '@/types/match';

function MatchSkeleton() {
    return (
        <div className="card-premium p-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
        </div>
    );
}

export default function MatchesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sendingInterestId, setSendingInterestId] = useState<number | null>(null);
    const [messagingUserId, setMessagingUserId] = useState<number | null>(null);
    const [togglingShortlistId, setTogglingShortlistId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 350);
    }, []);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const hasFilters = debouncedSearch || dateFrom || dateTo;

    const {
        items: matches,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<MatchScore>({
        queryKey: ['matches', debouncedSearch, dateFrom, dateTo],
        queryFn: (page) =>
            matchService
                .getMatches(page, {
                    search: debouncedSearch || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                })
                .then((r) => normalizeMetaPage(r.data.data, page)),
        staleTime: 0,
        refetchOnMount: 'always',
    });

    const sendInterestMutation = useMutation({
        mutationFn: (userId: number) => interestService.send(userId),
        onSuccess: (_, candidateUserId) => {
            patchProfileConnectionInCaches(queryClient, userId, candidateUserId, {
                connection_status: 'pending',
                is_interest_sender: true,
                can_send_interest: false,
            });
            invalidateInterestQueries(queryClient);
            invalidateDashboardQueries(queryClient);
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, {
                queryClient,
                invalidateQueryRoots: ['matches'],
            });
        },
        onSettled: () => {
            setSendingInterestId(null);
        },
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' | 'ignore'; candidateUserId: number }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
            const connectionPatch =
                variables.action === 'accept'
                    ? {
                          connection_status: 'accepted' as const,
                          is_interest_sender: false,
                          can_send_interest: false,
                      }
                    : variables.action === 'decline'
                      ? { connection_status: 'declined' as const, can_send_interest: false }
                      : { connection_status: 'ignored' as const, can_send_interest: false };

            patchProfileConnectionInCaches(
                queryClient,
                userId,
                variables.candidateUserId,
                connectionPatch,
            );

            invalidateInterestQueries(queryClient);
            invalidateDashboardQueries(queryClient);
            if (variables.action === 'accept') {
                invalidateConversationQueries(queryClient);
            }
            const actionLabels = {
                accept: 'Interest accepted!',
                decline: 'Interest declined.',
                ignore: 'Interest ignored.',
            };
            showSuccessToast(actionLabels[variables.action]);
        },
        onError: (error: unknown) => {
            showErrorToast(getErrorMessage(error));
        },
    });

    const shortlistMutation = useMutation({
        mutationFn: (candidateUserId: number) => shortlistService.toggle(candidateUserId),
        onMutate: async (candidateUserId) => {
            await queryClient.cancelQueries({ queryKey: userQueryKey(userId, 'matches') });

            const match = matches.find((m) => m.candidate.id === candidateUserId);
            const currentShortlisted = match?.candidate.is_shortlisted ?? false;
            const nextShortlisted = !currentShortlisted;

            patchProfileShortlistInCaches(queryClient, userId, candidateUserId, nextShortlisted);

            return { candidateUserId, nextShortlisted };
        },
        onSuccess: (response, candidateUserId) => {
            const shortlisted = response.data?.data?.shortlisted;
            if (typeof shortlisted === 'boolean') {
                patchProfileShortlistInCaches(queryClient, userId, candidateUserId, shortlisted);
            }
            invalidateShortlistQueries(queryClient);
            showSuccessToast(
                shortlisted ? 'Added to shortlist' : 'Removed from shortlist',
            );
        },
        onError: (error: unknown, candidateUserId, context) => {
            if (context) {
                patchProfileShortlistInCaches(
                    queryClient,
                    userId,
                    candidateUserId,
                    !context.nextShortlisted,
                );
            }
            showErrorToast(getErrorMessage(error));
        },
        onSettled: () => {
            setTogglingShortlistId(null);
        },
    });

    const handleSendInterest = (userId: number) => {
        setSendingInterestId(userId);
        sendInterestMutation.mutate(userId);
    };

    const handleToggleShortlist = (userId: number) => {
        setTogglingShortlistId(userId);
        shortlistMutation.mutate(userId);
    };

    const handleMessage = async (match: MatchScore) => {
        const profile = match.candidate;
        setMessagingUserId(profile.id);
        try {
            if (profile.conversation_id) {
                invalidateConversationQueries(queryClient);
                router.push(`/chat/${profile.conversation_id}`);
                return;
            }
            const conv = await chatService.getOrCreateConversation(profile.id);
            invalidateConversationQueries(queryClient);
            router.push(`/chat/${conv.id}`);
        } catch (error: unknown) {
            showErrorToast(getErrorMessage(error));
        } finally {
            setMessagingUserId(null);
        }
    };

    const clearFilters = () => {
        handleSearchChange('');
        setDateFrom('');
        setDateTo('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            <div className="animate-fade-in-up">
                <h1 className="page-title flex items-center gap-2">
                    <HeartIcon size={22} className="text-[#1A1208]" strokeWidth={1.8} />
                    Your Matches
                </h1>
                {!isLoading && !isError && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Sorted by compatibility score • {total} match{total !== 1 ? 'es' : ''} found
                    </p>
                )}
            </div>

            {!isError && (
                <div className="space-y-3">
                    <div className="relative">
                        <SearchIcon
                            size={16}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                            strokeWidth={2}
                        />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search by name, MCT-ID, city, religion, profession…"
                            className="w-full h-10 pl-10 pr-10 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                        />
                        {searchInput && (
                            <button
                                onClick={() => handleSearchChange('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <XIcon size={14} strokeWidth={2} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                From date
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                max={dateTo || undefined}
                                className="w-full h-10 px-3 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                                To date
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                min={dateFrom || undefined}
                                className="w-full h-10 px-3 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                            />
                        </div>
                        {hasFilters && (
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="h-10 px-4 text-sm font-medium text-muted-foreground hover:text-foreground border border-[var(--border)] rounded-xl hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <MatchSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="card-premium p-12 text-center">
                    <p className="text-destructive">Failed to load matches. Please try again.</p>
                </div>
            ) : matches.length === 0 ? (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <HeartIcon size={56} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                        {hasFilters ? 'No matches match your filters' : 'No matches yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                        {hasFilters
                            ? 'Try adjusting your search or date range'
                            : 'Match scores are calculated nightly. Complete your profile and preferences to see matches tomorrow.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3 stagger">
                        {matches.map((match) => (
                            <MatchBarCard
                                key={match.id}
                                match={match}
                                onSendInterest={handleSendInterest}
                                onInterestAction={(id, action) =>
                                    actionMutation.mutate({
                                        id,
                                        action,
                                        candidateUserId: match.candidate.id,
                                    })
                                }
                                onMessage={handleMessage}
                                onToggleShortlist={handleToggleShortlist}
                                isSendingInterest={sendingInterestId === match.candidate.id}
                                isMessaging={messagingUserId === match.candidate.id}
                                isTogglingShortlist={togglingShortlistId === match.candidate.id}
                            />
                        ))}
                    </div>

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={matches.length > 0}
                        endMessage="You've seen all matches"
                    />
                </>
            )}
        </div>
    );
}
