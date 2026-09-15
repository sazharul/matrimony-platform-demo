import type { OptionItem } from '@/hooks/useSelectOptions';

/** Resolve a single option value to its display label. */
export function optionLabel(
    options: OptionItem[] | undefined,
    value?: string | null,
): string | null {
    if (!value) return null;

    const match = options?.find((option) => option.value === value);
    if (match?.label) return match.label;

    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Resolve multiple option values to a comma-separated label string. */
export function optionLabels(
    options: OptionItem[] | undefined,
    values?: string[] | string | null,
): string | null {
    if (!values) return null;

    const list = Array.isArray(values) ? values : [values];
    if (list.length === 0) return null;

    return list
        .map((value) => optionLabel(options, value))
        .filter((label): label is string => Boolean(label))
        .join(', ');
}

/** Find an option anywhere in a country tree (top-level + loaded children). */
export function countryOptionLabel(
    countryOptions: OptionItem[] | undefined,
    childrenByParentId: Record<number, OptionItem[]>,
    value?: string | null,
): string | null {
    if (!value) return null;

    const topLevel = countryOptions?.find((option) => option.value === value);
    if (topLevel?.label) return topLevel.label;

    for (const children of Object.values(childrenByParentId)) {
        const match = children.find((option) => option.value === value);
        if (match?.label) return match.label;
    }

    return optionLabel(countryOptions, value);
}
