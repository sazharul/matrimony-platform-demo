'use client';

import { useCallback, useEffect, useState } from 'react';
import ReactSelect, {
    StylesConfig,
    GroupBase,
} from 'react-select';

/** Generic option item — compatible with both static lists and dynamic API results. */
export interface OptionItem {
    value: string;
    label: string;
}

// Backward-compat alias so existing imports keep working
export type SelectOption = OptionItem;

/** Read a CSS variable from :root at runtime so portal-mounted menus get the
 *  actual colour even though they are outside the component tree.
 *
 *  NOTE: In this project the CSS variables store complete hex/color values
 *  (e.g. `--card: #FFFFFF`) so we return the value as-is — no hsl() wrapping. */
function cssVar(name: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
    return val || fallback;
}

const PRIMARY = '#FFCF00';

function buildStyles(
    isMulti = false,
    compact = false,
): StylesConfig<SelectOption, boolean, GroupBase<SelectOption>> {
    // Resolved at call-time so dark/light mode changes are picked up
    const bg        = cssVar('--input',            '#ffffff');
    const border    = cssVar('--border',           '#e2e8f0');
    const fg        = cssVar('--foreground',       '#0f172a');
    const muted     = cssVar('--muted-foreground', '#94a3b8');
    // For the detached portal menu we want a fully opaque surface colour.
    // Prefer --popover (shadcn defines it), fall back to --card, then white.
    const menuBg    = cssVar('--popover',  cssVar('--card', '#ffffff'));

    return {
        control: (base, state) => ({
            ...base,
            backgroundColor: bg,
            borderColor: state.isFocused ? PRIMARY : border,
            borderRadius: '0.5rem',
            // Single: fixed h-8 to match Input; Multi: auto height for tag wrapping
            minHeight: '2rem',
            height: isMulti ? 'auto' : '2rem',
            width: '100%',
            boxShadow: state.isFocused ? `0 0 0 3px ${PRIMARY}50` : 'none',
            cursor: 'pointer',
            '&:hover': { borderColor: PRIMARY },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: isMulti ? '0.25rem 0.625rem' : compact ? '0 0.35rem' : '0 0.625rem',
            flex: '1 1 0',
            minWidth: 0,
            overflow: 'hidden',
            flexWrap: isMulti ? ('wrap' as const) : ('nowrap' as const),
        }),
        input: (base) => ({
            ...base,
            color: fg,
            margin: 0,
            padding: 0,
        }),
        singleValue: (base) => ({
            ...base,
            color: fg,
            fontSize: compact ? '0.75rem' : '0.875rem',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: `${PRIMARY}22`,
            borderRadius: '0.5rem',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: fg,
            fontSize: '0.8rem',
            fontWeight: 500,
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: fg,
            borderRadius: '0 0.5rem 0.5rem 0',
            '&:hover': { backgroundColor: `${PRIMARY}50`, color: fg },
        }),
        placeholder: (base) => ({
            ...base,
            color: muted,
            fontSize: compact ? '0.75rem' : '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }),
        indicatorsContainer: (base) => ({
            ...base,
            flexShrink: 0,
        }),
        dropdownIndicator: (base) => ({
            ...base,
            color: muted,
            padding: compact ? '0 0.15rem' : '0 0.375rem',
            '&:hover': { color: fg },
            svg: { width: compact ? 14 : 20, height: compact ? 14 : 20 },
        }),
        clearIndicator: (base) => ({
            ...base,
            color: muted,
            padding: compact ? '0 0.1rem' : '0 0.25rem',
            '&:hover': { color: fg },
            svg: { width: compact ? 14 : 20, height: compact ? 14 : 20 },
        }),
        indicatorSeparator: () => ({ display: 'none' }),

        /* ── Portal wrapper ─────────────────────────────────── */
        menuPortal: (base) => ({
            ...base,
            zIndex: 99999,
        }),

        /* ── Dropdown container ─────────────────────────────── */
        menu: (base) => ({
            ...base,
            backgroundColor: menuBg,
            opacity: 1,
            border: `1px solid ${border}`,
            borderRadius: '0.75rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            zIndex: 99999,
            isolation: 'isolate',
        }),

        menuList: (base) => ({
            ...base,
            padding: '0.25rem',
            backgroundColor: menuBg,
        }),

        /* ── Individual options ─────────────────────────────── */
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? PRIMARY
                : state.isFocused
                    ? `${PRIMARY}18`
                    : menuBg,
            color: state.isSelected ? '#ffffff' : fg,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            padding: '0.5rem 0.75rem',
            '&:active': { backgroundColor: `${PRIMARY}35` },
        }),

        noOptionsMessage: (base) => ({
            ...base,
            color: muted,
            fontSize: '0.875rem',
            backgroundColor: menuBg,
        }),
    };
}

/** Keep dropdown menus fully visible on small screens by capping height to viewport space. */
function useMenuMaxHeight() {
    const [maxMenuHeight, setMaxMenuHeight] = useState(240);

    useEffect(() => {
        const update = () => {
            const viewportPadding = 96;
            setMaxMenuHeight(Math.max(120, window.innerHeight - viewportPadding));
        };

        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', update, true);

        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', update, true);
        };
    }, []);

    return maxMenuHeight;
}

const sharedSelectProps = {
    classNamePrefix: 'rs' as const,
    menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
    menuPosition: 'fixed' as const,
    menuPlacement: 'auto' as const,
    menuShouldScrollIntoView: true,
    menuShouldBlockScroll: true,
};

// ─── Single-value Searchable Select ──────────────────────────────────────────

interface SearchableSelectProps {
    options: SelectOption[];
    value: string | null | undefined;
    onChange: (value: string | null) => void;
    placeholder?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    id?: string;
    className?: string;
    /** Tighter layout for min/max pairs in narrow sidebars */
    compact?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select…',
    isClearable = true,
    isDisabled = false,
    id,
    className,
    compact = false,
}: SearchableSelectProps) {
    const [mounted, setMounted] = useState(false);
    const selected = value ? (options.find(o => o.value === value) ?? null) : null;
    const maxMenuHeight = useMenuMaxHeight();

    useEffect(() => setMounted(true), []);

    const handleMenuOpen = useCallback(() => {
        requestAnimationFrame(() => {
            document.querySelector('.rs__menu')?.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
        });
    }, []);

    if (!mounted) {
        return (
            <div
                className={`h-8 rounded-lg border border-[var(--border)] bg-[var(--input)] ${className ?? 'w-full min-w-0'}`}
                aria-hidden
            />
        );
    }

    return (
        <div className={className ?? 'w-full min-w-0'}>
            <ReactSelect<SelectOption>
            instanceId={id}
            options={options}
            value={selected}
            onChange={(opt) => onChange(opt ? opt.value : null)}
            placeholder={placeholder}
            isClearable={isClearable}
            isDisabled={isDisabled}
            styles={buildStyles(false, compact)}
            maxMenuHeight={maxMenuHeight}
            onMenuOpen={handleMenuOpen}
            {...sharedSelectProps}
        />
        </div>
    );
}

// ─── Multi-value Searchable Select ────────────────────────────────────────────

interface MultiSelectProps {
    options: SelectOption[];
    value: string[] | null | undefined;
    onChange: (values: string[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    id?: string;
}

export function MultiSearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select one or more…',
    isDisabled = false,
    id,
}: MultiSelectProps) {
    const [mounted, setMounted] = useState(false);
    const selected = (value ?? [])
        .map(v => options.find(o => o.value === v) ?? { value: v, label: v });
    const maxMenuHeight = useMenuMaxHeight();

    useEffect(() => setMounted(true), []);

    const handleMenuOpen = useCallback(() => {
        requestAnimationFrame(() => {
            document.querySelector('.rs__menu')?.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
        });
    }, []);

    if (!mounted) {
        return (
            <div
                className="min-h-8 rounded-lg border border-[var(--border)] bg-[var(--input)]"
                aria-hidden
            />
        );
    }

    return (
        <ReactSelect<SelectOption, true>
            instanceId={id}
            isMulti
            options={options}
            value={selected}
            onChange={(opts) => onChange(opts ? opts.map(o => o.value) : [])}
            placeholder={placeholder}
            isDisabled={isDisabled}
            styles={buildStyles(true) as StylesConfig<SelectOption, true, GroupBase<SelectOption>>}
            maxMenuHeight={maxMenuHeight}
            onMenuOpen={handleMenuOpen}
            closeMenuOnSelect={false}
            {...sharedSelectProps}
        />
    );
}
