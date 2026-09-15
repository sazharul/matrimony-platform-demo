/**
 * publicService.ts
 *
 * Server-side fetch functions for public API endpoints (settings, pages).
 * Uses native fetch with ISR revalidation — NOT axios — so they work
 * safely in Next.js Server Components (no browser-only code).
 */

import type {SiteSettings} from '@/types/settings';
import type {PageDetail, PageListItem} from '@/types/page';
import type {SubscriptionPlan, PublicSubscriptionPlansPayload, FeatureDefinitions} from '@/types/subscription';
import type {PublicProfileCard} from '@/types/publicProfile';
import {notFound} from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'MatriConnect';

/** Fallback max-age when on-demand revalidation is not triggered. */
const CACHE_MAX_AGE = 86_400;

/** Shorter cache for frequently changing homepage member previews. */
const RECENT_MEMBERS_CACHE_SECONDS = 60;
const RECENT_MEMBERS_LIMIT = 8;

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<SiteSettings> {
    const res = await fetch(`${BASE_URL}/api/v1/settings`, {
        next: {tags: ['site-settings'], revalidate: CACHE_MAX_AGE},
    });

    if (!res.ok) {
        // Return sensible defaults if the backend is unavailable
        return {
            site_name: APP_NAME,
            site_slogan: 'Find Your Perfect Life Partner',
            site_logo: null,
            site_favicon: null,
            currency: 'BDT',
            currency_symbol: '৳',
            contact_email: null,
            contact_phone: null,
            contact_address: 'Dhaka, Bangladesh',
            face_scan_enabled: '1',
            email_verification_enabled: '1',
            facebook_url: null,
            twitter_url: null,
            instagram_url: null,
            linkedin_url: null,
            email_otp_expiry_minutes: null,
            meta_title: `${APP_NAME} — Find Your Perfect Life Partner`,
            meta_description: `Find your perfect life partner on ${APP_NAME} — a trusted matrimony platform.`,
            meta_keywords: 'matrimony, marriage, Bangladesh',
        };
    }

    const json: ApiResponse<SiteSettings> = await res.json();
    return json.data;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export async function getPages(): Promise<PageListItem[]> {
    const res = await fetch(`${BASE_URL}/api/v1/pages`, {
        next: {tags: ['cms-pages'], revalidate: CACHE_MAX_AGE},
    });

    if (!res.ok) return [];

    const json: ApiResponse<PageListItem[]> = await res.json();
    return json.data ?? [];
}

/** Published CMS pages flagged with show_in_menu in the admin panel. */
export async function getMenuPages(): Promise<PageListItem[]> {
    const res = await fetch(`${BASE_URL}/api/v1/pages?menu=1`, {
        next: {tags: ['cms-pages'], revalidate: CACHE_MAX_AGE},
    });

    if (!res.ok) return [];

    const json: ApiResponse<PageListItem[]> = await res.json();
    return json.data ?? [];
}

export async function getPage(slug: string): Promise<PageDetail> {
    const res = await fetch(`${BASE_URL}/api/v1/pages/${slug}`, {
        next: {tags: ['cms-pages', `cms-page:${slug}`], revalidate: CACHE_MAX_AGE},
    });

    if (!res.ok || res.status === 404) {
        notFound();
    }

    const json: ApiResponse<PageDetail> = await res.json();

    if (!json.success || !json.data) {
        notFound();
    }

    return json.data;
}

// ─── Subscription Plans ────────────────────────────────────────────────────

export async function getSubscriptionPlans(): Promise<PublicSubscriptionPlansPayload> {
    const res = await fetch(`${BASE_URL}/api/v1/subscription-plans`, {
        next: {revalidate: 60},
    });

    if (!res.ok) {
        return { plans: [], feature_definitions: {} };
    }

    const json: ApiResponse<PublicSubscriptionPlansPayload | SubscriptionPlan[]> = await res.json();
    const data = json.data;

    if (Array.isArray(data)) {
        return { plans: data, feature_definitions: {} };
    }

    return {
        plans: data?.plans ?? [],
        feature_definitions: data?.feature_definitions ?? {},
    };
}

// ─── Recent Members (Homepage) ─────────────────────────────────────────────

export async function getRecentMembers(
    limit: number = RECENT_MEMBERS_LIMIT,
): Promise<PublicProfileCard[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 12);

    const res = await fetch(
        `${BASE_URL}/api/v1/public/profiles/recent?limit=${safeLimit}`,
        {
            next: {
                tags: ['recent-members'],
                revalidate: RECENT_MEMBERS_CACHE_SECONDS,
            },
        },
    );

    if (!res.ok) {
        return [];
    }

    const json: ApiResponse<PublicProfileCard[]> = await res.json();
    return json.data ?? [];
}

