'use client';

import Link from 'next/link';
import {useState, useEffect, useRef, useLayoutEffect, useCallback} from 'react';
import {usePathname} from 'next/navigation';
import {
    Menu,
    X,
    ChevronDown,
    LayoutDashboard,
    User,
    LogOut,
    ArrowRight,
} from 'lucide-react';
import { cfImageUrl, cn } from '@/lib/utils';
import { resolvePrimaryPhotoUrl } from '@/lib/profilePhotos';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { authService } from '@/services/authService';
import { isNavLinkActive, type NavLink } from '@/lib/publicNav';

interface NavbarProps {
    siteName: string;
    siteSlogan: string | null;
    logoUrl: string | null;
    navLinks: NavLink[];
}

function useActiveNavIndex(navLinks: NavLink[], pathname: string) {
    return navLinks.findIndex((link) => isNavLinkActive(pathname, link.href));
}

function DesktopNavMenu({navLinks, pathname}: { navLinks: NavLink[]; pathname: string }) {
    const navRef = useRef<HTMLElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [pill, setPill] = useState({left: 0, width: 0, opacity: 0});
    const activeIndex = useActiveNavIndex(navLinks, pathname);

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
    }, [updatePill, navLinks]);

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
    }, [updatePill, navLinks]);

    return (
        <nav
            ref={navRef}
            aria-label="Main navigation"
            className="relative hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 justify-center px-2 xl:px-4 min-w-0 overflow-x-auto scrollbar-none rounded-full border border-[#FFCF00]/35 bg-[#FFCF00]/10 py-1 max-w-fit mx-auto"
        >
            <span
                aria-hidden
                className="absolute top-1 bottom-1 rounded-full bg-[#FFCF00] shadow-sm ring-1 ring-[#1A1208]/10 pointer-events-none transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    left: pill.left,
                    width: pill.width,
                    opacity: pill.opacity,
                }}
            />

            {navLinks.map((link, index) => {
                const active = isNavLinkActive(pathname, link.href);

                return (
                    <Link
                        key={`${link.href}-${link.label}`}
                        ref={(el) => {
                            linkRefs.current[index] = el;
                        }}
                        href={link.href}
                        className={cn(
                            'relative z-10 px-2.5 xl:px-3.5 py-2 text-[0.75rem] xl:text-[0.8125rem] font-bold tracking-wide rounded-full transition-colors duration-200 whitespace-nowrap shrink-0',
                            active
                                ? 'text-[#1A1208]'
                                : 'text-[#1A1208] hover:text-[#1A1208]',
                        )}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function MobileNavMenu({
    navLinks,
    pathname,
    onNavigate,
}: {
    navLinks: NavLink[];
    pathname: string;
    onNavigate: () => void;
}) {
    const navRef = useRef<HTMLElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const [pill, setPill] = useState({top: 0, height: 0, opacity: 0});
    const activeIndex = useActiveNavIndex(navLinks, pathname);

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
        const frame = requestAnimationFrame(updatePill);
        return () => cancelAnimationFrame(frame);
    }, [updatePill, navLinks]);

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
    }, [updatePill, navLinks]);

    return (
        <nav
            ref={navRef}
            aria-label="Main navigation"
            className="relative px-4 sm:px-6 py-4 sm:py-5 space-y-1.5"
        >
            <span
                aria-hidden
                className="absolute left-4 right-4 sm:left-6 sm:right-6 rounded-xl bg-[#FFCF00] border border-[#1A1208]/15 shadow-sm pointer-events-none transition-[top,height,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{
                    top: pill.top,
                    height: pill.height,
                    opacity: pill.opacity,
                }}
            />

            {navLinks.map((link, index) => {
                const active = isNavLinkActive(pathname, link.href);

                return (
                    <Link
                        key={`${link.href}-${link.label}`}
                        ref={(el) => {
                            linkRefs.current[index] = el;
                        }}
                        href={link.href}
                        className={cn(
                            'relative z-10 flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-colors border border-transparent',
                            active
                                ? 'text-[#1A1208]'
                                : 'text-[#1A1208] hover:text-[#1A1208]',
                        )}
                        onClick={onNavigate}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}

function UserAvatar({
                        name,
                        photoUrl,
                        size = 'md',
                    }: {
    name: string;
    photoUrl: string | null;
    size?: 'sm' | 'md';
}) {
    const dim = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm';

    if (photoUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={photoUrl}
                alt={name}
                className={cn(dim, 'rounded-full object-cover ring-2 ring-white shadow-sm')}
            />
        );
    }

    return (
        <div
            className={cn(
                dim,
                'rounded-full flex items-center justify-center text-[#1A1208] font-semibold shrink-0 shadow-sm ring-2 ring-white',
            )}
            style={{background: 'var(--gradient-gold-btn)'}}
        >
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function UserMenuDropdown({
                              user,
                              photoUrl,
                              firstName,
                              onClose,
                          }: {
    user: { name: string; email: string };
    photoUrl: string | null;
    firstName: string;
    onClose: () => void;
}) {
    const clearAuth = useAuthStore((s) => s.clearAuth);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch {
            /* proceed with local clear */
        }
        clearAuth();
        onClose();
        window.location.href = '/';
    };

    return (
        <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(15rem,calc(100vw-2rem))] rounded-2xl border border-[#E8DFCC] bg-white py-2 animate-in fade-in slide-in-from-top-2 duration-200"
            style={{boxShadow: 'var(--shadow-card-hover)'}}
        >
            <div className="px-4 py-3 border-b border-[#F0EAD9]">
                <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} photoUrl={photoUrl}/>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                </div>
            </div>

            <div className="py-1.5">
                <Link
                    href="/dashboard"
                    role="menuitem"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1A1208] hover:bg-[#FFCF00]/15 hover:text-[#1A1208] transition-colors"
                >
                    <LayoutDashboard size={16} className="text-[#1A1208] shrink-0"/>
                    Dashboard
                </Link>
                <Link
                    href="/profile/edit"
                    role="menuitem"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#1A1208] hover:bg-[#FFCF00]/15 hover:text-[#1A1208] transition-colors"
                >
                    <User size={16} className="text-[#1A1208] shrink-0"/>
                    My Profile
                </Link>
            </div>

            <div className="border-t border-[#F0EAD9] pt-1.5">
                <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={16} className="shrink-0"/>
                    Sign out
                </button>
            </div>
        </div>
    );
}

function UserMenuTrigger({
                             user,
                             photoUrl,
                             firstName,
                             compact = false,
                         }: {
    user: { name: string; email: string };
    photoUrl: string | null;
    firstName: string;
    compact?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [open]);

    const close = () => setOpen(false);

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Account menu"
                className={cn(
                    'flex items-center gap-2 rounded-full border transition-all duration-200 max-w-full',
                    compact ? 'pl-1 pr-2 py-1' : 'pl-1.5 pr-3 py-1.5 gap-2.5',
                    open
                        ? 'border-[#FFCF00] bg-[#FFCF00]/15 shadow-sm'
                        : 'border-[#E8DFCC] bg-white hover:bg-[#FFCF00]/10 hover:border-[#FFCF00]/50',
                )}
            >
                <UserAvatar name={user.name} photoUrl={photoUrl} size="sm"/>
                {compact ? (
                    <span
                        className="text-xs sm:text-[0.8125rem] font-semibold text-foreground truncate max-w-[4.5rem] sm:max-w-[6rem]">
            {firstName}
          </span>
                ) : (
                    <div className="text-left min-w-0 hidden sm:block">
                        <p className="text-[0.8125rem] font-semibold text-foreground leading-tight truncate max-w-[6.5rem] md:max-w-[7.5rem] lg:max-w-[8.5rem]">
                            {firstName}
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[6.5rem] md:max-w-[7.5rem] lg:max-w-[8.5rem] hidden md:block">
                            {user.email}
                        </p>
                    </div>
                )}
                <ChevronDown
                    size={14}
                    className={cn(
                        'text-meta shrink-0 transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <UserMenuDropdown
                    user={user}
                    photoUrl={photoUrl}
                    firstName={firstName}
                    onClose={close}
                />
            )}
        </div>
    );
}

export default function Navbar({siteName, siteSlogan, logoUrl, navLinks}: NavbarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted || !isAuthenticated) {
            setPhotoUrl(null);
            return;
        }

        let cancelled = false;
        profileService
            .getMyProfile()
            .then((res) => {
                if (cancelled) return;
                const profile = res.data.data;
                setPhotoUrl(resolvePrimaryPhotoUrl(profile.primary_photo, profile.photos));
            })
            .catch(() => {
                if (!cancelled) setPhotoUrl(null);
            });

        return () => {
            cancelled = true;
        };
    }, [mounted, isAuthenticated, user?.id]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    const showGuest = mounted && !isAuthenticated;
    const showUser = mounted && isAuthenticated && user;
    const firstName = user?.name?.split(' ')[0] ?? '';

    return (
        <header
            className="sticky top-0 z-50 border-b-2 border-[#FFCF00]"
            style={{
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: 'var(--shadow-nav)',
            }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-3 h-14 sm:h-[4.25rem] min-h-14">
                    {/* Brand — site name + slogan */}
                    <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 group max-w-[10rem] sm:max-w-[15rem] lg:max-w-[17rem]">
                        <div className="min-w-0 leading-tight">
                            <p
                                className="text-sm sm:text-[0.9375rem] lg:text-base font-bold text-[#1A1208] truncate transition-colors group-hover:text-[#1A1208] group-hover:underline decoration-[#FFCF00] decoration-2 underline-offset-4"
                                style={{fontFamily: 'var(--font-heading, serif)'}}
                            >
                                {siteName}
                            </p>
                            {siteSlogan && (
                                <p className="text-[10px] sm:text-[11px] text-meta font-semibold truncate mt-0.5 tracking-wide">
                                    {siteSlogan}
                                </p>
                            )}
                        </div>
                    </Link>

                    <DesktopNavMenu navLinks={navLinks} pathname={pathname} />

                    {/* Desktop Auth */}
                    <div className="hidden lg:flex items-center gap-2.5 shrink-0">
                        {showGuest && (
                            <>
                                <Link
                                    href="/login"
                                    className="px-3 xl:px-4 py-2 text-[0.8125rem] font-semibold text-meta hover:text-[#1A1208] hover:bg-[#FFCF00]/15 rounded-lg transition-colors duration-200 whitespace-nowrap"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="group inline-flex items-center gap-2 px-4 xl:px-5 py-2.5 rounded-full text-[0.8125rem] font-semibold text-[#1A1208] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                                    style={{
                                        background: 'var(--gradient-gold-btn)',
                                        boxShadow: 'var(--shadow-btn)',
                                    }}
                                >
                                    Join Free
                                    <ArrowRight
                                        size={14}
                                        className="transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </Link>
                            </>
                        )}

                        {showUser && (
                            <UserMenuTrigger
                                user={user}
                                photoUrl={photoUrl}
                                firstName={firstName}
                            />
                        )}
                    </div>

                    {/* Mobile / Tablet — user menu + hamburger */}
                    <div className="flex lg:hidden items-center gap-1.5 sm:gap-2 shrink-0">
                        {showUser && (
                            <UserMenuTrigger
                                user={user}
                                photoUrl={photoUrl}
                                firstName={firstName}
                                compact
                            />
                        )}

                        <button
                            type="button"
                            className="p-2 sm:p-2.5 rounded-xl text-[#1A1208] hover:text-[#1A1208] hover:bg-[#FFCF00]/20 transition-colors shrink-0"
                            onClick={() => setOpen(!open)}
                            aria-expanded={open}
                            aria-label="Toggle menu"
                        >
                            {open ? <X size={22}/> : <Menu size={22}/>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile / Tablet drawer */}
            {open && (
                <div
                    className="lg:hidden border-t-2 border-[#FFCF00] max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain"
                    style={{background: 'rgba(255, 255, 255, 0.98)'}}
                >
                    <MobileNavMenu
                        navLinks={navLinks}
                        pathname={pathname}
                        onNavigate={() => setOpen(false)}
                    />

                    {showGuest && (
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                            <div className="pt-4 border-t border-[#FFCF00]/25 space-y-2">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold text-[#1A1208] border border-[#FFCF00]/40 bg-white hover:bg-[#FFCF00]/10 transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-[#1A1208] transition-all active:scale-[0.98]"
                                    style={{background: 'var(--gradient-gold-btn)', boxShadow: 'var(--shadow-btn)'}}
                                    onClick={() => setOpen(false)}
                                >
                                    Join Free
                                    <ArrowRight size={15}/>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    );
}
