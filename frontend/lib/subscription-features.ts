import type { FeatureDefinitions, PlanFeatures, SubscriptionPlan } from '@/types/subscription';

/** Fallback labels when API definitions are unavailable (e.g. offline). */
const FALLBACK_FEATURE_LABELS: Record<string, { label: string; type: 'bool' | 'qty' | 'enum'; period?: string }> = {
    daily_matches: { label: 'Daily Match Suggestions', type: 'qty', period: '/day' },
    profile_views_per_day: { label: 'Profile Views per Day', type: 'qty', period: '/day' },
    send_interest_per_day: { label: 'Interests Sent per Day', type: 'qty', period: '/day' },
    chat_access: { label: 'Chat Access', type: 'bool' },
    audio_call_access: { label: 'Audio Calls', type: 'bool' },
    video_call_access: { label: 'Video Calls', type: 'bool' },
    see_who_viewed_profile: { label: 'See Profile Visitors', type: 'bool' },
    max_photos_upload: { label: 'Max Photos Upload', type: 'qty' },
    push_notifications: { label: 'Push Notifications', type: 'bool' },
    email_digest_frequency: { label: 'Email Digest', type: 'enum' },
};

export interface PlanFeatureRow {
    key: string;
    label: string;
    extra: string | null;
}

function resolveDef(key: string, definitions: FeatureDefinitions) {
    const fromApi = definitions[key];
    if (fromApi) {
        const period =
            fromApi.period === 'day' ? '/day' : fromApi.period === 'month' ? '/month' : fromApi.period ?? undefined;
        return { label: fromApi.label, type: fromApi.type, period };
    }
    return FALLBACK_FEATURE_LABELS[key];
}

export function formatPlanDuration(plan: { duration_qty?: number; duration_unit?: string; duration_days?: number }) {
    const qty = plan.duration_qty ?? plan.duration_days ?? 30;
    const unit = plan.duration_unit ?? 'day';
    if (qty === 1) return `1 ${unit}`;
    return `${qty} ${unit}s`;
}

function isFeatureEnabled(value: unknown): boolean {
    return value !== false && value !== 0 && value !== 'none' && value !== undefined && value !== null;
}

function rawFeatureValue(
    features: PlanFeatures | string[] | undefined,
    key: string,
): boolean | number | string | undefined {
    if (!features || Array.isArray(features)) return undefined;
    return features[key];
}

export function featureAccessScore(
    key: string,
    value: boolean | number | string | undefined,
    definitions: FeatureDefinitions = {},
): number {
    if (!isFeatureEnabled(value)) return 0;

    const def = resolveDef(key, definitions);
    if (!def) return 1;

    if (def.type === 'bool') return value === true ? 100 : 0;

    if (def.type === 'qty') {
        const n = Number(value);
        if (n === -1) return 10_000;
        return n;
    }

    if (def.type === 'enum') {
        const s = String(value).toLowerCase();
        if (s === 'daily') return 300;
        if (s === 'weekly') return 200;
        if (s === 'monthly') return 100;
        return 50;
    }

    return 1;
}

export function getFeatureLabel(key: string, definitions: FeatureDefinitions = {}): string {
    return (
        resolveDef(key, definitions)?.label ??
        key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );
}

function definitionOrder(definitions: FeatureDefinitions): string[] {
    return Object.keys(definitions).length > 0 ? Object.keys(definitions) : Object.keys(FALLBACK_FEATURE_LABELS);
}

export function getEnabledFeatures(features: PlanFeatures | string[], definitions: FeatureDefinitions = {}) {
    if (Array.isArray(features)) {
        return features.map((label, i) => ({ key: `feature_${i}`, label, value: true as boolean | number | string }));
    }

    return Object.entries(features ?? {})
        .filter(([, v]) => isFeatureEnabled(v))
        .map(([key, value]) => ({ key, label: getFeatureLabel(key, definitions), value }));
}

export function renderFeatureExtra(
    key: string,
    value: boolean | number | string,
    definitions: FeatureDefinitions = {},
): string | null {
    const def = resolveDef(key, definitions);
    if (!def || def.type === 'bool') return null;
    if (def.type === 'qty') {
        const n = Number(value);
        return n === -1 ? 'Unlimited' : `${n}${def.period ?? ''}`;
    }
    if (def.type === 'enum') return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    return null;
}

/**
 * All enabled features for a plan card — driven by API feature data + definitions.
 * Uses comparison key order when provided; otherwise sorts by access level.
 */
export function getCardFeatures(
    features: PlanFeatures | string[],
    definitions: FeatureDefinitions = {},
    orderedKeys?: string[],
): PlanFeatureRow[] {
    if (Array.isArray(features)) {
        return features.map((label, i) => ({ key: `feature_${i}`, label, extra: null }));
    }

    const planFeatures = features ?? {};
    const order = definitionOrder(definitions);

    let keys: string[];

    if (orderedKeys?.length) {
        keys = orderedKeys.filter((key) => isFeatureEnabled(planFeatures[key]));
    } else {
        keys = Object.entries(planFeatures)
            .filter(([, v]) => isFeatureEnabled(v))
            .map(([key]) => key)
            .sort(
                (a, b) =>
                    featureAccessScore(b, planFeatures[b], definitions) -
                        featureAccessScore(a, planFeatures[a], definitions) ||
                    order.indexOf(a) - order.indexOf(b),
            );
    }

    return keys.map((key) => ({
        key,
        label: getFeatureLabel(key, definitions),
        extra: renderFeatureExtra(key, planFeatures[key], definitions),
    }));
}

/** Union of enabled feature keys across all plans, ranked by top access level. */
export function buildComparisonFeatureKeys(
    plans: SubscriptionPlan[],
    definitions: FeatureDefinitions = {},
): string[] {
    const keys = new Set<string>();

    for (const plan of plans) {
        if (Array.isArray(plan.features)) continue;
        for (const [key, value] of Object.entries(plan.features ?? {})) {
            if (isFeatureEnabled(value)) keys.add(key);
        }
    }

    const order = definitionOrder(definitions);

    return Array.from(keys).sort((a, b) => {
        const maxA = Math.max(...plans.map((p) => featureAccessScore(a, rawFeatureValue(p.features, a), definitions)));
        const maxB = Math.max(...plans.map((p) => featureAccessScore(b, rawFeatureValue(p.features, b), definitions)));
        if (maxB !== maxA) return maxB - maxA;
        return order.indexOf(a) - order.indexOf(b);
    });
}

export function formatFeatureDisplayValue(
    key: string,
    value: boolean | number | string | undefined,
    definitions: FeatureDefinitions = {},
): string {
    if (!isFeatureEnabled(value)) return '—';

    const def = resolveDef(key, definitions);
    if (!def) return String(value);
    if (def.type === 'bool') return '✓';
    if (def.type === 'qty') {
        const n = Number(value);
        return n === -1 ? 'Unlimited' : `${n}${def.period ?? ''}`;
    }
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export function featureValueForPlan(
    features: PlanFeatures | string[] | undefined,
    key: string,
    definitions: FeatureDefinitions = {},
): string {
    if (!features || Array.isArray(features)) return '—';
    return formatFeatureDisplayValue(key, features[key], definitions);
}

export function pickPopularPlanId(
    plans: { id: number; price_bdt: number; slug: string; subscription_type?: { name: string } | null }[],
) {
    const paid = plans.filter((p) => p.price_bdt > 0);
    if (paid.length === 0) return null;

    const gold = paid.find((p) => {
        const name = p.subscription_type?.name?.toLowerCase() ?? '';
        return name.includes('gold') || p.slug.includes('gold');
    });

    return gold?.id ?? paid[Math.floor(paid.length / 2)]?.id ?? paid[0]?.id ?? null;
}

export function planCardsGridClass(count: number): string {
    if (count <= 1) return 'grid-cols-1 max-w-md mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';
}

export function comparisonTableMinWidth(planCount: number): number {
    return Math.max(640, 200 + planCount * 140);
}
