import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

function getCfConfig() {
    return {
        delivery: (process.env.NEXT_PUBLIC_CF_IMAGE_DELIVERY_URL ?? '').replace(/\/$/, ''),
        hash: process.env.NEXT_PUBLIC_CF_ACCOUNT_HASH ?? '',
    };
}

/** Build a Cloudflare Images delivery URL using the public variant. */
export function cfImageUrl(imageRef: string | null | undefined): string | null {
    if (!imageRef) return null;

    const base = resolveCfImageBase(imageRef);
    if (!base) return null;

    return `${base}/public`;
}

function resolveCfImageBase(ref: string): string | null {
    if (/^https?:\/\//i.test(ref)) {
        return ref.replace(/\/(public|w=[^/]+(?:,[^/]+)*)$/, '');
    }

    const { delivery, hash } = getCfConfig();
    if (!delivery || !hash) return null;

    const imageId = ref.replace(/^\//, '');
    return `${delivery}/${hash}/${imageId}`;
}

/** Resolve a Cloudflare image ID from the API into a delivery URL. */
export function resolvePhotoUrl(path: string | null | undefined): string | null {
    return cfImageUrl(path);
}

/** Resolve a profile photo using `file_path` or `url` from the API. */
export function resolveProfilePhotoUrl(
    photo: { url?: string | null; file_path?: string | null } | null | undefined,
): string | null {
    if (!photo) return null;
    const path = photo.file_path ?? photo.url;
    if (!path) return null;

    if (/^https?:\/\//i.test(path)) return path;

    if (path.startsWith('/avatars/') || path.startsWith('/storage/')) {
        const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
        return apiUrl ? `${apiUrl}${path}` : path;
    }

    return cfImageUrl(path);
}

export function formatAge(dob: string | null | undefined): string {
    if (!dob) return 'N/A';
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return `${age} yrs`;
}

function heightParts(cm: number): { feet: number; inches: number } {
    const totalInches = Math.round(cm / 2.54);
    return {
        feet: Math.floor(totalInches / 12),
        inches: totalInches % 12,
    };
}

export const HEIGHT_CM_MIN = 120;
export const HEIGHT_CM_MAX = 210;

export type HeightGroup = {
    key: string;
    minCm: number;
    maxCm: number;
};

let cachedHeightGroups: HeightGroup[] | null = null;

/** Group cm values by identical ft/in label; keep min + max cm per group. */
export function getHeightGroups(): HeightGroup[] {
    if (cachedHeightGroups) return cachedHeightGroups;

    const map = new Map<string, HeightGroup>();

    for (let cm = HEIGHT_CM_MIN; cm <= HEIGHT_CM_MAX; cm++) {
        const key = formatHeightImperial(cm);
        const existing = map.get(key);

        if (!existing) {
            map.set(key, { key, minCm: cm, maxCm: cm });
            continue;
        }

        existing.maxCm = cm;
    }

    cachedHeightGroups = Array.from(map.values()).sort((a, b) => a.minCm - b.minCm);
    return cachedHeightGroups;
}

/** One dropdown row per ft/in bucket, labelled with the highest cm in that bucket. */
export function buildHeightOptions(): { value: string; label: string }[] {
    return getHeightGroups().map((group) => ({
        value: String(group.maxCm),
        label: `${group.key} (${group.maxCm} cm)`,
    }));
}

export function heightGroupForCm(cm: number): HeightGroup | undefined {
    return getHeightGroups().find((group) => cm >= group.minCm && cm <= group.maxCm);
}

export function heightGroupMinCm(cm: number): number {
    return heightGroupForCm(cm)?.minCm ?? cm;
}

export function heightGroupMaxCm(cm: number): number {
    return heightGroupForCm(cm)?.maxCm ?? cm;
}

/** Map any stored cm to the select option value (max cm in its ft/in group). */
export function resolveHeightOptionValue(cm: number | string | null | undefined): string | undefined {
    if (cm === null || cm === undefined || cm === '') return undefined;
    const cmNum = Number(cm);
    if (Number.isNaN(cmNum)) return undefined;
    return String(heightGroupMaxCm(cmNum));
}

export function applyHeightFiltersForApi<T extends { height_min?: number; height_max?: number }>(
    filters: T,
): T {
    return {
        ...filters,
        height_min: filters.height_min != null ? heightGroupMinCm(filters.height_min) : undefined,
        height_max: filters.height_max != null ? heightGroupMaxCm(filters.height_max) : undefined,
    };
}

/** Feet/inches part — skips redundant "0 in". */
export function formatHeightImperial(cm: number | null | undefined): string {
    if (!cm) return 'N/A';
    const { feet, inches } = heightParts(cm);
    if (inches === 0) return `${feet} ft`;
    return `${feet} ft ${inches} in`;
}

/** Full display: ft/in + cm in brackets once (e.g. 4 ft 1 in (150 cm)). */
export function formatHeight(cm: number | null | undefined): string {
    if (!cm) return 'N/A';
    return `${formatHeightImperial(cm)} (${cm} cm)`;
}

/** Height range with a single cm suffix. */
export function formatHeightRange(minCm: number, maxCm: number): string {
    const minLabel = formatHeightImperial(minCm);
    const maxLabel = formatHeightImperial(maxCm);
    const imperial = minCm === maxCm ? minLabel : `${minLabel} – ${maxLabel}`;
    const cm = minCm === maxCm ? `${minCm} cm` : `${minCm}–${maxCm} cm`;
    return `${imperial} (${cm})`;
}

/** Format search-filter values for display in active filter badges. */
export function formatSearchFilterValue(key: string, value: unknown): string {
    if ((key === 'height_min' || key === 'height_max') && value !== undefined && value !== null && value !== '') {
        const cm = Number(value);
        if (!Number.isNaN(cm)) {
            const group = heightGroupForCm(cm);
            if (group) {
                return `${group.key} (${group.maxCm} cm)`;
            }
            return formatHeight(cm);
        }
    }

    return String(value);
}

export function formatScore(score: number): string {
    return `${Math.round(score)}%`;
}

export function getScoreColor(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
    if (score >= 70) return 'bg-green-100 text-green-700';
    if (score >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-600';
}

export function timeAgo(dateString: string | null | undefined): string {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}
