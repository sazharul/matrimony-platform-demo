'use client';

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useRouter} from 'next/navigation';
import {useNotificationStore} from '@/store/notificationStore';
import type {AppNotification} from '@/types/notification';
import {cn} from '@/lib/utils';
import {
    BellIcon, MailIcon, CelebrationIcon, ClockIcon, EyeIcon,
    MessageSquareIcon, HeartIcon, AlertTriangleIcon, CheckCircleIcon,
    XCircleIcon, MegaphoneIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
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

export function NotificationBell({placement = 'default'}: { placement?: 'default' | 'sidebar' }) {
    const router = useRouter();
    const {notifications, unreadCount, markRead, markAllRead} =
        useNotificationStore();
    const [open, setOpen] = useState(false);
    const [portalStyle, setPortalStyle] = useState<React.CSSProperties>({});

    // Separate refs: wrapper (button area) + portal dropdown
    const wrapperRef = useRef<HTMLDivElement>(null);
    const portalDropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Recalculate portal position every time it opens (sidebar mode)
    useEffect(() => {
        if (!open || placement !== 'sidebar' || !buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setPortalStyle({
            position: 'fixed',
            left: rect.right + 12,
            bottom: window.innerHeight - rect.bottom,
            width: 320,
            zIndex: 9999,
        });
    }, [open, placement]);

    // Close dropdown on outside click — handles both wrapper and portal
    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            const target = e.target as Node;
            const inWrapper = wrapperRef.current?.contains(target);
            const inPortal = portalDropdownRef.current?.contains(target);
            if (!inWrapper && !inPortal) setOpen(false);
        }

        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.is_read) await markRead(notification.id);
        setOpen(false);
        // Always open the detail page; the detail page has a "View Details" button for action_url
        router.push(`/notifications/${notification.id}`);
    };

    const preview = notifications.slice(0, 5);

    // ── Dropdown content (shared between portal and inline) ────────────
    const dropdownContent = (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#1F2937]">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount} new
            </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button onClick={() => markAllRead()}
                                className="text-[11px] text-[#1A1208] hover:underline font-medium">
                            Mark all read
                        </button>
                    )}
                    <button onClick={() => {
                        setOpen(false);
                        router.push('/notifications');
                    }} className="text-[11px] text-meta hover:text-[#1F2937]">
                        View all →
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {preview.length === 0 ? (
                    <div className="py-10 text-center">
                        <BellIcon size={32} className="mx-auto text-gray-300 mb-1"/>
                        <p className="text-sm text-[#4A3F2E]">No notifications yet</p>
                    </div>
                ) : (
                    preview.map((n) => (
                        <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn('w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors', !n.is_read && 'bg-[#FBF6E8]')}
                        >
                            {(() => {
                                const NIcon = TYPE_ICONS[n.type] ?? MegaphoneIcon;
                                return <NIcon size={20} strokeWidth={1.8} className="shrink-0 mt-0.5 text-meta"/>;
                            })()}
                            <div className="flex-1 min-w-0">
                                <p className={cn('text-xs font-semibold text-[#1F2937] leading-tight', !n.is_read && 'font-bold')}>{n.title}</p>
                                <p className="text-[11px] text-meta mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                                <p className="text-[10px] text-[#4A3F2E] mt-1">{formatRelativeTime(n.created_at)}</p>
                            </div>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#FFCF00] shrink-0 mt-1.5"/>}
                        </button>
                    ))
                )}
            </div>

            {notifications.length > 5 && (
                <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                    <button onClick={() => {
                        setOpen(false);
                        router.push('/notifications');
                    }} className="text-xs text-[#1A1208] hover:underline font-medium">
                        See all {notifications.length} notifications
                    </button>
                </div>
            )}
        </>
    );

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Bell button */}
            <button
                ref={buttonRef}
                onClick={() => setOpen((prev) => !prev)}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
            >
                <svg className="w-5 h-5 text-[#3D3220]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                     strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                </svg>
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Sidebar placement → render via portal (escapes overflow-y-auto clipping) */}
            {open && placement === 'sidebar' && mounted &&
                createPortal(
                    <div
                        ref={portalDropdownRef}
                        style={portalStyle}
                        className="bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden"
                    >
                        {dropdownContent}
                    </div>,
                    document.body
                )
            }

            {/* Default placement → inline absolute dropdown (mobile top bar) */}
            {open && placement !== 'sidebar' && (
                <div
                    className="absolute right-[-80px] top-11 w-72 sm:w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
                    {dropdownContent}
                </div>
            )}
        </div>
    );
}
