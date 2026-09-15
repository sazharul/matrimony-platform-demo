'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useQueryClient} from '@tanstack/react-query';
import {invalidateNotificationQueries} from '@/lib/cacheInvalidation';
import {useNotificationStore} from '@/store/notificationStore';
import {notificationService} from '@/services/notificationService';
import type {AppNotification} from '@/types/notification';
import {InfiniteScrollFooter} from '@/components/ui/InfiniteScrollFooter';
import {useInfiniteList} from '@/hooks/useInfiniteList';
import {normalizePaginationKeyPage} from '@/lib/pagination';
import {cn} from '@/lib/utils';
import {
    BellIcon, MailIcon, CelebrationIcon, ClockIcon, EyeIcon,
    MessageSquareIcon, HeartIcon, AlertTriangleIcon, CheckCircleIcon,
    XCircleIcon, MegaphoneIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

const PER_PAGE = 15;

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
}

const TYPE_ICONS: Record<AppNotification['type'], ComponentType<IconProps>> = {
    interest_received: MailIcon,
    interest_accepted: CelebrationIcon,
    interest_expired: ClockIcon,
    profile_viewed: EyeIcon,
    new_message: MessageSquareIcon,
    match_suggestion: HeartIcon,
    match_digest: HeartIcon,
    subscription_expiring: AlertTriangleIcon,
    subscription_expiry: AlertTriangleIcon,
    subscription_activated: CheckCircleIcon,
    photo_approved: CheckCircleIcon,
    photo_rejected: XCircleIcon,
    face_scan_approved: CheckCircleIcon,
    face_scan_rejected: XCircleIcon,
    account_disable_request_submitted: ClockIcon,
    account_disable_request_disabled: XCircleIcon,
    account_disable_request_banned: XCircleIcon,
    account_disable_request_dismissed: MegaphoneIcon,
    account_disable_request_reactivated: CheckCircleIcon,
    admin_account_disabled: XCircleIcon,
    admin_account_banned: XCircleIcon,
    admin_account_reactivated: CheckCircleIcon,
    system: MegaphoneIcon,
    broadcast_message: MegaphoneIcon,
};

const TYPE_COLORS: Record<AppNotification['type'], string> = {
    interest_received: 'bg-pink-50 border-pink-100',
    interest_accepted: 'bg-green-50 border-green-100',
    interest_expired: 'bg-gray-50 border-gray-100',
    profile_viewed: 'bg-blue-50 border-blue-100',
    new_message: 'bg-indigo-50 border-indigo-100',
    match_suggestion: 'bg-purple-50 border-purple-100',
    match_digest: 'bg-purple-50 border-purple-100',
    subscription_expiring: 'bg-yellow-50 border-yellow-100',
    subscription_expiry: 'bg-yellow-50 border-yellow-100',
    subscription_activated: 'bg-green-50 border-green-100',
    photo_approved: 'bg-green-50 border-green-100',
    photo_rejected: 'bg-red-50 border-red-100',
    face_scan_approved: 'bg-green-50 border-green-100',
    face_scan_rejected: 'bg-red-50 border-red-100',
    account_disable_request_submitted: 'bg-yellow-50 border-yellow-100',
    account_disable_request_disabled: 'bg-red-50 border-red-100',
    account_disable_request_banned: 'bg-red-50 border-red-100',
    account_disable_request_dismissed: 'bg-gray-50 border-gray-100',
    account_disable_request_reactivated: 'bg-green-50 border-green-100',
    admin_account_disabled: 'bg-red-50 border-red-100',
    admin_account_banned: 'bg-red-50 border-red-100',
    admin_account_reactivated: 'bg-green-50 border-green-100',
    system: 'bg-gray-50 border-gray-100',
    broadcast_message: 'bg-white border-amber-100',
};

export default function NotificationsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const {unreadCount, markRead, markAllRead} = useNotificationStore();

    const [tab, setTab] = useState<'all' | 'unread'>('all');

    const {
        items,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<AppNotification>({
        queryKey: ['notifications', tab],
        queryFn: async (page) => {
            const result = await notificationService.getPaginated(page, PER_PAGE, tab === 'unread');
            return normalizePaginationKeyPage(
                {data: result.items, pagination: result.pagination},
                page,
            );
        },
    });

    const handleClick = async (n: AppNotification) => {
        if (!n.is_read) {
            await markRead(n.id);
            queryClient.setQueriesData<{ pages: { items: AppNotification[] }[] }>(
                {queryKey: ['notifications']},
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            items: page.items.map((i) => (i.id === n.id ? {...i, is_read: true} : i)),
                        })),
                    };
                },
            );
        }
        router.push(`/notifications/${n.id}`);
    };

    const handleMarkAllRead = async () => {
        await markAllRead();
        invalidateNotificationQueries(queryClient);
    };

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-6">
            <div className="flex items-center justify-between mb-5 animate-fade-in-up">
                <div>
                    <h1 className="page-title flex items-center gap-2">
                        Notifications
                        <BellIcon size={22} className="text-[#1A1208]"/>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isLoading
                            ? 'Loading…'
                            : `${total} total${unreadCount > 0 ? ` · ${unreadCount} unread` : ''}`}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm text-[#1A1208] font-semibold hover:opacity-75 transition-opacity"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="flex gap-1 mb-4 bg-muted/40 p-1 rounded-xl w-fit animate-fade-in-up">
                {(['all', 'unread'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cn(
                            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                            tab === t
                                ? 'bg-card shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {t === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="skeleton-gold h-20 rounded-2xl"/>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="card-premium py-16 text-center animate-fade-in-up">
                    <BellIcon size={48} className="mx-auto text-muted-foreground/30 mb-3"/>
                    <p className="text-lg font-semibold text-foreground">
                        {tab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {tab === 'unread'
                            ? 'You have no unread notifications.'
                            : 'You\'ll see activity here when something happens.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {items.map((n) => {
                            const NIcon = TYPE_ICONS[n.type] ?? MegaphoneIcon;
                            const colorClass = TYPE_COLORS[n.type] ?? 'bg-gray-50 border-gray-100';
                            return (
                                <div
                                    key={n.id}
                                    className={cn(
                                        'group relative flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md',
                                        !n.is_read ? 'bg-accent border-primary/20' : colorClass
                                    )}
                                    onClick={() => handleClick(n)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                                        <NIcon size={18} strokeWidth={1.8} className="text-muted-foreground"/>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn(
                                                'text-sm text-foreground leading-snug',
                                                !n.is_read ? 'font-bold' : 'font-semibold'
                                            )}>
                                                {n.title}
                                            </p>
                                            <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">
                                                {formatRelativeTime(n.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                                            {n.body}
                                        </p>
                                        <p className="text-[11px] text-[#1A1208] mt-1.5 font-medium">
                                            Tap to open →
                                        </p>
                                    </div>

                                    {!n.is_read && (
                                        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"/>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={items.length > 0}
                        endMessage="No more notifications"
                    />
                </>
            )}
        </div>
    );
}
