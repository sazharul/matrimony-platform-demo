import type { OptionItem } from '@/hooks/useSelectOptions';
import { getLevelLabel, getLocationMetadata } from '@/lib/locationHierarchy';

export type LocationDisplayRow = {
    label: string;
    value: string;
};

type ProfileLocation = {
    country?: string | null;
    city?: string | null;
    state?: string | null;
    upazila?: string | null;
};

const LEVELS = [
    { key: 'level_2' as const, level: 2 as const, fallback: 'Region' },
    { key: 'level_3' as const, level: 3 as const, fallback: 'City' },
    { key: 'level_4' as const, level: 4 as const, fallback: 'Area' },
];

function configuredLevels(metadata: ReturnType<typeof getLocationMetadata>): typeof LEVELS {
    const maxLevels = metadata.max_levels ?? (metadata.hierarchy_type === 'division_district_upazila' ? 4 : 3);
    return LEVELS.slice(0, Math.max(0, maxLevels - 1));
}

/** Build metadata-aware location rows for profile display. */
export function buildProfileLocationRows(
    profile: ProfileLocation | null | undefined,
    countryOptions: OptionItem[] | undefined,
    childrenByParentId: Record<number, OptionItem[]>,
): LocationDisplayRow[] {
    if (!profile?.country) return [];

    const countryOption = countryOptions?.find((option) => option.value === profile.country);
    if (!countryOption) {
        return [{ label: 'Country', value: profile.country }];
    }

    const rows: LocationDisplayRow[] = [{ label: 'Country', value: countryOption.label }];
    const metadata = getLocationMetadata(countryOption);
    const fieldMap = metadata.field_map ?? {};
    let parentId = countryOption.id;

    for (const { key, level, fallback } of configuredLevels(metadata)) {
        const profileField = fieldMap[key];
        if (!profileField || !parentId) continue;

        const storedValue = profile[profileField as keyof ProfileLocation];
        if (!storedValue || typeof storedValue !== 'string') continue;

        const siblings = childrenByParentId[parentId] ?? [];
        const option = siblings.find((item) => item.value === storedValue);

        rows.push({
            label: getLevelLabel(metadata, level, fallback),
            value: option?.label ?? storedValue.replace(/_/g, ' '),
        });

        if (!option?.id) break;

        parentId = option.id;
    }

    return rows;
}
