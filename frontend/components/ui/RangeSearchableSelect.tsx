'use client';

import { SearchableSelect, type SelectOption } from '@/components/ui/SearchableSelect';

interface RangeSearchableSelectProps {
    idPrefix: string;
    options: SelectOption[];
    minValue?: string | null;
    maxValue?: string | null;
    onMinChange: (value: string | null) => void;
    onMaxChange: (value: string | null) => void;
    minPlaceholder?: string;
    maxPlaceholder?: string;
}

/**
 * Min/max pair — stacked rows so each select gets full width.
 * Side-by-side columns were too narrow: clear + arrow icons hid the selected label.
 */
export function RangeSearchableSelect({
    idPrefix,
    options,
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
    minPlaceholder = 'Select min…',
    maxPlaceholder = 'Select max…',
}: RangeSearchableSelectProps) {
    return (
        <div className="filter-range-row space-y-1.5">
            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Min
                </span>
                <SearchableSelect
                    id={`${idPrefix}-min`}
                    options={options}
                    value={minValue}
                    onChange={onMinChange}
                    placeholder={minPlaceholder}
                    compact
                />
            </div>
            <div className="grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Max
                </span>
                <SearchableSelect
                    id={`${idPrefix}-max`}
                    options={options}
                    value={maxValue}
                    onChange={onMaxChange}
                    placeholder={maxPlaceholder}
                    compact
                />
            </div>
        </div>
    );
}
