'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {queryClient} from '@/lib/queryClient';
import {invalidateSubscriptionQueries, invalidateDashboardQueries} from '@/lib/cacheInvalidation';
import {useAuthStore} from '@/store/authStore';
import {authService} from '@/services/authService';

const PLAN_LABELS: Record<string, string> = {
    silver:   'Silver',
    gold:     'Gold',
    platinum: 'Platinum',
};

const PLAN_ICONS: Record<string, string> = {
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
};

function SubscriptionSuccessContent() {
    const searchParams = useSearchParams();
    const { updateUser } = useAuthStore();
    const plan = searchParams.get('plan') ?? '';

    // Refresh the user profile so the auth store reflects the new plan
    useEffect(() => {
        invalidateSubscriptionQueries(queryClient);
        invalidateDashboardQueries(queryClient);
        authService.me().then((res) => {
            const u = res.data?.data?.user;
            if (u) updateUser(u);
        }).catch(() => { /* silent */ });
    }, [updateUser]);

    return (
        <main className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Success icon */}
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                {/* Plan badge */}
                {plan && PLAN_LABELS[plan] && (
                    <div className="text-4xl mb-3">{PLAN_ICONS[plan] ?? '⭐'}</div>
                )}

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Payment Successful!
                </h1>

                <p className="text-meta mb-2">
                    {plan && PLAN_LABELS[plan]
                        ? <>Your <strong className="text-gray-800">{PLAN_LABELS[plan]}</strong> subscription is now active.</>
                        : 'Your subscription is now active.'
                    }
                </p>
                <p className="text-sm text-[#4A3F2E] mb-8">
                    You now have access to all premium features. Enjoy your MatriConnect experience!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/matches"
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#FFCF00] hover:bg-[#a8891e] text-[#1A1208] transition-colors"
                    >
                        Browse Matches
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default function SubscriptionSuccessPage() {
    return (
        <Suspense fallback={
            <main className="min-h-[70vh] flex items-center justify-center px-4">
                <p className="text-sm text-meta">Loading…</p>
            </main>
        }>
            <SubscriptionSuccessContent/>
        </Suspense>
    );
}

