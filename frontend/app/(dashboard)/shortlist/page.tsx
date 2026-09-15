'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { shortlistService, interestService } from '@/services/profileService';
import { chatService } from '@/services/chatService';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeMetaPage } from '@/lib/pagination';
import { showErrorToast, showSuccessToast, getErrorMessage } from '@/lib/toast';
import { handleSendInterestError } from '@/lib/interest';
import {
    invalidateInterestQueries,
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateShortlistQueries,
} from '@/lib/cacheInvalidation';
import Link from 'next/link';
import { StarFilledIcon, StarIcon, UserIcon, MapPinIcon, CheckIcon, SearchIcon, XIcon } from '@/components/ui/icons';
import { formatAge, resolvePhotoUrl, timeAgo } from '@/lib/utils';
import { resolveMatchScore } from '@/lib/matchScore';
import { CompatibilityScore } from '@/components/match/CompatibilityScore';
import { InterestConnectionActions } from '@/components/interest/InterestConnectionActions';
import { ShortlistToggleButton } from '@/components/profile/ShortlistToggleButton';
import { patchProfileShortlistInCaches } from '@/lib/profileListCache';
import { useAuthStore } from '@/store/authStore';
import type { ShortlistItem } from '@/types/profile';
import { useOptions } from '@/hooks/useSelectOptions';
import { optionLabel } from '@/lib/optionLabels';

function ShortlistSkeleton() {
    return (
        <div className="card-premium p-4 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/5" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
        </div>
    );
}

function ShortlistCard({
    item,
    onSendInterest,
    onInterestAction,
    onMessage,
    onToggleShortlist,
    isSendingInterest,
    isMessaging,
    isTogglingShortlist,
}: {
    item: ShortlistItem;
    onSendInterest: (userId: number) => void;
    onInterestAction: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage: (item: ShortlistItem) => void;
    onToggleShortlist: (userId: number) => void;
    isSendingInterest: boolean;
    isMessaging: boolean;
    isTogglingShortlist: boolean;
}) {
    const profile = item.user;
    const { data: maritalOptions = [] } = useOptions('marital_status');
    const { data: educationOptions = [] } = useOptions('education_level');
    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : '#';
    const matchScore = resolveMatchScore(profile);

    return (
        <div className="card-premium p-4 hover:shadow-md transition-all duration-200 hover:border-[var(--primary)]/20 group">
            <div className="flex items-start gap-4">
                <Link href={profileUrl} className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[var(--gold-50)] overflow-hidden profile-photo-border">
                        {resolvePhotoUrl(profile.primary_photo) ? (
                            <img
                                src={resolvePhotoUrl(profile.primary_photo)!}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon size={24} strokeWidth={1.5} className="text-subtle" />
                            </div>
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={profileUrl}
                                    className="font-semibold text-foreground truncate group-hover:text-[#8A7000] transition-colors"
                                    style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                    {profile.name}
                                </Link>
                                {profile.profile?.is_verified && (
                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckIcon size={12} strokeWidth={2.5} />
                                        Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                        {profile.profile?.age !== null && profile.profile?.age !== undefined && (
                            <span>{formatAge(profile.profile.dob)}</span>
                        )}
                        {profile.profile?.city && (
                            <span className="flex items-center gap-0.5">
                                <MapPinIcon size={12} strokeWidth={1.8} />
                                {profile.profile.city}
                                {profile.profile.country && `, ${profile.profile.country}`}
                            </span>
                        )}
                        {profile.profile?.marital_status && (
                            <span>
                                {optionLabel(maritalOptions, profile.profile.marital_status)}
                            </span>
                        )}
                        {profile.education && (
                            <span className="truncate max-w-[120px]">
                                {optionLabel(educationOptions, profile.education)}
                            </span>
                        )}
                    </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {matchScore != null && (
                                <CompatibilityScore score={matchScore} size="sm" />
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                                {timeAgo(item.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <InterestConnectionActions
                            connection_status={item.connection_status}
                            interest_id={item.interest_id}
                            is_interest_sender={item.is_interest_sender}
                            conversation_id={item.conversation_id}
                            can_send_interest={item.can_send_interest}
                            onSendInterest={() => onSendInterest(profile.id)}
                            onInterestAction={onInterestAction}
                            onMessage={() => onMessage(item)}
                            isSendingInterest={isSendingInterest}
                            isMessaging={isMessaging}
                        />

                        <ShortlistToggleButton
                            isShortlisted
                            onToggle={() => onToggleShortlist(profile.id)}
                            isLoading={isTogglingShortlist}
                        />
                    </div>
                </div>
            </div>

            <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                <div className="text-xs text-muted-foreground">
                    Shortlisted {timeAgo(item.created_at)}
                </div>
            </div>
        </div>
    );
}

export default function ShortlistPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
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

    const {
        items,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<ShortlistItem>({
        queryKey: ['shortlist', debouncedSearch],
        queryFn: (page) =>
            shortlistService
                .getAll(page, debouncedSearch || undefined)
                .then((r) => normalizeMetaPage(r.data.data, page)),
        staleTime: 0,
        refetchOnMount: 'always',
    });

    const shortlistMutation = useMutation({
        mutationFn: (userId: number) => shortlistService.toggle(userId),
        onMutate: async (candidateUserId) => {
            patchProfileShortlistInCaches(queryClient, userId, candidateUserId, false);
            return { candidateUserId };
        },
        onSuccess: () => {
            invalidateShortlistQueries(queryClient);
            showSuccessToast('Removed from shortlist');
        },
        onError: (error: unknown, candidateUserId) => {
            patchProfileShortlistInCaches(queryClient, userId, candidateUserId, true);
            showErrorToast(getErrorMessage(error));
        },
        onSettled: () => {
            setTogglingShortlistId(null);
        },
    });

    const sendInterestMutation = useMutation({
        mutationFn: (userId: number) => interestService.send(userId),
        onSuccess: () => {
            invalidateInterestQueries(queryClient);
            invalidateDashboardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: ['shortlist'] });
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, {
                queryClient,
                invalidateQueryRoots: ['shortlist'],
            });
        },
        onSettled: () => {
            setSendingInterestId(null);
        },
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' | 'ignore' }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
            invalidateInterestQueries(queryClient);
            invalidateDashboardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: ['shortlist'] });
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

    const handleSendInterest = (userId: number) => {
        setSendingInterestId(userId);
        sendInterestMutation.mutate(userId);
    };

    const handleToggleShortlist = (userId: number) => {
        setTogglingShortlistId(userId);
        shortlistMutation.mutate(userId);
    };

    const handleMessage = async (item: ShortlistItem) => {
        setMessagingUserId(item.user.id);
        try {
            if (item.conversation_id) {
                invalidateConversationQueries(queryClient);
                router.push(`/chat/${item.conversation_id}`);
                return;
            }
            const conv = await chatService.getOrCreateConversation(item.user.id);
            invalidateConversationQueries(queryClient);
            router.push(`/chat/${conv.id}`);
        } catch (error: unknown) {
            showErrorToast(getErrorMessage(error));
        } finally {
            setMessagingUserId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            <div className="animate-fade-in-up">
                <h1 className="page-title flex items-center gap-2">
                    <StarFilledIcon size={22} className="text-[#1A1208]" />
                    Shortlist
                </h1>
                {!isLoading && !isError && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {total} profile{total !== 1 ? 's' : ''} shortlisted
                    </p>
                )}
            </div>

            {!isError && (
                <div className="relative">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search shortlist by name, MCT-ID, city, religion, profession…"
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
            )}

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <ShortlistSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="card-premium p-12 text-center">
                    <p className="text-destructive">Failed to load shortlist.</p>
                </div>
            ) : items.length === 0 ? (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <StarIcon size={56} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                        {debouncedSearch ? 'No shortlisted profiles match your search' : 'Your shortlist is empty'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {debouncedSearch
                            ? 'Try a different keyword'
                            : 'Star profiles you like to save them here'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3 stagger">
                        {items.map((item) => (
                            <ShortlistCard
                                key={item.id}
                                item={item}
                                onSendInterest={handleSendInterest}
                                onInterestAction={(id, action) => actionMutation.mutate({ id, action })}
                                onMessage={handleMessage}
                                onToggleShortlist={handleToggleShortlist}
                                isSendingInterest={sendingInterestId === item.user.id}
                                isMessaging={messagingUserId === item.user.id}
                                isTogglingShortlist={togglingShortlistId === item.user.id}
                            />
                        ))}
                    </div>

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={items.length > 0}
                        endMessage="You've seen all shortlisted profiles"
                    />
                </>
            )}
        </div>
    );
}
