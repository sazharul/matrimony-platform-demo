import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

/** Canonical option type for all dynamic select fields (matches API response). */
export type OptionItem = {
    id: number;
    value: string;
    label: string;
    metadata?: Record<string, unknown>;
};

/** @deprecated Use OptionItem */
export type DynamicOption = OptionItem;

const STALE_MS = 1000 * 60 * 60; // 1 hour — options rarely change

const EMPTY_OPTIONS: OptionItem[] = [];

type BulkOptionsResponse = {
    groups: Record<string, OptionItem[]>;
    children: Record<string, OptionItem[]>;
};

/** Top-level option groups used on the search filters panel. */
export const SEARCH_FILTER_OPTION_GROUPS = [
    'religion',
    'marital_status',
    'education_level',
    'profession',
    'employed_in',
    'diet',
    'smoking',
    'drinking',
    'body_type',
    'complexion',
    'blood_group',
    'mother_tongue',
    // 'nationality', // retired
    'country',
    'residing_status',
    'have_children',
] as const;

/** Top-level option groups used on the profile edit form. */
export const PROFILE_EDIT_OPTION_GROUPS = [
    'profile_created_by',
    'profile_created_for',
    'looking_for',
    'marital_status',
    'have_children',
    'child_living_status',
    'body_type',
    'eye_color',
    'hair_color',
    'complexion',
    'blood_group',
    'disability',
    'smoking',
    'drinking',
    'religion',
    'religiousness',
    'pray',
    'manglik_status',
    'mother_tongue',
    'family_values',
    'occupation',
    'profession',
    'education_level',
    'employed_in',
    'diet',
    'eye_wear',
    'hobbies',
    // 'nationality', // retired
    'country',
    'residing_status',
    'family_type',
    'family_status',
    'rashi',
    'working_status',
    'pref_has_children',
] as const;

function sortedUnique(values: readonly string[]): string[] {
    return Array.from(new Set(values)).sort();
}

function childCacheKey(group: string, parentId: number): string {
    return `${group}:${parentId}`;
}

function seedOptionCaches(
    queryClient: ReturnType<typeof useQueryClient>,
    payload: BulkOptionsResponse,
) {
    for (const [group, items] of Object.entries(payload.groups ?? {})) {
        queryClient.setQueryData(['options', group], items);
    }

    for (const [key, items] of Object.entries(payload.children ?? {})) {
        const [group, parentId] = key.split(':');
        if (!group || !parentId) continue;
        queryClient.setQueryData(['options', group, Number(parentId)], items);
    }
}

async function fetchBulkOptions(
    groups: readonly string[],
    children: ReadonlyArray<{ group: string; parentId: number }> = [],
): Promise<BulkOptionsResponse> {
    const params: Record<string, string> = {};

    if (groups.length > 0) {
        params.groups = sortedUnique(groups).join(',');
    }

    if (children.length > 0) {
        params.children = children
            .map(({ group, parentId }) => `${group}:${parentId}`)
            .sort()
            .join(',');
    }

    const { data } = await api.get<BulkOptionsResponse>('/options/bulk', { params });
    return {
        groups: data.groups ?? {},
        children: data.children ?? {},
    };
}

/**
 * Fetch many top-level option groups in a single API call.
 * Also seeds React Query caches so `useOptions` / `useChildOptions` reuse the data.
 */
export function useOptionsBulk(groups: readonly string[]) {
    const queryClient = useQueryClient();
    const sortedGroups = useMemo(() => sortedUnique(groups), [groups]);

    return useQuery<BulkOptionsResponse>({
        queryKey: ['options', 'bulk', ...sortedGroups],
        queryFn: async () => {
            const payload = await fetchBulkOptions(sortedGroups);
            seedOptionCaches(queryClient, payload);
            return payload;
        },
        staleTime: STALE_MS,
        placeholderData: { groups: {}, children: {} },
    });
}

/**
 * Fetch child option lists for multiple parents in one API call.
 * Useful when several parent ids are selected (e.g. preference districts).
 */
export function useChildOptionsBulk(
    group: string,
    parentIds: readonly number[],
) {
    const queryClient = useQueryClient();
    const uniqueParentIds = useMemo(
        () => Array.from(new Set(parentIds)).filter((id) => id > 0).sort((a, b) => a - b),
        [parentIds],
    );

    const children = useMemo(
        () => uniqueParentIds.map((parentId) => ({ group, parentId })),
        [group, uniqueParentIds],
    );

    const query = useQuery<BulkOptionsResponse>({
        queryKey: ['options', 'bulk', 'children', group, ...uniqueParentIds],
        queryFn: async () => {
            const payload = await fetchBulkOptions([], children);
            seedOptionCaches(queryClient, payload);
            return payload;
        },
        enabled: uniqueParentIds.length > 0,
        staleTime: STALE_MS,
        placeholderData: { groups: {}, children: {} },
    });

    const mergedOptions = useMemo(() => {
        const merged = new Map<string, OptionItem>();
        for (const parentId of uniqueParentIds) {
            const key = childCacheKey(group, parentId);
            const items =
                query.data?.children?.[key]
                ?? queryClient.getQueryData<OptionItem[]>(['options', group, parentId])
                ?? [];

            for (const item of items) {
                merged.set(item.value, item);
            }
        }
        return Array.from(merged.values());
    }, [group, query.data, queryClient, uniqueParentIds]);

    return {
        ...query,
        data: mergedOptions,
    };
}

/**
 * Read one group from a bulk options payload with a stable empty fallback.
 */
export function pickOptions(
    payload: BulkOptionsResponse | undefined,
    group: string,
): OptionItem[] {
    return payload?.groups?.[group] ?? EMPTY_OPTIONS;
}

/**
 * Fetch flat / top-level options for a group.
 * Prefer `useOptionsBulk` on pages that need many groups at once.
 */
export function useOptions(group: string) {
    const queryClient = useQueryClient();

    return useQuery<OptionItem[]>({
        queryKey: ['options', group],
        queryFn: () =>
            api.get(`/options/${group}`).then((r) => r.data),
        staleTime: STALE_MS,
        placeholderData: () =>
            queryClient.getQueryData<OptionItem[]>(['options', group]) ?? EMPTY_OPTIONS,
    });
}

/**
 * Fetch child options that depend on a parent row id.
 * Only fires when parentId is truthy.
 */
export function useChildOptions(
    group: string,
    parentId: number | null | undefined,
) {
    const queryClient = useQueryClient();

    return useQuery<OptionItem[]>({
        queryKey: ['options', group, parentId],
        queryFn: () =>
            api
                .get(`/options/${group}`, { params: { parent_id: parentId } })
                .then((r) => r.data),
        enabled: !!parentId,
        staleTime: STALE_MS,
        placeholderData: () =>
            (parentId
                ? queryClient.getQueryData<OptionItem[]>(['options', group, parentId])
                : undefined) ?? EMPTY_OPTIONS,
    });
}
