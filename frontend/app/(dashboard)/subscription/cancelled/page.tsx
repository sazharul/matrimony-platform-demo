'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const REASON_MESSAGES: Record<string, string> = {
    payment_failed: 'Your payment was declined. Please try a different payment method.',
    cancelled:      'You cancelled the payment. No charge was made.',
    invalid:        'Payment verification failed. Please contact support if money was deducted.',
    not_found:      'Transaction not found. Please contact support.',
};

function SubscriptionCancelledContent() {
    const searchParams = useSearchParams();
    const reason = searchParams.get('reason') ?? 'cancelled';

    const message = REASON_MESSAGES[reason] ?? 'The payment process was not completed.';

    return (
        <main className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {reason === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                </h1>

                <p className="text-meta mb-8">{message}</p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/subscription"
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#FFCF00] hover:bg-[#a8891e] text-[#1A1208] transition-colors"
                    >
                        Try Again
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>

                <p className="mt-6 text-xs text-[#4A3F2E]">
                    Need help? Contact us at support@MatriConnect.com
                </p>
            </div>
        </main>
    );
}

export default function SubscriptionCancelledPage() {
    return (
        <Suspense fallback={
            <main className="min-h-[70vh] flex items-center justify-center px-4">
                <p className="text-sm text-meta">Loading…</p>
            </main>
        }>
            <SubscriptionCancelledContent/>
        </Suspense>
    );
}

