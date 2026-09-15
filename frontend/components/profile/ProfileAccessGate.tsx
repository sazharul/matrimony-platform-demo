'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { CrownIcon } from '@/components/ui/icons';

interface ProfileUpgradePromptProps {
    title: string;
    message: string;
}

export function ProfileUpgradePrompt({ title, message }: ProfileUpgradePromptProps) {
    return (
        <div className="rounded-3xl overflow-hidden shadow-md border border-[#e8d59a]/60 bg-white text-center px-6 py-10 md:px-10 max-w-lg w-full">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <CrownIcon size={40} strokeWidth={1.5} className="text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#1F2937]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {title}
            </h3>
            <p className="text-meta mt-2 max-w-md mx-auto text-sm leading-relaxed"
               style={{ fontFamily: 'system-ui, sans-serif' }}>
                {message}
            </p>
            <Link
                href="/subscription"
                className="btn-gold mt-6 inline-flex items-center justify-center text-sm"
                style={{ height: '2.75rem', borderRadius: '0.75rem', padding: '0 1.75rem' }}
            >
                <CrownIcon size={16} strokeWidth={2} className="mr-2" />
                Upgrade Plan
            </Link>
        </div>
    );
}

interface ProfileAccessGateProps {
    isLoading: boolean;
    isFreePlanAccessError: boolean;
    isSubscriptionLimitError: boolean;
    subscriptionLimitMessage: string;
    isError: boolean;
    children: ReactNode;
}

export function ProfileAccessGate({
    isLoading,
    isFreePlanAccessError,
    isSubscriptionLimitError,
    subscriptionLimitMessage,
    isError,
    children,
}: ProfileAccessGateProps) {
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFAF4]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-[#FFCF00]/30 border-t-[#FFCF00] animate-spin" />
                    <p className="text-[#1A1208] font-serif text-sm tracking-widest uppercase">Loading…</p>
                </div>
            </div>
        );
    }

    if (isFreePlanAccessError) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#FDFAF4]">
                <ProfileUpgradePrompt
                    title="Upgrade to View Full Profile"
                    message="Free account holders cannot view full profiles. Upgrade your plan to unlock complete profile details."
                />
            </div>
        );
    }

    if (isSubscriptionLimitError) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#FDFAF4]">
                <ProfileUpgradePrompt
                    title="Daily Profile View Limit Reached"
                    message={subscriptionLimitMessage}
                />
            </div>
        );
    }

    if (isError) return null;

    return <>{children}</>;
}
