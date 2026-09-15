'use client';

import {useState, useEffect} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import {useAuthStore} from '@/store/authStore';
import {getPostAuthRedirect} from '@/lib/authRedirect';

/**
 * GuestGuard — wraps auth pages (login, register, forgot-password …).
 *
 * • During SSR / before Zustand has hydrated from localStorage, renders children
 *   as-is so there is no flash of empty content.
 * • After hydration, authenticated users are redirected to their next onboarding
 *   step (verify-email, face-scan, or dashboard).
 * • /verify-email is allowed while the user still needs email verification.
 */
export function GuestGuard({children}: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !isAuthenticated || !user) return;

        const destination = getPostAuthRedirect(user);

        if (pathname === '/verify-email' && destination === '/verify-email') {
            return;
        }

        router.replace(destination);
    }, [mounted, isAuthenticated, user, pathname, router]);

    if (!mounted) return <>{children}</>;

    if (isAuthenticated && user) {
        const destination = getPostAuthRedirect(user);
        if (pathname !== '/verify-email' || destination !== '/verify-email') {
            return null;
        }
    }

    return <>{children}</>;
}
