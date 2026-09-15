// app/(dashboard)/profile-views/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { profileViewService, interestService } from '@/services/profileService';
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
} from '@/lib/cacheInvalidation';
import Link from 'next/link';
import {
    EyeIcon,
    UserIcon,
    MapPinIcon,
    CrownIcon,
    CheckIcon,
    ArrowLeftIcon,
    SearchIcon,
    XIcon,
} from '@/components/ui/icons';
import { formatAge, resolvePhotoUrl, timeAgo } from '@/lib/utils';
import { resolveMatchScore } from '@/lib/matchScore';
import { CompatibilityScore } from '@/components/match/CompatibilityScore';
import { InterestConnectionActions } from '@/components/interest/InterestConnectionActions';
import { ShortlistToggleButton } from '@/components/profile/ShortlistToggleButton';
import { patchProfileShortlistInCaches } from '@/lib/profileListCache';
import { invalidateShortlistQueries } from '@/lib/cacheInvalidation';
import { shortlistService } from '@/services/profileService';
import { useAuthStore } from '@/store/authStore';
import type { ProfileView } from '@/types/profile';
import { useOptions } from '@/hooks/useSelectOptions';
import { optionLabel } from '@/lib/optionLabels';

function ViewerSkeleton() {
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

function ViewerCard({
    view,
    onSendInterest,
    onInterestAction,
    onMessage,
    onToggleShortlist,
    isSendingInterest,
    isMessaging,
    isTogglingShortlist,
}: {
    view: ProfileView;
    onSendInterest: (viewerId: number) => void;
    onInterestAction: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage: (view: ProfileView) => void;
    onToggleShortlist: (userId: number) => void;
    isSendingInterest: boolean;
    isMessaging: boolean;
    isTogglingShortlist: boolean;
}) {
    const { data: maritalOptions = [] } = useOptions('marital_status');
    const { data: educationOptions = [] } = useOptions('education_level');
    const profileUrl = view.viewer.profile?.profile_id
        ? `/profile/${view.viewer.profile.profile_id}`
        : '#';
    const matchScore = resolveMatchScore(view.viewer);
    const isShortlisted = view.viewer.is_shortlisted ?? false;

    return (
        <div className="card-premium p-4 hover:shadow-md transition-all duration-200 hover:border-[var(--primary)]/20 group">
            <div className="flex items-start gap-4">
                <Link href={profileUrl} className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[var(--gold-50)] overflow-hidden profile-photo-border">
                        {resolvePhotoUrl(view.viewer.primary_photo) ? (
                            <img
                                src={resolvePhotoUrl(view.viewer.primary_photo)!}
                                alt={view.viewer.name}
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
                                    {view.viewer.name}
                                </Link>
                                {view.viewer.profile?.is_verified && (
                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckIcon size={12} strokeWidth={2.5} />
                                        Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                        {view.viewer.profile?.age !== null && view.viewer.profile?.age !== undefined && (
                            <span>{formatAge(view.viewer.profile.dob)}</span>
                        )}
                        {view.viewer.profile?.city && (
                            <span className="flex items-center gap-0.5">
                                <MapPinIcon size={12} strokeWidth={1.8} />
                                {view.viewer.profile.city}
                                {view.viewer.profile.country && `, ${view.viewer.profile.country}`}
                            </span>
                        )}
                        {view.viewer.profile?.marital_status && (
                            <span>
                                {optionLabel(maritalOptions, view.viewer.profile.marital_status)}
                            </span>
                        )}
                        {view.viewer.education && (
                            <span className="truncate max-w-[120px]">
                                {optionLabel(educationOptions, view.viewer.education)}
                            </span>
                        )}
                    </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {matchScore != null && (
                                <CompatibilityScore score={matchScore} size="sm" />
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                                {timeAgo(view.viewed_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <InterestConnectionActions
                            connection_status={view.connection_status}
                            interest_id={view.interest_id}
                            is_interest_sender={view.is_interest_sender}
                            conversation_id={view.conversation_id}
                            can_send_interest={view.can_send_interest}
                            onSendInterest={() => onSendInterest(view.viewer.id)}
                            onInterestAction={onInterestAction}
                            onMessage={() => onMessage(view)}
                            isSendingInterest={isSendingInterest}
                            isMessaging={isMessaging}
                        />

                        <ShortlistToggleButton
                            isShortlisted={isShortlisted}
                            onToggle={() => onToggleShortlist(view.viewer.id)}
                            isLoading={isTogglingShortlist}
                        />
                    </div>
                </div>
            </div>

            <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                <div className="text-xs text-muted-foreground">
                    Viewed {timeAgo(view.viewed_at)}
                </div>
            </div>
        </div>
    );
}

export default function ProfileViewsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sendingInterestId, setSendingInterestId] = useState<number | null>(null);
    const [messagingViewerId, setMessagingViewerId] = useState<number | null>(null);
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
        items: viewers,
        total: totalViewers,
        isLoading,
        error,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<ProfileView>({
        queryKey: ['profile-views', debouncedSearch],
        queryFn: (page) =>
            profileViewService
                .getMyViewers(page, debouncedSearch || undefined)
                .then((r) => normalizeMetaPage(r.data.data, page)),
        retry: false,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    const sendInterestMutation = useMutation({
        mutationFn: (viewerId: number) => interestService.send(viewerId),
        onSuccess: () => {
            invalidateInterestQueries(queryClient);
            invalidateDashboardQueries(queryClient);
            queryClient.invalidateQueries({ queryKey: ['profile-views'] });
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, {
                queryClient,
                invalidateQueryRoots: ['profile-views'],
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
            queryClient.invalidateQueries({ queryKey: ['profile-views'] });
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
            const view = viewers.find((v) => v.viewer.id === candidateUserId);
            const currentShortlisted = view?.viewer.is_shortlisted ?? false;
            const nextShortlisted = !currentShortlisted;
            patchProfileShortlistInCaches(queryClient, userId, candidateUserId, nextShortlisted);
            return { nextShortlisted };
        },
        onSuccess: (response, candidateUserId) => {
            const shortlisted = response.data?.data?.shortlisted;
            if (typeof shortlisted === 'boolean') {
                patchProfileShortlistInCaches(queryClient, userId, candidateUserId, shortlisted);
            }
            invalidateShortlistQueries(queryClient);
            showSuccessToast(shortlisted ? 'Added to shortlist' : 'Removed from shortlist');
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
        onSettled: () => setTogglingShortlistId(null),
    });

    const handleSendInterest = (viewerId: number) => {
        setSendingInterestId(viewerId);
        sendInterestMutation.mutate(viewerId);
    };

    const handleMessage = async (view: ProfileView) => {
        setMessagingViewerId(view.viewer_id);
        try {
            if (view.conversation_id) {
                invalidateConversationQueries(queryClient);
                router.push(`/chat/${view.conversation_id}`);
                return;
            }
            const conv = await chatService.getOrCreateConversation(view.viewer.id);
            invalidateConversationQueries(queryClient);
            router.push(`/chat/${conv.id}`);
        } catch (error: unknown) {
            showErrorToast(getErrorMessage(error));
        } finally {
            setMessagingViewerId(null);
        }
    };

    const isSubscriptionError = (error as { response?: { status?: number } })?.response?.status === 403;
    const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to load profile viewers';

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            <div className="flex items-center justify-between animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <ArrowLeftIcon size={20} strokeWidth={1.8} className="text-[#3D3220]" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                <EyeIcon size={24} strokeWidth={1.8} className="text-[#1A1208]" />
                                Profile Viewers
                            </h1>
                            {!isLoading && !isError && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {totalViewers} {totalViewers === 1 ? 'person has' : 'people have'} viewed your profile
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isError && (
                <div className="relative">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search viewers by name, MCT-ID, city, religion, profession…"
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
                        <ViewerSkeleton key={i} />
                    ))}
                </div>
            ) : isError ? (
                <div className="card-premium p-12 text-center animate-fade-in-up">
                    {isSubscriptionError ? (
                        <>
                            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                                <CrownIcon size={40} strokeWidth={1.5} className="text-amber-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                Upgrade to See Who Viewed You
                            </h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {errorMessage || 'Viewing your profile visitors requires an upgraded subscription plan.'}
                            </p>
                            <Link
                                href="/subscription"
                                className="btn-gold mt-6 inline-flex items-center justify-center text-sm"
                                style={{ height: '2.75rem', borderRadius: '0.75rem', padding: '0 1.75rem' }}
                            >
                                <CrownIcon size={16} strokeWidth={2} className="mr-2" />
                                View Plans
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                                <EyeIcon size={40} strokeWidth={1.5} className="text-red-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground"
                                style={{ fontFamily: 'var(--font-heading)' }}>
                                Unable to Load Viewers
                            </h3>
                            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                                {errorMessage}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-6 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            ) : viewers.length === 0 ? (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <div className="w-24 h-24 rounded-full bg-[var(--gold-50)] flex items-center justify-center mx-auto mb-4 profile-photo-border">
                        <EyeIcon size={48} strokeWidth={1.2} className="text-[var(--gold-200)]" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground"
                        style={{ fontFamily: 'var(--font-heading)' }}>
                        {debouncedSearch ? 'No viewers match your search' : 'No Views Yet'}
                    </h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        {debouncedSearch
                            ? 'Try a different keyword'
                            : "Your profile hasn't been viewed by anyone yet. Complete your profile to get more visibility."}
                    </p>
                    {!debouncedSearch && (
                        <Link
                            href="/profile/edit"
                            className="btn-gold mt-6 inline-flex items-center justify-center text-sm"
                            style={{ height: '2.75rem', borderRadius: '0.75rem', padding: '0 1.75rem' }}
                        >
                            Complete Profile
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="space-y-3 stagger">
                        {viewers.map((view: ProfileView) => (
                            <ViewerCard
                                key={view.viewer_id}
                                view={view}
                                onSendInterest={handleSendInterest}
                                onInterestAction={(id, action) => actionMutation.mutate({ id, action })}
                                onMessage={handleMessage}
                                onToggleShortlist={(id) => {
                                    setTogglingShortlistId(id);
                                    shortlistMutation.mutate(id);
                                }}
                                isSendingInterest={sendingInterestId === view.viewer.id}
                                isMessaging={messagingViewerId === view.viewer_id}
                                isTogglingShortlist={togglingShortlistId === view.viewer.id}
                            />
                        ))}
                    </div>

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={viewers.length > 0}
                        endMessage="No more profile viewers"
                    />
                </>
            )}
        </div>
    );
}
