'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserQuery } from '@/hooks/useUserQuery';
import { dashboardService } from '@/services/dashboardService';
import { interestService, shortlistService } from '@/services/profileService';
import { chatService } from '@/services/chatService';
import { ProfileCompletionBar } from '@/components/profile/ProfileCompletionBar';
import { MatchBarCard } from '@/components/match/MatchBarCard';
import { useAuthStore } from '@/store/authStore';
import {
    invalidateInterestQueries,
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateShortlistQueries,
} from '@/lib/cacheInvalidation';
import {
    patchProfileConnectionInCaches,
    patchProfileShortlistInCaches,
} from '@/lib/profileListCache';
import { handleSendInterestError } from '@/lib/interest';
import { showErrorToast, showSuccessToast, getErrorMessage } from '@/lib/toast';
import { userQueryKey } from '@/lib/userQueryKey';
import type { MatchScore } from '@/types/match';
import {
    MailIcon,
    EyeIcon,
    HeartIcon,
    CrownIcon,
    MatchesIcon,
    SearchIcon,
    StarFilledIcon,
    CheckCircleIcon,
} from '@/components/ui/icons';
import type { ComponentType, SVGProps } from 'react';
import { useState } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-xl w-2/3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="stat-card p-4 h-28 bg-gray-100 rounded-2xl" />
                ))}
            </div>
            <div className="h-32 bg-gray-100 rounded-2xl" />
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sublabel,
    Icon,
    href,
    iconBg,
    iconColor,
    valueClassName = 'text-foreground',
    locked,
}: {
    label: string;
    value: string | number;
    sublabel?: string;
    Icon: ComponentType<IconProps>;
    href: string;
    iconBg: string;
    iconColor: string;
    valueClassName?: string;
    locked?: boolean;
}) {
    return (
        <Link href={href} className="block h-full">
            <div className="stat-card p-4 h-full animate-fade-in-up hover:border-[var(--primary)]/20 transition-colors">
                <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <Icon size={20} strokeWidth={1.6} className={iconColor} />
                    </div>
                    {locked && <CrownIcon size={14} className="text-amber-500" strokeWidth={2} />}
                </div>
                <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                {sublabel && (
                    <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>
                )}
            </div>
        </Link>
    );
}

export default function DashboardPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const userId = user?.id;

    const [sendingInterestId, setSendingInterestId] = useState<number | null>(null);
    const [messagingUserId, setMessagingUserId] = useState<number | null>(null);
    const [togglingShortlistId, setTogglingShortlistId] = useState<number | null>(null);

    const { data: dashboard, isLoading, isError } = useUserQuery({
        queryKey: ['dashboard'],
        queryFn: () => dashboardService.getSummary().then((r) => r.data.data),
        staleTime: 60_000,
    });

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    }, []);

    const invalidateDashboard = useCallback(() => {
        invalidateDashboardQueries(queryClient);
    }, [queryClient]);

    const sendInterestMutation = useMutation({
        mutationFn: (candidateUserId: number) => interestService.send(candidateUserId),
        onSuccess: (_, candidateUserId) => {
            patchProfileConnectionInCaches(queryClient, userId, candidateUserId, {
                connection_status: 'pending',
                is_interest_sender: true,
                can_send_interest: false,
            });
            invalidateInterestQueries(queryClient);
            invalidateDashboard();
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, { queryClient, invalidateQueryRoots: ['dashboard'] });
        },
        onSettled: () => setSendingInterestId(null),
    });

    const actionMutation = useMutation({
        mutationFn: ({
            id,
            action,
        }: {
            id: number;
            action: 'accept' | 'decline' | 'ignore';
            candidateUserId: number;
        }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
            const connectionPatch =
                variables.action === 'accept'
                    ? { connection_status: 'accepted' as const, is_interest_sender: false, can_send_interest: false }
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
            invalidateDashboard();
            if (variables.action === 'accept') {
                invalidateConversationQueries(queryClient);
            }
            showSuccessToast(
                variables.action === 'accept'
                    ? 'Interest accepted!'
                    : variables.action === 'decline'
                      ? 'Interest declined.'
                      : 'Interest ignored.',
            );
        },
        onError: (error: unknown) => showErrorToast(getErrorMessage(error)),
    });

    const shortlistMutation = useMutation({
        mutationFn: (candidateUserId: number) => shortlistService.toggle(candidateUserId),
        onMutate: async (candidateUserId) => {
            const match = dashboard?.matches.find((m) => m.candidate.id === candidateUserId);
            const nextShortlisted = !(match?.candidate.is_shortlisted ?? false);
            patchProfileShortlistInCaches(queryClient, userId, candidateUserId, nextShortlisted);
            return { nextShortlisted };
        },
        onSuccess: (response, candidateUserId) => {
            const shortlisted = response.data?.data?.shortlisted;
            if (typeof shortlisted === 'boolean') {
                patchProfileShortlistInCaches(queryClient, userId, candidateUserId, shortlisted);
            }
            invalidateShortlistQueries(queryClient);
            invalidateDashboard();
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

    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto pb-20 md:pb-6">
                <DashboardSkeleton />
            </div>
        );
    }

    if (isError || !dashboard) {
        return (
            <div className="max-w-6xl mx-auto pb-20 md:pb-6">
                <div className="card-premium p-12 text-center">
                    <p className="text-destructive mb-4">Failed to load dashboard.</p>
                    <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: userQueryKey(userId, 'dashboard') })}
                        className="btn-gold text-sm"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1.25rem' }}
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const { completion, stats, matches, matches_total: totalMatches } = dashboard;
    const pendingLabel = stats.pending_interests === 1 ? 'interest awaiting reply' : 'interests awaiting reply';
    const planLabel = (user?.subscription_plan ?? 'free').replace(/_/g, ' ');

    const quickActions = [
        { href: '/member/search', label: 'Search Profiles', Icon: SearchIcon },
        { href: '/interests', label: 'Interests', Icon: MailIcon },
        { href: '/shortlist', label: 'Shortlist', Icon: StarFilledIcon },
        { href: '/profile-views', label: 'Profile Viewers', Icon: EyeIcon },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6 animate-fade-in">
            <div className="animate-fade-in-up">
                <h1 className="page-title flex items-center gap-2 flex-wrap">
                    {greeting},{' '}
                    <span className="text-[#1A1208]">{user?.name?.split(' ')[0]}</span>!
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Here&apos;s your matrimony overview at a glance
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
                <StatCard
                    label="Awaiting Your Reply"
                    value={stats.pending_interests}
                    sublabel={stats.pending_interests > 0 ? pendingLabel : 'All caught up'}
                    Icon={MailIcon}
                    href="/interests"
                    iconBg="bg-[var(--gold-50)]"
                    iconColor="text-[#1A1208]"
                    valueClassName={stats.pending_interests > 0 ? 'text-[#1A1208]' : 'text-foreground'}
                />
                <StatCard
                    label="Profile Viewers"
                    value={stats.profile_viewers_locked ? 'Pro' : (stats.profile_viewers ?? 0)}
                    sublabel={stats.profile_viewers_locked ? 'Upgrade to see who viewed you' : 'people viewed your profile'}
                    Icon={EyeIcon}
                    href={stats.profile_viewers_locked ? '/subscription' : '/profile-views'}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-400"
                    valueClassName="text-blue-500"
                    locked={stats.profile_viewers_locked}
                />
                <StatCard
                    label="Your Matches"
                    value={totalMatches}
                    sublabel={`${matches.length} shown below`}
                    Icon={HeartIcon}
                    href="/matches"
                    iconBg="bg-pink-50"
                    iconColor="text-pink-400"
                    valueClassName="text-pink-500"
                />
                <StatCard
                    label="Your Plan"
                    value={planLabel}
                    sublabel={stats.contacts_count > 0 ? `${stats.contacts_count} contacts` : 'Upgrade for more features'}
                    Icon={CrownIcon}
                    href="/subscription"
                    iconBg="bg-purple-50"
                    iconColor="text-purple-400"
                    valueClassName="text-purple-500 capitalize"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
                {quickActions.map(({ href, label, Icon }) => (
                    <Link
                        key={href}
                        href={href}
                        className="inline-flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border border-[var(--border)] bg-white hover:border-[var(--primary)]/30 hover:bg-[var(--accent)] transition-colors"
                    >
                        <Icon size={14} strokeWidth={1.8} className="text-[#1A1208]" />
                        {label}
                    </Link>
                ))}
            </div>

            {completion.percentage < 100 && <ProfileCompletionBar status={completion} />}

            <div>
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            Top Matches
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Highest compatibility scores for you
                        </p>
                    </div>
                    <Link
                        href="/matches"
                        className="text-sm text-[#1A1208] hover:text-[#8A7000] font-medium transition-colors flex-shrink-0"
                    >
                        View all →
                    </Link>
                </div>

                {matches.length > 0 ? (
                    <div className="space-y-3 stagger">
                        {matches.map((match) => (
                            <MatchBarCard
                                key={match.id}
                                match={match}
                                onSendInterest={(id) => {
                                    setSendingInterestId(id);
                                    sendInterestMutation.mutate(id);
                                }}
                                onInterestAction={(id, action) =>
                                    actionMutation.mutate({
                                        id,
                                        action,
                                        candidateUserId: match.candidate.id,
                                    })
                                }
                                onMessage={handleMessage}
                                onToggleShortlist={(id) => {
                                    setTogglingShortlistId(id);
                                    shortlistMutation.mutate(id);
                                }}
                                isSendingInterest={sendingInterestId === match.candidate.id}
                                isMessaging={messagingUserId === match.candidate.id}
                                isTogglingShortlist={togglingShortlistId === match.candidate.id}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="card-premium p-12 text-center animate-fade-in-up">
                        <MatchesIcon size={56} className="mx-auto text-[var(--gold-200)] mb-3" strokeWidth={1.2} />
                        <p className="text-foreground font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                            No matches yet
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                            Complete your profile and preferences — new compatibility scores are calculated regularly.
                        </p>
                        <Link
                            href="/profile/edit"
                            className="btn-gold mt-4 inline-flex items-center justify-center text-sm"
                            style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1.25rem' }}
                        >
                            Complete Profile
                        </Link>
                    </div>
                )}
            </div>

            {stats.shortlist_count > 0 && (
                <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {stats.shortlist_count} profile{stats.shortlist_count !== 1 ? 's' : ''} in your shortlist
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Review and send interests to your saved profiles
                        </p>
                    </div>
                    <Link
                        href="/shortlist"
                        className="btn-gold text-sm inline-flex items-center justify-center"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1.25rem' }}
                    >
                        View Shortlist
                    </Link>
                </div>
            )}
        </div>
    );
}
