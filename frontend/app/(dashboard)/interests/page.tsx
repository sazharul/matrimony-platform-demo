'use client';

import {useCallback, useEffect, useRef, useState, Suspense} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useRouter, useSearchParams} from 'next/navigation';
import {interestService, shortlistService} from '@/services/profileService';
import {chatService} from '@/services/chatService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {handleSendInterestError} from '@/lib/interest';
import {
    invalidateInterestQueries,
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateShortlistQueries,
} from '@/lib/cacheInvalidation';
import {patchProfileShortlistInCaches} from '@/lib/profileListCache';
import {formatAge, resolvePhotoUrl, timeAgo} from '@/lib/utils';
import {resolveMatchScore} from '@/lib/matchScore';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizeMetaPage} from '@/lib/pagination';
import {useAuthStore} from '@/store/authStore';
import {CompatibilityScore} from '@/components/match/CompatibilityScore';
import {InterestConnectionActions} from '@/components/interest/InterestConnectionActions';
import {ShortlistToggleButton} from '@/components/profile/ShortlistToggleButton';
import Image from 'next/image';
import Link from 'next/link';
import type {Interest} from '@/types/interest';
import type {ProfileCard} from '@/types/profile';
import {
    UserIcon, InboxIcon, OutboxIcon, CheckIcon,
    SearchIcon, CheckCircleIcon, MapPinIcon, XIcon,
} from '@/components/ui/icons';

type Tab = 'received' | 'sent' | 'contacts';

function parseInterestTab(value: string | null): Tab {
    if (value === 'sent' || value === 'contacts' || value === 'received') return value;
    return 'received';
}

const TAB_CONFIG: Record<Tab, { label: string; emptyTitle: string; emptyHint: string }> = {
    received: {
        label: 'Received',
        emptyTitle: 'No received interests yet',
        emptyHint: 'When someone sends you an interest, it will appear here',
    },
    sent: {
        label: 'Sent',
        emptyTitle: 'No sent interests yet',
        emptyHint: 'Interests you send will appear here',
    },
    contacts: {
        label: 'Contacts',
        emptyTitle: 'No contacts yet',
        emptyHint: 'Accepted interests will appear here and you can message each other',
    },
};

function getInterestProfile(interest: Interest, tab: Tab): ProfileCard | null {
    if (interest.connected_user) return interest.connected_user;
    if (tab === 'received') return interest.sender;
    if (tab === 'sent') return interest.receiver;
    return interest.sender ?? interest.receiver;
}

function getConnectionMeta(interest: Interest, tab: Tab) {
    const isSender = tab === 'sent';
    const status = interest.status === 'expired' ? 'ignored' : interest.status;

    return {
        connection_status: status as 'none' | 'pending' | 'accepted' | 'declined' | 'ignored',
        interest_id: interest.id,
        is_interest_sender: isSender,
        conversation_id: interest.conversation_id ?? null,
        can_send_interest: false,
    };
}

function InterestCard({
    interest,
    tab,
    onAction,
    onMessage,
    onToggleShortlist,
    isMessaging,
    isTogglingShortlist,
}: {
    interest: Interest;
    tab: Tab;
    onAction?: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage?: (interest: Interest, profile: ProfileCard) => void;
    onToggleShortlist: (userId: number) => void;
    isMessaging?: boolean;
    isTogglingShortlist?: boolean;
}) {
    const profile = getInterestProfile(interest, tab);
    if (!profile) return null;

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : '#';

    const connectionMeta = getConnectionMeta(interest, tab);
    const matchScore = resolveMatchScore(profile);
    const isShortlisted = profile.is_shortlisted ?? false;

    return (
        <div className="card-premium p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-[var(--primary)]/20 group">
            <div className="flex items-start gap-3 sm:gap-4">
                <Link href={profileUrl} className="flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[var(--gold-50)] profile-photo-border">
                        {resolvePhotoUrl(profile.primary_photo) ? (
                            <Image
                                src={resolvePhotoUrl(profile.primary_photo)!}
                                alt={profile.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon size={24} className="text-subtle" strokeWidth={1.5}/>
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
                                    style={{fontFamily: 'var(--font-heading)'}}
                                >
                                    {profile.name}
                                </Link>
                                {profile.profile?.is_verified && (
                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckIcon size={12} strokeWidth={2.5}/>
                                        Verified
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                                {formatAge(profile.profile?.dob)}
                                {profile.profile?.city && (
                                    <span className="flex items-center gap-0.5">
                                        <MapPinIcon size={12} strokeWidth={1.8}/>
                                        {profile.profile.city}
                                    </span>
                                )}
                                {profile.religion && <span>{profile.religion}</span>}
                                {profile.education && (
                                    <span className="truncate max-w-[140px] sm:max-w-none">{profile.education}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {matchScore != null && (
                                <CompatibilityScore score={matchScore} size="sm"/>
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                                {timeAgo(interest.created_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <InterestConnectionActions
                            {...connectionMeta}
                            onSendInterest={() => {}}
                            onInterestAction={onAction}
                            onMessage={() => onMessage?.(interest, profile)}
                            isMessaging={isMessaging}
                        />

                        <ShortlistToggleButton
                            isShortlisted={isShortlisted}
                            onToggle={() => onToggleShortlist(profile.id)}
                            isLoading={isTogglingShortlist}
                        />
                    </div>
                </div>
            </div>

            <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                <div className="text-xs text-muted-foreground">
                    {tab === 'contacts' ? 'Connected' : 'Interest'} {timeAgo(interest.created_at)}
                </div>
            </div>
        </div>
    );
}

export default function InterestsPage() {
    return (
        <Suspense fallback={<div className="max-w-3xl mx-auto"><div className="skeleton-gold h-96 rounded-2xl"/></div>}>
            <InterestsPageInner/>
        </Suspense>
    );
}

function InterestsPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const userId = useAuthStore((s) => s.user?.id);
    const [tab, setTab] = useState<Tab>(() => parseInterestTab(searchParams.get('tab')));
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [messagingId, setMessagingId] = useState<number | null>(null);
    const [togglingShortlistId, setTogglingShortlistId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setTab(parseInterestTab(searchParams.get('tab')));
    }, [searchParams]);

    const handleTabChange = useCallback((nextTab: Tab) => {
        setTab(nextTab);
        router.replace(`/interests?tab=${nextTab}`, {scroll: false});
    }, [router]);

    useEffect(() => {
        setSearchInput('');
        setDebouncedSearch('');
    }, [tab]);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(value.trim()), 350);
    }, []);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const {
        items: interests,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<Interest>({
        queryKey: ['interests', tab, debouncedSearch],
        queryFn: (page) => {
            const search = debouncedSearch || undefined;
            const service =
                tab === 'received' ? interestService.getReceived
                : tab === 'sent' ? interestService.getSent
                : interestService.getContacts;
            return service(page, search).then((r) => normalizeMetaPage(r.data.data, page));
        },
    });

    const actionMutation = useMutation({
        mutationFn: ({id, action}: { id: number; action: 'accept' | 'decline' | 'ignore' }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
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
            const profile = interests
                .map((item) => getInterestProfile(item, tab))
                .find((p) => p?.id === candidateUserId);
            const currentShortlisted = profile?.is_shortlisted ?? false;
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

    const handleMessage = async (interest: Interest, profile: ProfileCard) => {
        setMessagingId(interest.id);
        try {
            if (interest.conversation_id) {
                invalidateConversationQueries(queryClient);
                router.push(`/chat/${interest.conversation_id}`);
                return;
            }
            const conv = await chatService.getOrCreateConversation(profile.id);
            invalidateConversationQueries(queryClient);
            router.push(`/chat/${conv.id}`);
        } catch (error: unknown) {
            showErrorToast(getErrorMessage(error));
        } finally {
            setMessagingId(null);
        }
    };

    const tabEmptyIcon = tab === 'received'
        ? InboxIcon
        : tab === 'sent'
            ? OutboxIcon
            : CheckCircleIcon;
    const EmptyIcon = tabEmptyIcon;

    return (
        <div className="max-w-4xl mx-auto pb-20 md:pb-6">
            <h1 className="page-title mb-6 animate-fade-in-up">Interests</h1>

            <div className="tab-pill-container flex gap-1 mb-4">
                {(['received', 'sent', 'contacts'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => handleTabChange(t)}
                        className={`tab-pill flex-1 flex items-center justify-center gap-1.5 capitalize ${tab === t ? 'active' : ''}`}
                    >
                        {t === 'received' ? <InboxIcon size={14} strokeWidth={2}/>
                            : t === 'sent' ? <OutboxIcon size={14} strokeWidth={2}/>
                            : <CheckCircleIcon size={14} strokeWidth={2}/>}
                        {TAB_CONFIG[t].label}
                        {total > 0 && tab === t && (
                            <span className="ml-1.5 bg-[var(--primary)] text-[#1A1208] text-xs rounded-full px-1.5 py-0.5 leading-none">{total}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative mb-5">
                <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2}/>
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={`Search ${TAB_CONFIG[tab].label.toLowerCase()} by name, MCT-ID, city, religion, profession…`}
                    className="w-full h-10 pl-10 pr-10 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                />
                {searchInput && (
                    <button
                        onClick={() => handleSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <XIcon size={14} strokeWidth={2}/>
                    </button>
                )}
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="skeleton-gold h-24"/>
                    ))}
                </div>
            )}

            {!isLoading && interests.length === 0 && (
                <div className="card-premium p-16 text-center animate-fade-in-up">
                    <EmptyIcon size={48} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2}/>
                    <p className="text-lg font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>
                        {debouncedSearch
                            ? `No ${TAB_CONFIG[tab].label.toLowerCase()} match your search`
                            : TAB_CONFIG[tab].emptyTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {debouncedSearch
                            ? 'Try a different keyword'
                            : TAB_CONFIG[tab].emptyHint}
                    </p>
                </div>
            )}

            <div className="space-y-3 stagger">
                {interests.map((interest) => {
                    const profile = getInterestProfile(interest, tab);
                    return (
                        <InterestCard
                            key={interest.id}
                            interest={interest}
                            tab={tab}
                            onAction={(id, action) => actionMutation.mutate({id, action})}
                            onMessage={handleMessage}
                            onToggleShortlist={(id) => {
                                setTogglingShortlistId(id);
                                shortlistMutation.mutate(id);
                            }}
                            isMessaging={messagingId === interest.id}
                            isTogglingShortlist={togglingShortlistId === profile?.id}
                        />
                    );
                })}
            </div>

            {!isLoading && interests.length > 0 && (
                <InfiniteScrollFooter
                    hasNextPage={!!hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    onLoadMore={() => fetchNextPage()}
                    showEndMessage
                    endMessage="No more to show"
                />
            )}
        </div>
    );
}
