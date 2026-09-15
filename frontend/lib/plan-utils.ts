/**
 * plan-utils.ts
 *
 * Shared helpers for subscription plan display.
 * Used by: layout.tsx (sidebar badge) and subscription/page.tsx (plan cards)
 * so both places render tiers in the same style.
 */

export type PlanTier = 'free' | 'silver' | 'gold' | 'platinum';

export interface SubscriptionTypeRef {
    id: number;
    name: string;
}

/** Resolve display tier from plan type relation, slug, or name. */
export function resolvePlanTier(
    plan?: { plan_type?: string | number; slug?: string; name?: string; subscription_type?: SubscriptionTypeRef | null } | null,
): PlanTier | string {
    const typeName = plan?.subscription_type?.name?.toLowerCase();
    if (typeName) return typeName;

    const slug = (plan?.slug ?? '').toLowerCase();
    if (slug.includes('platinum')) return 'platinum';
    if (slug.includes('gold')) return 'gold';
    if (slug.includes('silver')) return 'silver';
    if (slug.includes('free')) return 'free';

    const legacy = String(plan?.plan_type ?? '').toLowerCase();
    if (['free', 'silver', 'gold', 'platinum'].includes(legacy)) return legacy as PlanTier;

    const name = (plan?.name ?? '').toLowerCase();
    if (name.includes('platinum')) return 'platinum';
    if (name.includes('gold')) return 'gold';
    if (name.includes('silver')) return 'silver';

    return 'free';
}

/** Human-friendly display label for a tier slug */
export function planLabel(plan?: string | null): string {
    const p = (plan ?? 'free').toLowerCase();
    return ({
        free:     'Free (Basic)',
        silver:   'Silver',
        gold:     'Gold',
        platinum: 'Platinum',
    } as Record<string, string>)[p] ?? (
        String(plan ?? '').charAt(0).toUpperCase() + String(plan ?? '').slice(1)
    );
}

/** Tailwind classes for a pill badge per tier (background + text colour) */
export function planBadgeClass(plan?: string | null): string {
    const p = (plan ?? 'free').toLowerCase();
    return ({
        free:     'bg-gray-200 text-gray-700',
        silver:   'bg-gray-400 text-white',
        gold:     'bg-amber-500 text-white',
        platinum: 'bg-purple-600 text-white',
    } as Record<string, string>)[p] ?? 'bg-gray-700 text-white';
}

/** Emoji icon for a tier */
export function planIcon(plan?: string | null): string {
    const p = (plan ?? 'free').toLowerCase();
    return ({
        free:     '🆓',
        silver:   '🥈',
        gold:     '🥇',
        platinum: '💎',
    } as Record<string, string>)[p] ?? '⭐';
}

/**
 * Card gradient + border classes (used in subscription page plan cards
 * and the active plan snapshot panel).
 */
export function planGradient(plan?: string | null): string {
    const p = (plan ?? 'free').toLowerCase();
    return ({
        free:     'from-gray-50 to-white border-gray-200',
        silver:   'from-gray-100 to-gray-50 border-gray-300',
        gold:     'from-amber-50 to-yellow-50 border-amber-400',
        platinum: 'from-purple-50 to-indigo-50 border-purple-400',
    } as Record<string, string>)[p] ?? 'from-gray-50 to-white border-gray-200';
}

/**
 * Convenience: returns all four style tokens for a plan at once.
 * Mirrors the old inline `tierStyle()` function.
 */
export function tierStyle(plan?: string | null) {
    return {
        icon:  planIcon(plan),
        badge: planBadgeClass(plan),
        grad:  planGradient(plan),
        label: planLabel(plan),
    };
}

