import { useMemo } from 'react';
import { useChildOptions, useOptions } from '@/hooks/useSelectOptions';
import {
    buildProfileLocationRows,
    type LocationDisplayRow,
} from '@/lib/profileLocationDisplay';
import {
    getLocationMetadata,
    level2Field,
    level3Field,
} from '@/lib/locationHierarchy';

type ProfileLocation = {
    country?: string | null;
    city?: string | null;
    state?: string | null;
    upazila?: string | null;
};

/** Load country children and build metadata-aware location rows for profile view. */
export function useProfileLocationDisplay(
    profile?: ProfileLocation | null,
): LocationDisplayRow[] {
    const { data: countryOptions = [] } = useOptions('country');

    const countryOption = useMemo(
        () => countryOptions.find((option) => option.value === profile?.country),
        [countryOptions, profile?.country],
    );

    const { data: level2Options = [] } = useChildOptions('country', countryOption?.id);

    const level2Value = useMemo(() => {
        if (!profile || !countryOption) return undefined;
        const field = level2Field(countryOption);
        return field ? profile[field] ?? undefined : undefined;
    }, [countryOption, profile]);

    const level2Option = useMemo(
        () => level2Options.find((option) => option.value === level2Value),
        [level2Options, level2Value],
    );

    const { data: level3Options = [] } = useChildOptions('country', level2Option?.id);

    const level3Value = useMemo(() => {
        if (!profile || !countryOption) return undefined;
        const field = level3Field(countryOption);
        if (!field) return undefined;
        return profile[field] ?? undefined;
    }, [countryOption, profile]);

    const level3Option = useMemo(
        () => level3Options.find((option) => option.value === level3Value),
        [level3Options, level3Value],
    );

    const { data: level4Options = [] } = useChildOptions('country', level3Option?.id);

    return useMemo(() => {
        if (!profile?.country || !countryOption) {
            return buildProfileLocationRows(profile, countryOptions, {});
        }

        const childrenByParentId: Record<number, typeof level2Options> = {
            [countryOption.id]: level2Options,
        };

        if (level2Option?.id) {
            childrenByParentId[level2Option.id] = level3Options;
        }

        if (level3Option?.id) {
            childrenByParentId[level3Option.id] = level4Options;
        }

        return buildProfileLocationRows(profile, countryOptions, childrenByParentId);
    }, [
        countryOption,
        countryOptions,
        level2Option?.id,
        level2Options,
        level3Option?.id,
        level3Options,
        level4Options,
        profile,
    ]);
}

/** Short location line for hero/cards (e.g. "Rangpur, Bangladesh"). */
export function formatProfileLocationLine(
    rows: LocationDisplayRow[],
): string | null {
    if (rows.length === 0) return null;

    const country = rows.find((row) => row.label === 'Country')?.value;
    const locality = rows.length > 1 ? rows[rows.length - 1]?.value : null;

    if (locality && country) return `${locality}, ${country}`;
    return country ?? locality ?? null;
}
