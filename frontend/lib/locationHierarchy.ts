import type { OptionItem } from '@/hooks/useSelectOptions';

export type LocationHierarchyType =
    | 'division_district_upazila'
    | 'state_city'
    | 'flat_region_city'
    | 'region_city';

export type ProfileLocationField = 'city' | 'state' | 'upazila';

export type LocationMetadata = {
    hierarchy_type?: LocationHierarchyType;
    max_levels?: number;
    level_2_label?: string;
    level_3_label?: string;
    level_4_label?: string;
    field_map?: Record<string, string>;
};

export type LocationFieldValues = {
    city?: string;
    state?: string;
    upazila?: string;
};

export function getLocationMetadata(option?: OptionItem): LocationMetadata {
    return (option?.metadata ?? {}) as LocationMetadata;
}

export function getHierarchyType(option?: OptionItem): LocationHierarchyType | undefined {
    return getLocationMetadata(option).hierarchy_type;
}

export function getMaxLocationLevels(option?: OptionItem): number {
    const metadata = getLocationMetadata(option);
    if (typeof metadata.max_levels === 'number' && metadata.max_levels > 0) {
        return metadata.max_levels;
    }

    return getHierarchyType(option) === 'division_district_upazila' ? 4 : 3;
}

export function getLevelLabel(metadata: LocationMetadata, level: 2 | 3 | 4, fallback: string): string {
    if (level === 2) return metadata.level_2_label ?? fallback;
    if (level === 3) return metadata.level_3_label ?? fallback;
    return metadata.level_4_label ?? fallback;
}

export function hasConfiguredLevel(metadata: LocationMetadata, level: 2 | 3 | 4): boolean {
    return !!metadata.field_map?.[`level_${level}`];
}

export function levelFormField(
    option: OptionItem | undefined,
    level: 2 | 3 | 4,
): ProfileLocationField | null {
    const field = getLocationMetadata(option).field_map?.[`level_${level}`];

    if (field === 'city' || field === 'state' || field === 'upazila') {
        return field;
    }

    return null;
}

export function usesDivisionDistrictUpazila(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'division_district_upazila';
}

export function usesRegionCity(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'region_city';
}

export function usesFlatRegionCity(option?: OptionItem): boolean {
    return getHierarchyType(option) === 'flat_region_city';
}

export function usesStateCity(option?: OptionItem): boolean {
    const type = getHierarchyType(option);
    return type === 'state_city' || type === 'flat_region_city';
}

/** Which form field stores level-2 selection. */
export function level2Field(option?: OptionItem): ProfileLocationField | null {
    return levelFormField(option, 2);
}

/** Which form field stores level-3 selection. */
export function level3Field(option?: OptionItem): ProfileLocationField | null {
    return levelFormField(option, 3);
}

/** Which form field stores level-4 selection (Bangladesh upazila). */
export function level4Field(option?: OptionItem): ProfileLocationField | null {
    return levelFormField(option, 4);
}

/** Read the stored value for a configured level from profile/filter values. */
export function levelValue(
    metadata: LocationMetadata,
    level: 2 | 3 | 4,
    values: LocationFieldValues,
): string | undefined {
    const field = metadata.field_map?.[`level_${level}`] as ProfileLocationField | undefined;
    if (!field) return undefined;

    return values[field];
}

/** Read the watched value that drives child options for the next level down. */
export function levelValueForChildren(
    option: OptionItem | undefined,
    parentLevel: 2 | 3,
    values: LocationFieldValues,
): string | undefined {
    return levelValue(getLocationMetadata(option), parentLevel, values);
}

/** @deprecated Use levelValueForChildren(option, 2, values) */
export function level2ValueForChildren(
    option: OptionItem | undefined,
    city: string | undefined,
    state: string | undefined,
): string | undefined {
    return levelValueForChildren(option, 2, { city, state });
}

/** @deprecated Use levelValueForChildren(option, 3, values) */
export function level3ValueForChildren(
    option: OptionItem | undefined,
    state: string | undefined,
    city?: string | undefined,
    upazila?: string | undefined,
): string | undefined {
    return levelValueForChildren(option, 3, { city, state, upazila });
}

export function clearLocationFields(
    setValue: (name: ProfileLocationField, value: string) => void,
): void {
    setValue('city', '');
    setValue('state', '');
    setValue('upazila', '');
}

/** Clear profile fields for levels deeper than the one being changed. */
export function clearDeeperLocationFields(
    metadata: LocationMetadata,
    fromLevel: 2 | 3,
    setValue: (name: ProfileLocationField, value: string) => void,
): void {
    const levels: Array<2 | 3 | 4> = fromLevel === 2 ? [3, 4] : [4];

    for (const level of levels) {
        const field = metadata.field_map?.[`level_${level}`] as ProfileLocationField | undefined;
        if (field) {
            setValue(field, '');
        }
    }
}
