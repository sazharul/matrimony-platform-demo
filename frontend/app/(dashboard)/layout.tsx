'use client';

import {useEffect, useState, useRef, useLayoutEffect, useCallback} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import Link from 'next/link';
import {useAuthStore} from '@/store/authStore';
import {authService} from '@/services/authService';
import {faceScanService} from '@/services/faceScanService';
import {cn} from '@/lib/utils';
import {useSettings} from '@/lib/useSettings';
import {
    needsEmailVerification,
    isFaceScanEnabled,
    isFaceScanComplete,
    needsFaceScan,
    mergeUserUpdate,
} from '@/lib/authRedirect';
import {NotificationBell} from '@/components/notification/NotificationBell';
import {CallProvider} from '@/components/providers/CallProvider';
import {MessageUnreadBadge} from '@/components/chat/MessageUnreadBadge';
import {useUnreadMessageCount} from '@/hooks/useUnreadMessageCount';
import {
    HomeIcon, MatchesIcon, SearchIcon, InterestIcon, ChatIcon,
    StarIcon, BellIcon, UserIcon, LogOutIcon, EyeIcon,
} from '@/components/ui/icons';
import type {ComponentType, SVGProps} from 'react';

type NavIconProps = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

// Crown icon for subscription
function CrownIcon({size = 24, strokeWidth = 1.8, ...props}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
             strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M2 20h20M5 20V9l7-5 7 5v11"/>
            <path d="M9 20v-5h6v5"/>
        </svg>
    );
}


// Account disable request icon
function AccountDisableIcon({size = 24, strokeWidth = 1.8, ...props}: NavIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
             strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="17" y1="8" x2="23" y2="14"/>
            <line x1="23" y1="8" x2="17" y2="14"/>
        </svg>
    );
}

const NAV_ITEMS: { href: string; label: string; Icon: ComponentType<NavIconProps>; adminOnly?: boolean }[] = [
    {href: '/dashboard', label: 'Dashboard', Icon: HomeIcon},
    {href: '/matches', label: 'Matches', Icon: MatchesIcon},
    {href: '/member/search', label: 'Search', Icon: SearchIcon},
    {href: '/interests', label: 'Interests', Icon: InterestIcon},
    {href: '/chat', label: 'Messages', Icon: ChatIcon},
    {href: '/shortlist', label: 'Shortlist', Icon: StarIcon},
    {href: '/notifications', label: 'Notifications', Icon: BellIcon},
    {href: '/profile-views', label: 'Profile Viewers', Icon: EyeIcon},
    {href: '/profile/edit', label: 'My Profile', Icon: UserIcon},
    {href: '/subscription', label: 'Upgrade Plan', Icon: CrownIcon},
    {href: '/account-disable-request', label: 'Ac. Disable Request', Icon: AccountDisableIcon},
];

function isNavItemActive(pathname: string, href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

function SidebarNav({
    items,
    pathname,
    unreadMessageCount,
}: {
    items: typeof NAV_ITEMS;
    pathname: string;
    unreadMessageCount: number;
}) {
    const navRef = useRef<HTMLElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [pill, setPill] = useState({top: 0, height: 0, opacity: 0});
    const activeIndex = items.findIndex((item) => isNavItemActive(pathname, item.href));

    const updatePill = useCallback(() => {
        const navEl = navRef.current;
        const activeEl = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;

        if (!navEl || !activeEl) {
            setPill((prev) => ({...prev, opacity: 0}));
            return;
        }

        const navRect = navEl.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();

        setPill({
            top: elRect.top - navRect.top,
            height: elRect.height,
            opacity: 1,
        });
    }, [activeIndex]);

    useLayoutEffect(() => {
        updatePill();
    }, [updatePill, items, pathname]);

    useEffect(() => {
        const navEl = navRef.current;
        if (!navEl) return;

        const observer = new ResizeObserver(() => updatePill());
        observer.observe(navEl);
        linkRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        window.addEventListener('resize', updatePill);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updatePill);
        };
    }, [updatePill, items, pathname]);

    return (
        <nav
            ref={navRef}
            aria-label="Dashboard navigation"
            className="relative flex-1 rounded-2xl border border-[#FFCF00]/30 bg-[#FFCF00]/8 p-1.5 space-y-0.5"
        >
            <span
                aria-hidden
                className="absolute left-1.5 right-1.5 rounded-xl bg-[#FFCF00] shadow-sm ring-1 ring-[#1A1208]/10 pointer-events-none transition-[top,height,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    top: pill.top,
                    height: pill.height,
                    opacity: pill.opacity,
                }}
            />

            {items.map((item, index) => {
                const active = isNavItemActive(pathname, item.href);
                const isUpgrade = item.href === '/subscription';

                return (
                    <Link
                        key={item.href}
                        ref={(el) => {
                            linkRefs.current[index] = el;
                        }}
                        href={item.href}
                        className={cn(
                            'relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200',
                            active
                                ? 'text-[#1A1208]'
                                : isUpgrade
                                    ? 'text-[#1A1208] hover:text-[#1A1208]'
                                    : 'text-meta hover:text-[#1A1208]',
                        )}
                    >
                        <item.Icon size={18} strokeWidth={active ? 2.2 : 1.8}/>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.href === '/chat' && (
                            <MessageUnreadBadge count={unreadMessageCount} className="ml-auto"/>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

function MobileBottomNav({
    items,
    pathname,
    onMoreClick,
}: {
    items: typeof NAV_ITEMS;
    pathname: string;
    onMoreClick: () => void;
}) {
    const navRef = useRef<HTMLElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [pill, setPill] = useState({left: 0, width: 0, opacity: 0});
    const activeIndex = items.findIndex((item) => isNavItemActive(pathname, item.href));

    const updatePill = useCallback(() => {
        const navEl = navRef.current;
        const activeEl = activeIndex >= 0 ? linkRefs.current[activeIndex] : null;

        if (!navEl || !activeEl) {
            setPill((prev) => ({...prev, opacity: 0}));
            return;
        }

        const navRect = navEl.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();

        setPill({
            left: elRect.left - navRect.left,
            width: elRect.width,
            opacity: 1,
        });
    }, [activeIndex]);

    useLayoutEffect(() => {
        updatePill();
        const frame = requestAnimationFrame(updatePill);
        return () => cancelAnimationFrame(frame);
    }, [updatePill, items, pathname]);

    useEffect(() => {
        const navEl = navRef.current;
        if (!navEl) return;

        const observer = new ResizeObserver(() => updatePill());
        observer.observe(navEl);
        linkRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        window.addEventListener('resize', updatePill);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updatePill);
        };
    }, [updatePill, items, pathname]);

    return (
        <nav
            ref={navRef}
            aria-label="Mobile dashboard navigation"
            className="md:hidden fixed bottom-0 inset-x-0 border-t-2 border-[#FFCF00] flex justify-around py-1.5 z-40 safe-area-pb backdrop-blur-sm"
            style={{background: 'rgba(255,255,255,0.98)'}}
        >
            <span
                aria-hidden
                className="absolute top-1 bottom-1 rounded-xl bg-[#FFCF00]/25 pointer-events-none transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    left: pill.left,
                    width: pill.width,
                    opacity: pill.opacity,
                }}
            />

            {items.map((item, index) => {
                const active = isNavItemActive(pathname, item.href);

                return (
                    <Link
                        key={item.href}
                        ref={(el) => {
                            linkRefs.current[index] = el;
                        }}
                        href={item.href}
                        className={cn(
                            'relative z-10 flex flex-col items-center gap-0.5 px-1 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs transition-colors min-w-0',
                            active ? 'text-[#1A1208] font-bold' : 'text-subtle font-medium',
                        )}
                    >
                        <item.Icon size={20} strokeWidth={active ? 2.2 : 1.8}/>
                        <span className="truncate w-full text-center leading-tight">{item.label}</span>
                    </Link>
                );
            })}

            <button
                type="button"
                onClick={onMoreClick}
                className="relative z-10 flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-subtle font-medium transition-colors"
            >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
                <span>More</span>
            </button>
        </nav>
    );
}

export default function DashboardLayout({children}: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const {isAuthenticated, user, clearAuth, updateUser} = useAuthStore();
    const {settings} = useSettings();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const unreadMessageCount = useUnreadMessageCount();

    const [mounted, setMounted] = useState(false);
    const [accessReady, setAccessReady] = useState(false);

    const faceScanEnabled = isFaceScanEnabled(settings.face_scan_enabled);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (mounted && !isAuthenticated) {
            router.replace('/login');
        }
    }, [mounted, isAuthenticated, router]);

    // Verify face-scan access before showing dashboard (prevents flash redirect)
    useEffect(() => {
        if (!mounted || !isAuthenticated || !user) return;

        if (needsEmailVerification(user)) {
            router.replace('/verify-email');
            return;
        }

        if (!needsFaceScan(user, faceScanEnabled)) {
            setAccessReady(true);
            return;
        }

        if (isFaceScanComplete(user.face_scan_status)) {
            setAccessReady(true);
            return;
        }

        let cancelled = false;

        faceScanService.getStatus()
            .then(res => {
                if (cancelled) return;
                const session = res.data.data.session;
                const status = session?.status ?? user.face_scan_status;

                if (status) {
                    updateUser({
                        face_scan_status: status,
                        face_scan_review_note: session?.review_note ?? user.face_scan_review_note,
                    });
                }

                if (!isFaceScanComplete(status)) {
                    router.replace('/face-scan');
                } else {
                    setAccessReady(true);
                }
            })
            .catch(() => {
                if (!cancelled) setAccessReady(true);
            });

        return () => {
            cancelled = true;
        };
    }, [mounted, isAuthenticated, user, faceScanEnabled, router]);

    useEffect(() => {
        if (!mounted || !isAuthenticated) return;
        authService.me()
            .then(res => {
                const freshUser = res.data?.data?.user;
                if (freshUser) updateUser(mergeUserUpdate(useAuthStore.getState().user, freshUser));
            })
            .catch(() => {/* silently ignore */
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, isAuthenticated]);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } finally {
            clearAuth();
            router.push('/login');
        }
    };

    if (!mounted || !isAuthenticated || !user || !accessReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#FFCF00] border-t-transparent rounded-full animate-spin"/>
                    <p className="text-sm text-muted-foreground">Loading your account…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <CallProvider>
                {/* Sidebar */}
                <aside
                    className="hidden md:flex flex-col w-64 border-r-2 border-[#FFCF00]/35 px-3 lg:px-4 py-4 lg:py-6 fixed h-full z-10 overflow-y-auto bg-white"
                >
                    {/* Logo */}
                    <div className="mb-6 px-2">
                        <div className="flex items-center gap-2.5">
                            <a href="/" className="group">
                                <h1 className="text-xl font-bold leading-none text-[#1A1208] group-hover:underline decoration-[#FFCF00] decoration-2 underline-offset-4">{settings.site_name}</h1>
                                <p className="text-[10px] text-subtle tracking-widest uppercase mt-2 font-semibold">{settings.site_slogan}</p>
                            </a>
                        </div>
                    </div>

                    <SidebarNav
                        items={NAV_ITEMS}
                        pathname={pathname}
                        unreadMessageCount={unreadMessageCount}
                    />

                    {/* Admin link — only visible to admins */}
                    {user.role === 'admin' && (
                        <Link
                            href="/admin/dashboard"
                            className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors duration-200 text-meta border border-[#FFCF00]/25 bg-[#FFCF00]/5 hover:bg-[#FFCF00]/15 hover:text-[#1A1208]"
                        >
                            <span className="text-base">⚙️</span>
                            Admin Panel
                        </Link>
                    )}

                    {/* User section */}
                    <div className="border-t-2 border-[#FFCF00]/25 pt-4 mt-4">
                        <div className="flex items-center gap-3 px-2 mb-3">
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1208] text-sm font-bold shrink-0"
                                style={{
                                    background: 'var(--gradient-gold-btn)',
                                    boxShadow: '0 2px 8px rgba(255,207,0,0.3)'
                                }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[#1A1208] truncate">{user.name}</p>
                                <span className="text-[11px] text-subtle truncate">{user.email}</span>
                            </div>
                            <NotificationBell placement="sidebar"/>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                        >
                            <LogOutIcon size={16} strokeWidth={1.8}/>
                            Sign out
                        </button>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 md:ml-64 min-w-0 flex flex-col min-h-screen">
                    {/* Mobile top bar */}
                    <div
                        className="md:hidden border-b-2 border-[#FFCF00]/35 px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-sm"
                        style={{background: 'rgba(255,255,255,0.98)'}}>
                        <h1 className="text-base sm:text-lg font-bold text-[#1A1208]">{settings.site_name}</h1>
                        <div className="flex items-center gap-2">
                            <NotificationBell/>
                            <a href="/profile/edit" className="text-xs sm:text-sm text-muted-foreground truncate max-w-[120px]">{user.name}</a>
                        </div>
                    </div>

                    <div className="flex-1 p-2 sm:p-4 lg:p-6 mobile-bottom-nav-offset md:pb-4">{children}</div>
                </main>

                <MobileBottomNav
                    items={NAV_ITEMS.slice(0, 4)}
                    pathname={pathname}
                    onMoreClick={() => setDrawerOpen(true)}
                />

                {drawerOpen && (
                        <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl border-t-2 border-[#FFCF00] safe-area-pb"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Handle */}
                                <div className="w-9 h-1 bg-[#FFCF00]/40 rounded-full mx-auto mt-3 mb-1" />
                                <p className="text-[10px] text-subtle uppercase tracking-widest px-4 py-2 font-bold">More options</p>

                                {/* Grid of remaining nav items */}
                                <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
                                    {NAV_ITEMS.slice(4).map((item) => {
                                        const active = isNavItemActive(pathname, item.href);
                                        const isUpgrade = item.href === '/subscription';
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setDrawerOpen(false)}
                                                className={cn(
                                                    'relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] text-center font-bold transition-colors border',
                                                    isUpgrade
                                                        ? 'bg-[#FFCF00] text-[#1A1208] border-[#1A1208]/10 shadow-sm'
                                                        : active
                                                            ? 'bg-[#FFCF00] text-[#1A1208] border-[#1A1208]/10 shadow-sm'
                                                            : 'text-meta border-[#FFCF00]/25 bg-[#FFCF00]/8 hover:bg-[#FFCF00]/20',
                                                )}
                                            >
                                                <span className="relative">
                                                    <item.Icon size={22} strokeWidth={isUpgrade || active ? 2.1 : 1.8}/>
                                                    {item.href === '/chat' && unreadMessageCount > 0 && (
                                                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#FFCF00] text-[#1A1208] text-[9px] font-bold flex items-center justify-center leading-none">
                                                            {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="leading-tight">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>

                                <div className="h-px bg-[#FFCF00]/25 mx-4 my-1" />

                                {/* Sign out */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <LogOutIcon size={18} strokeWidth={1.8}/>
                                    Sign out
                                </button>

                                {/* Safe area spacer */}
                                <div className="h-4" />
                            </div>
                        </div>
                    )}
            </CallProvider>
        </div>
    );
}
