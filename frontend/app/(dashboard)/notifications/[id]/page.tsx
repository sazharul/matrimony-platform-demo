'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter, useParams} from 'next/navigation';
import {useNotificationStore} from '@/store/notificationStore';
import {notificationService} from '@/services/notificationService';
import {getActionButtonLabel} from '@/lib/notificationNavigation';
import type {AppNotification} from '@/types/notification';
import {cn} from '@/lib/utils';
import {
    BellIcon, MailIcon, CelebrationIcon, ClockIcon, EyeIcon,
    MessageSquareIcon, HeartIcon, AlertTriangleIcon, CheckCircleIcon,
    XCircleIcon, MegaphoneIcon, ArrowLeftIcon, XIcon, ExternalLinkIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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

const TYPE_ICON_COLORS: Record<AppNotification['type'], string> = {
    interest_received: 'bg-pink-100 text-pink-600',
    interest_accepted: 'bg-green-100 text-green-600',
    interest_expired: 'bg-gray-100 text-meta',
    profile_viewed: 'bg-blue-100 text-blue-600',
    new_message: 'bg-indigo-100 text-indigo-600',
    match_suggestion: 'bg-purple-100 text-purple-600',
    match_digest: 'bg-purple-100 text-purple-600',
    subscription_expiring: 'bg-yellow-100 text-yellow-600',
    subscription_expiry: 'bg-yellow-100 text-yellow-600',
    subscription_activated: 'bg-green-100 text-green-600',
    photo_approved: 'bg-green-100 text-green-600',
    photo_rejected: 'bg-red-100 text-red-600',
    face_scan_approved: 'bg-green-100 text-green-600',
    face_scan_rejected: 'bg-red-100 text-red-600',
    account_disable_request_submitted: 'bg-yellow-100 text-yellow-600',
    account_disable_request_disabled: 'bg-red-100 text-red-600',
    account_disable_request_banned: 'bg-red-100 text-red-600',
    account_disable_request_dismissed: 'bg-gray-100 text-[#3D3220]',
    account_disable_request_reactivated: 'bg-green-100 text-green-600',
    admin_account_disabled: 'bg-red-100 text-red-600',
    admin_account_banned: 'bg-red-100 text-red-600',
    admin_account_reactivated: 'bg-green-100 text-green-600',
    system: 'bg-amber-100 text-amber-600',
    broadcast_message: 'bg-amber-100 text-amber-600',
};

const TYPE_LABELS: Record<AppNotification['type'], string> = {
    interest_received: 'New Interest',
    interest_accepted: 'Interest Accepted',
    interest_expired: 'Interest Expired',
    profile_viewed: 'Profile Viewed',
    new_message: 'New Message',
    match_suggestion: 'Match Suggestion',
    match_digest: 'Match Digest',
    subscription_expiring: 'Subscription Expiring',
    subscription_expiry: 'Subscription Expiry',
    subscription_activated: 'Payment Confirmed',
    photo_approved: 'Photo Approved',
    photo_rejected: 'Photo Rejected',
    face_scan_approved: 'Face Scan Approved',
    face_scan_rejected: 'Face Scan Rejected',
    account_disable_request_submitted: 'Disable Request Received',
    account_disable_request_disabled: 'Account Disabled',
    account_disable_request_banned: 'Account Suspended',
    account_disable_request_dismissed: 'Disable Request Declined',
    account_disable_request_reactivated: 'Account Reactivated',
    admin_account_disabled: 'Account Disabled',
    admin_account_banned: 'Account Suspended',
    admin_account_reactivated: 'Account Reactivated',
    system: 'System Notice',
    broadcast_message: 'Announcement',
};

export default function NotificationDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const {notifications, markRead, remove} = useNotificationStore();
    const [notification, setNotification] = useState<AppNotification | null | undefined>(undefined);
    const [deleting, setDeleting] = useState(false);
    const markedRead = useRef(false);

    // Load: try store first, fall back to API fetch
    useEffect(() => {
        if (!id) return;

        const found = notifications.find((n) => n.id === id);
        if (found) {
            setNotification(found);
        } else {
            // Not in the store (could be on a later page) — fetch directly from API
            notificationService.getById(id).then((n) => {
                setNotification(n); // null = not found / deleted
            });
        }
    }, [id, notifications]);

    // Auto-mark as read once (backend also does this in show(), this keeps store in sync)
    useEffect(() => {
        if (notification && !notification.is_read && !markedRead.current) {
            markedRead.current = true;
            markRead(notification.id).catch(() => { /* silent */ });
        }
    }, [notification, markRead]);

    const handleDelete = async () => {
        // setDeleting(true);
        // await remove(id);
        router.push('/notifications');
    };

    // ── Loading ──────────────────────────────────────────────────────────
    if (notification === undefined) {
        return (
            <div className="max-w-2xl mx-auto pb-20 md:pb-6">
                <div className="skeleton-gold h-8 w-32 mb-6 rounded-lg"/>
                <div className="skeleton-gold h-56 rounded-2xl"/>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────
    if (notification === null) {
        return (
            <div className="max-w-2xl mx-auto pb-20 md:pb-6 text-center py-20">
                <BellIcon size={48} className="mx-auto text-muted-foreground mb-4"/>
                <h2 className="text-lg font-semibold text-foreground">Notification not found</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                    This notification may have been deleted or does not exist.
                </p>
                <button
                    onClick={() => router.push('/notifications')}
                    className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                >
                    <ArrowLeftIcon size={16}/> Back to Notifications
                </button>
            </div>
        );
    }

    const NIcon = TYPE_ICONS[notification.type] ?? MegaphoneIcon;
    const iconColor = TYPE_ICON_COLORS[notification.type] ?? 'bg-amber-100 text-amber-600';
    const typeLabel = TYPE_LABELS[notification.type] ?? 'Notification';
    const actionLabel = getActionButtonLabel(notification.type);

    return (
        <div className="max-w-2xl mx-auto pb-20 md:pb-6">
            {/* Back button */}
            <button
                onClick={() => router.push('/notifications')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
                <ArrowLeftIcon size={16} className="group-hover:-translate-x-0.5 transition-transform"/>
                Back to Notifications
            </button>

            {/* Card */}
            <div className="card-premium rounded-2xl overflow-hidden animate-fade-in-up">
                {/* Read / unread stripe */}
                <div className={cn('h-1.5 w-full', notification.is_read ? 'bg-border' : 'bg-primary')}/>

                <div className="p-6">
                    {/* Top row: icon + type badge + delete */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', iconColor)}>
                                <NIcon size={22} strokeWidth={1.8}/>
                            </div>
                            <div>
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    {typeLabel}
                                </span>
                                {!notification.is_read && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-[#1A1208] bg-primary/10 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"/>
                                        Unread
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Delete button — explicit action only, never auto-delete */}
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-lg hover:bg-destructive/10 disabled:opacity-50"
                            aria-label="Delete notification"
                        >
                            <XIcon size={16} strokeWidth={2}/>
                        </button>
                    </div>

                    {/* Title */}
                    <h1 className="text-xl font-bold text-foreground mb-3 leading-snug">
                        {notification.title}
                    </h1>

                    {/* Body */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 whitespace-pre-wrap">
                        {notification.body}
                    </p>

                    {/* Meta + action */}
                    <div className="flex items-center gap-3 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground min-w-0 flex-1">
                            <ClockIcon size={13} strokeWidth={1.8}/>
                            <span className="truncate">{formatFullDate(notification.created_at)}</span>
                            {notification.is_read && (
                                <span className="ml-auto flex items-center gap-1 shrink-0">
                                    <CheckCircleIcon size={13} strokeWidth={1.8} className="text-green-500"/>
                                    Read
                                </span>
                            )}
                        </div>

                        {notification.action_url && (
                            <button
                                onClick={() => router.push(notification.action_url!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1A1208] bg-primary/10 hover:bg-primary/15 transition-colors shrink-0"
                            >
                                {actionLabel}
                                <ExternalLinkIcon size={13} strokeWidth={2}/>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
