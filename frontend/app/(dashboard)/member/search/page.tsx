'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { matchService } from '@/services/profileService';
import { MatchCard } from '@/components/match/MatchCard';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeMetaPage } from '@/lib/pagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RangeSearchableSelect } from '@/components/ui/RangeSearchableSelect';
import type { SearchFilters } from '@/types/match';
import {
    useOptionsBulk,
    useChildOptions,
    pickOptions,
    SEARCH_FILTER_OPTION_GROUPS,
} from '@/hooks/useSelectOptions';
import {
    getLevelLabel,
    getLocationMetadata,
    level2Field,
    level2ValueForChildren,
    level3Field,
    level3ValueForChildren,
    level4Field,
} from '@/lib/locationHierarchy';
import { ageOptions, heightOptions } from '@/lib/profileOptions';
import { useAuthStore } from '@/store/authStore';
import { SearchIcon, FilterIcon, XIcon } from '@/components/ui/icons';
import { applyHeightFiltersForApi, cn, formatSearchFilterValue, resolveHeightOptionValue } from '@/lib/utils';
import {
    Users,
    Heart,
    MapPin,
    Briefcase,
    Sparkles,
    Leaf,
    Hash,
    type LucideIcon,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { value: 'latest',     label: 'Newest Members' },
    { value: 'age_asc',    label: 'Age: Youngest First' },
    { value: 'age_desc',   label: 'Age: Oldest First' },
    { value: 'completion', label: 'Profile Completeness' },
];

const DEFAULT_FILTERS: SearchFilters = {};

function countActiveFilters(f: SearchFilters): number {
    const skip = new Set(['page', 'sort', 'query', 'profile_id']);
    return Object.entries(f).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== '' && v !== null).length;
}

function toOpts(items: { value: string; label: string }[]) { return items; }

function numToStr(v?: number) { return v != null ? String(v) : undefined; }

function FilterSection({
    title,
    icon: Icon,
    defaultOpen = false,
    children,
}: {
    title: string;
    icon: LucideIcon;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div
            className={cn(
                'rounded-xl border transition-all duration-200',
                open
                    ? 'border-[#FFCF00]/55 bg-gradient-to-b from-[#FFCF00]/10 via-[#FFCF00]/5 to-white shadow-sm'
                    : 'border-[#E8DFCC] bg-white hover:border-[#FFCF00]/35 hover:shadow-sm',
            )}
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
            >
                <span
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        open ? 'bg-[#FFCF00] text-[#1A1208] shadow-sm' : 'bg-[#FFCF00]/12 text-[#1A1208]',
                    )}
                >
                    <Icon size={15} strokeWidth={2.2} />
                </span>
                <span className="flex-1 text-xs font-bold text-[#1A1208]">{title}</span>
                <svg
                    className={cn('h-4 w-4 shrink-0 text-subtle transition-transform duration-200', open && 'rotate-180')}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>
            {open && (
                <div className="space-y-2 border-t border-[#FFCF00]/15 px-3 pb-3 pt-2.5">
                    {children}
                </div>
            )}
        </div>
    );
}

function FilterActions({
    onApply,
    onClear,
    className,
    layout = 'vertical',
}: {
    onApply: () => void;
    onClear: () => void;
    className?: string;
    layout?: 'vertical' | 'horizontal';
}) {
    if (layout === 'horizontal') {
        return (
            <div className={cn('flex gap-2', className)}>
                <button
                    type="button"
                    onClick={onApply}
                    className="btn-gold flex-1 font-bold"
                    style={{ height: '2.25rem', borderRadius: '0.625rem', fontSize: '0.8125rem' }}
                >
                    Apply
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="flex-1 rounded-lg border border-[#E8DFCC] bg-white text-xs font-semibold text-meta transition-colors hover:border-[#FFCF00]/50 hover:bg-[#FFCF00]/8"
                    style={{ height: '2.25rem' }}
                >
                    Reset
                </button>
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <button
                type="button"
                onClick={onApply}
                className="btn-gold w-full font-bold"
                style={{ height: '2.5rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}
            >
                Apply Filters
            </button>
            <button
                type="button"
                onClick={onClear}
                className="w-full rounded-xl border border-[#E8DFCC] bg-white py-2 text-xs font-semibold text-meta transition-colors hover:border-[#FFCF00]/50 hover:bg-[#FFCF00]/8 hover:text-[#1A1208]"
            >
                Reset All
            </button>
        </div>
    );
}

function FilterSidebarToolbar({
    activeCount,
    onApply,
    onClear,
    onClose,
    showClose = false,
}: {
    activeCount: number;
    onApply: () => void;
    onClear: () => void;
    onClose?: () => void;
    showClose?: boolean;
}) {
    return (
        <div className="flex-shrink-0 border-b border-[#FFCF00]/20 px-3 py-2.5">
            <div className="flex items-center gap-2">
                {showClose && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-subtle transition-colors hover:bg-[#FFCF00]/15 hover:text-[#1A1208]"
                        aria-label="Close filters"
                    >
                        <XIcon size={18} strokeWidth={2} />
                    </button>
                )}
                <FilterActions onApply={onApply} onClear={onClear} layout="horizontal" className="flex-1" />
                {activeCount > 0 && (
                    <span className="shrink-0 rounded-full bg-[#FFCF00] px-2 py-0.5 text-[10px] font-bold text-[#1A1208]">
                        {activeCount}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── FilterPanel ───────────────────────────────────────────────────────────────

interface FilterPanelProps {
    filters: SearchFilters;
    onUpdate: <K extends keyof SearchFilters>(key: K, val: SearchFilters[K]) => void;
}

function FilterPanel({ filters, onUpdate }: FilterPanelProps) {
    const { data: bulkOptions } = useOptionsBulk(SEARCH_FILTER_OPTION_GROUPS);

    const religionOpts = pickOptions(bulkOptions, 'religion');
    const maritalOpts = pickOptions(bulkOptions, 'marital_status');
    const educationOpts = pickOptions(bulkOptions, 'education_level');
    const professionOpts = pickOptions(bulkOptions, 'profession');
    const employedInOpts = pickOptions(bulkOptions, 'employed_in');
    const dietOpts = pickOptions(bulkOptions, 'diet');
    const smokingOpts = pickOptions(bulkOptions, 'smoking');
    const drinkingOpts = pickOptions(bulkOptions, 'drinking');
    const bodyTypeOpts = pickOptions(bulkOptions, 'body_type');
    const complexionOpts = pickOptions(bulkOptions, 'complexion');
    const bloodGroupOpts = pickOptions(bulkOptions, 'blood_group');
    const motherTongueOpts = pickOptions(bulkOptions, 'mother_tongue');
    // const nationalityOpts = pickOptions(bulkOptions, 'nationality'); // retired
    const countryOpts = pickOptions(bulkOptions, 'country');
    const residingStatusOpts = pickOptions(bulkOptions, 'residing_status');
    const haveChildrenOpts = pickOptions(bulkOptions, 'have_children');

    const selectedReligionId = religionOpts.find(o => o.value === filters.religion)?.id;
    const { data: casteOpts = [] } = useChildOptions('caste', selectedReligionId);

    const selectedCountryOption = countryOpts.find(o => o.value === filters.country);
    const selectedCountryId = selectedCountryOption?.id;
    const locationMeta = getLocationMetadata(selectedCountryOption);
    const { data: stateOpts = [] } = useChildOptions('country', selectedCountryId);

    const level2SelectionValue = level2ValueForChildren(selectedCountryOption, filters.city, filters.state);
    const selectedLevel2Id = stateOpts.find(o => o.value === level2SelectionValue)?.id;
    const { data: locationLevel3Opts = [] } = useChildOptions('country', selectedLevel2Id);

    const level3SelectionValue = level3ValueForChildren(
        selectedCountryOption,
        filters.state,
        filters.city,
        filters.upazila,
    );
    const selectedLevel3Id = locationLevel3Opts.find(o => o.value === level3SelectionValue)?.id;
    const { data: locationLevel4Opts = [] } = useChildOptions('country', selectedLevel3Id);

    const level2Label = getLevelLabel(locationMeta, 2, 'State / Division');
    const level3Label = getLevelLabel(locationMeta, 3, 'District / City');
    const level4Label = getLevelLabel(locationMeta, 4, 'Upazila / Thana');
    const level2FormField = level2Field(selectedCountryOption);
    const level3FormField = level3Field(selectedCountryOption);
    const level4FormField = level4Field(selectedCountryOption);
    const level2FilterValue = level2FormField ? filters[level2FormField] : undefined;
    const level3FilterValue = level3FormField ? filters[level3FormField] : undefined;
    const level4FilterValue = level4FormField ? filters[level4FormField] : undefined;
    const heightMinValue = filters.height_min != null ? resolveHeightOptionValue(filters.height_min) : undefined;
    const heightMaxValue = filters.height_max != null ? resolveHeightOptionValue(filters.height_max) : undefined;

    return (
        <div className="space-y-2">
            <FilterSection title="Essentials" icon={Users} defaultOpen>
                <p className="text-xs font-bold uppercase tracking-wider text-meta">Gender</p>
                <div className="flex gap-2">
                    {(['male', 'female'] as const).map(g => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => onUpdate('gender', filters.gender === g ? undefined : g)}
                            className={cn(
                                'flex-1 rounded-xl border-2 py-2 text-xs font-bold capitalize transition-all duration-200',
                                filters.gender === g
                                    ? 'border-[#FFCF00] bg-[#FFCF00] text-[#1A1208] shadow-sm'
                                    : 'border-[#E8DFCC] bg-white text-meta hover:border-[#FFCF00]/45 hover:bg-[#FFCF00]/8',
                            )}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-meta pt-0.5">Age</p>
                <RangeSearchableSelect
                    idPrefix="sr-age"
                    options={ageOptions}
                    minValue={numToStr(filters.age_min)}
                    maxValue={numToStr(filters.age_max)}
                    onMinChange={v => onUpdate('age_min', v ? Number(v) : undefined)}
                    onMaxChange={v => onUpdate('age_max', v ? Number(v) : undefined)}
                    minPlaceholder="Min…"
                    maxPlaceholder="Max…"
                />
                <p className="text-xs font-bold uppercase tracking-wider text-meta pt-0.5">Height (ft &amp; in)</p>
                <RangeSearchableSelect
                    idPrefix="sr-ht"
                    options={heightOptions}
                    minValue={heightMinValue}
                    maxValue={heightMaxValue}
                    onMinChange={v => onUpdate('height_min', v ? Number(v) : undefined)}
                    onMaxChange={v => onUpdate('height_max', v ? Number(v) : undefined)}
                    minPlaceholder="Min…"
                    maxPlaceholder="Max…"
                />
            </FilterSection>

            <FilterSection title="Location" icon={MapPin} defaultOpen>
                <div className="space-y-1.5">
                    <SearchableSelect id="sr-cnt" options={toOpts(countryOpts)} value={filters.country}
                        onChange={v => { onUpdate('country', v ?? undefined); onUpdate('state', undefined); onUpdate('city', undefined); onUpdate('upazila', undefined); }}
                        placeholder="Country…" />
                    {stateOpts.length > 0 && level2FormField && (
                        <SearchableSelect
                            id="sr-l2"
                            options={toOpts(stateOpts)}
                            value={level2FilterValue}
                            onChange={v => {
                                if (!level2FormField) return;
                                onUpdate(level2FormField, v ?? undefined);
                                if (level3FormField) onUpdate(level3FormField, undefined);
                                if (level4FormField) onUpdate(level4FormField, undefined);
                            }}
                            placeholder={`${level2Label}…`}
                        />
                    )}
                    {locationLevel3Opts.length > 0 && level3FormField && (
                        <SearchableSelect
                            id="sr-l3"
                            options={toOpts(locationLevel3Opts)}
                            value={level3FilterValue}
                            onChange={v => {
                                if (!level3FormField) return;
                                onUpdate(level3FormField, v ?? undefined);
                                if (level4FormField) onUpdate(level4FormField, undefined);
                            }}
                            placeholder={`${level3Label}…`}
                        />
                    )}
                    {locationLevel4Opts.length > 0 && level4FormField && (
                        <SearchableSelect
                            id="sr-l4"
                            options={toOpts(locationLevel4Opts)}
                            value={level4FilterValue}
                            onChange={v => level4FormField && onUpdate(level4FormField, v ?? undefined)}
                            placeholder={`${level4Label}…`}
                        />
                    )}
                    {/* Nationality filter retired
                    <SearchableSelect id="sr-nat" options={toOpts(nationalityOpts)} value={filters.nationality}
                        onChange={v => onUpdate('nationality', v ?? undefined)} placeholder="Nationality…" />
                    */}
                    <SearchableSelect id="sr-rs" options={toOpts(residingStatusOpts)} value={filters.residing_status}
                        onChange={v => onUpdate('residing_status', v ?? undefined)} placeholder="Residing status…" />
                </div>
            </FilterSection>

            <FilterSection title="Faith & Family" icon={Heart}>
                <div className="space-y-1.5">
                    <SearchableSelect id="sr-rel" options={toOpts(religionOpts)} value={filters.religion}
                        onChange={v => { onUpdate('religion', v ?? undefined); onUpdate('caste', undefined); }}
                        placeholder="Religion…" />
                    {casteOpts.length > 0 && (
                        <SearchableSelect id="sr-cst" options={toOpts(casteOpts)} value={filters.caste}
                            onChange={v => onUpdate('caste', v ?? undefined)}
                            placeholder="Caste…" />
                    )}
                    <SearchableSelect id="sr-ms" options={toOpts(maritalOpts)} value={filters.marital_status}
                        onChange={v => onUpdate('marital_status', v ?? undefined)} placeholder="Marital status…" />
                    <SearchableSelect id="sr-hc" options={toOpts(haveChildrenOpts)} value={filters.has_children}
                        onChange={v => onUpdate('has_children', v ?? undefined)} placeholder="Has children…" />
                </div>
            </FilterSection>

            <FilterSection title="Education & Career" icon={Briefcase}>
                <div className="space-y-1.5">
                    <SearchableSelect id="sr-edu" options={toOpts(educationOpts)} value={filters.education}
                        onChange={v => onUpdate('education', v ?? undefined)} placeholder="Education…" />
                    <SearchableSelect id="sr-prf" options={toOpts(professionOpts)} value={filters.profession}
                        onChange={v => onUpdate('profession', v ?? undefined)} placeholder="Profession…" />
                    <SearchableSelect id="sr-emp" options={toOpts(employedInOpts)} value={filters.employed_in}
                        onChange={v => onUpdate('employed_in', v ?? undefined)} placeholder="Employed in…" />
                    <div>
                        <Label className="text-xs font-semibold text-meta block mb-1">Income (BDT)</Label>
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={filters.income_min ?? ''}
                                onChange={e => onUpdate('income_min', e.target.value ? Number(e.target.value) : undefined)}
                                className="h-9 flex-1 rounded-lg text-xs"
                            />
                            <span className="text-muted-foreground text-xs">–</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={filters.income_max ?? ''}
                                onChange={e => onUpdate('income_max', e.target.value ? Number(e.target.value) : undefined)}
                                className="h-9 flex-1 rounded-lg text-xs"
                            />
                        </div>
                    </div>
                </div>
            </FilterSection>

            <FilterSection title="Appearance" icon={Sparkles}>
                <div className="space-y-1.5">
                    <SearchableSelect id="sr-bt" options={toOpts(bodyTypeOpts)} value={filters.body_type}
                        onChange={v => onUpdate('body_type', v ?? undefined)} placeholder="Body type…" />
                    <SearchableSelect id="sr-cx" options={toOpts(complexionOpts)} value={filters.complexion}
                        onChange={v => onUpdate('complexion', v ?? undefined)} placeholder="Complexion…" />
                    <SearchableSelect id="sr-bg" options={toOpts(bloodGroupOpts)} value={filters.blood_group}
                        onChange={v => onUpdate('blood_group', v ?? undefined)} placeholder="Blood group…" />
                    <SearchableSelect id="sr-mt" options={toOpts(motherTongueOpts)} value={filters.mother_tongue}
                        onChange={v => onUpdate('mother_tongue', v ?? undefined)} placeholder="Mother tongue…" />
                </div>
            </FilterSection>

            <FilterSection title="Lifestyle" icon={Leaf}>
                <div className="space-y-1.5">
                    <SearchableSelect id="sr-diet" options={toOpts(dietOpts)} value={filters.diet}
                        onChange={v => onUpdate('diet', v ?? undefined)} placeholder="Diet…" />
                    <SearchableSelect id="sr-smk" options={toOpts(smokingOpts)} value={filters.smoking}
                        onChange={v => onUpdate('smoking', v ?? undefined)} placeholder="Smoking…" />
                    <SearchableSelect id="sr-drk" options={toOpts(drinkingOpts)} value={filters.drinking}
                        onChange={v => onUpdate('drinking', v ?? undefined)} placeholder="Drinking…" />
                </div>
            </FilterSection>

            <FilterSection title="Profile ID" icon={Hash}>
                <Input placeholder="e.g. MCT-001234" value={filters.profile_id ?? ''}
                    onChange={e => onUpdate('profile_id', e.target.value || undefined)}
                    className="h-9 rounded-xl border-[#E8DFCC] bg-white text-sm font-mono focus-visible:border-[#FFCF00] focus-visible:ring-[#FFCF00]/25" />
            </FilterSection>
        </div>
    );
}

// ── Active filter badges ──────────────────────────────────────────────────────

const FILTER_LABELS: Partial<Record<keyof SearchFilters, string>> = {
    gender: 'Gender', age_min: 'Age ≥', age_max: 'Age ≤',
    height_min: 'Height ≥', height_max: 'Height ≤',
    religion: 'Religion', caste: 'Caste', marital_status: 'Marital',
    has_children: 'Children', body_type: 'Body', complexion: 'Complexion',
    blood_group: 'Blood', mother_tongue: 'Language',
    education: 'Education', profession: 'Profession', employed_in: 'Employed',
    income_min: 'Income ≥', income_max: 'Income ≤',
    country: 'Country', state: 'State', city: 'City', upazila: 'Upazila',
    residing_status: 'Residing',
    diet: 'Diet', smoking: 'Smoking', drinking: 'Drinking',
    profile_id: 'Profile ID',
};

function ActiveBadges({ filters, onRemove }: { filters: SearchFilters; onRemove: (key: keyof SearchFilters) => void }) {
    const skip = new Set<string>(['page', 'sort', 'query']);
    const entries = Object.entries(filters).filter(
        ([k, v]) => !skip.has(k) && v !== undefined && v !== ''
    ) as [keyof SearchFilters, unknown][];
    if (entries.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mb-4">
            {entries.map(([key, val]) => (
                <span key={key}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[var(--primary)]/40 bg-[var(--accent)] text-[#1A1208] font-medium">
                    {FILTER_LABELS[key] ?? String(key)}: <span className="font-semibold">{formatSearchFilterValue(key, val)}</span>
                    <button onClick={() => onRemove(key)} className="ml-0.5 hover:text-red-400 transition-colors">
                        <XIcon size={10} strokeWidth={3} />
                    </button>
                </span>
            ))}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SearchPage() {
    const authUser = useAuthStore(s => s.user);
    const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalQuery, setGlobalQuery] = useState('');
    const [errorType, setErrorType] = useState<'permission' | 'search' | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initGenderRef = useRef(false);

    const handleGlobalSearch = useCallback((val: string) => {
        setGlobalQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedFilters(prev => ({ ...prev, query: val || undefined }));
        }, 420);
    }, []);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    // First load should default to opposite gender results for the authenticated user.
    useEffect(() => {
        if (initGenderRef.current || !authUser?.gender) return;
        const opposite = authUser.gender === 'male' ? 'female' : 'male';
        setFilters(prev => ({ ...prev, gender: prev.gender ?? opposite }));
        setAppliedFilters(prev => ({ ...prev, gender: prev.gender ?? opposite }));
        initGenderRef.current = true;
    }, [authUser?.gender]);

    const {
        items: results,
        total,
        isLoading,
        isError,
        error,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList({
        queryKey: ['search', appliedFilters],
        queryFn: (page) =>
            matchService.search(applyHeightFiltersForApi({ ...appliedFilters, page })).then((r) => normalizeMetaPage(r.data.data, page)),
        retry: false,
    });

    // Determine error type based on response status
    useEffect(() => {
        if (isError) {
            const errorResponse = error as any;
            const status = errorResponse?.response?.status;
            setErrorType(status === 403 ? 'permission' : 'search');
        } else {
            setErrorType(null);
        }
    }, [isError, error]);

    const updateFilter = useCallback(<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const removeFilter = useCallback((key: keyof SearchFilters) => {
        setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
        setAppliedFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
    }, []);

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters, query: globalQuery || undefined });
        setSidebarOpen(false);
    };

    const handleClearFilters = () => {
        setFilters(DEFAULT_FILTERS);
        setAppliedFilters({ query: globalQuery || undefined });
    };

    const handleSortChange = (sort: string) => {
        setAppliedFilters(prev => ({ ...prev, sort: sort as SearchFilters['sort'] }));
    };

    const activeCount = countActiveFilters(appliedFilters);

    return (
        <div className="max-w-7xl mx-auto pb-20 md:pb-8">
            <div className="mb-5 animate-fade-in-up">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h1 className="page-title">Search Profiles</h1>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                            {total > 0 ? `${total.toLocaleString()} profiles found` : 'Find your perfect match'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="btn-gold md:hidden flex items-center gap-1.5 relative"
                        style={{ height: '2.5rem', borderRadius: '0.75rem', padding: '0 1rem', fontSize: '0.875rem' }}
                    >
                        <FilterIcon size={14} strokeWidth={2} /> Filters
                        {activeCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-[var(--primary)] text-[#1A1208] text-[10px] font-bold flex items-center justify-center px-0.5">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative">
                    <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" strokeWidth={2} />
                    <input
                        type="text"
                        value={globalQuery}
                        onChange={e => handleGlobalSearch(e.target.value)}
                        placeholder="Search by name, MCT-ID, city, country, religion, profession, employer, about me…"
                        className="w-full h-11 pl-10 pr-10 border border-[var(--border)] bg-[var(--input)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--primary)] transition-all"
                    />
                    {globalQuery && (
                        <button
                            type="button"
                            onClick={() => handleGlobalSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon size={14} strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex items-start gap-4 lg:gap-5">
                <aside className="hidden md:flex w-[17.5rem] lg:w-72 flex-shrink-0">
                    <div className="search-filter-sidebar search-filter-sidebar-panel search-filter-sidebar-panel-dashboard flex flex-col w-full sticky top-4 min-h-0 rounded-2xl border-2 border-[#FFCF00]/30 bg-white overflow-hidden">
                        <FilterSidebarToolbar
                            activeCount={activeCount}
                            onApply={handleApplyFilters}
                            onClear={handleClearFilters}
                        />
                        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2.5">
                            <FilterPanel filters={filters} onUpdate={updateFilter} />
                        </div>
                    </div>
                </aside>

                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                        <div className="search-filter-sidebar search-filter-sidebar-drawer absolute right-0 top-0 bottom-0 w-[min(21rem,calc(100vw-0.75rem))] flex flex-col min-h-0 border-l-2 border-[#FFCF00]/30 bg-white shadow-2xl">
                            <FilterSidebarToolbar
                                activeCount={activeCount}
                                onApply={handleApplyFilters}
                                onClear={handleClearFilters}
                                onClose={() => setSidebarOpen(false)}
                                showClose
                            />
                            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2.5">
                                <FilterPanel filters={filters} onUpdate={updateFilter} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Sort + badges row */}
                    <div className="flex items-start justify-between mb-3 gap-3">
                        <div className="flex-1 min-w-0">
                            <ActiveBadges filters={appliedFilters} onRemove={removeFilter} />
                        </div>
                        {!isLoading && results.length > 0 && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <label className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Sort:</label>
                                <select value={appliedFilters.sort ?? 'latest'}
                                    onChange={e => handleSortChange(e.target.value)}
                                    className="border border-[var(--border)] bg-[var(--input)] rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-foreground cursor-pointer">
                                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    {isLoading && (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="card-premium profile-card overflow-hidden">
                                    <div className="skeleton-gold profile-card-photo w-full" />
                                    <div className="p-3 space-y-2">
                                        <div className="skeleton-gold h-3.5 w-3/4 rounded" />
                                        <div className="skeleton-gold h-3 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {isError && (
                        <div className="card-premium p-12 text-center">
                            <p className="text-destructive font-medium">
                                {errorType === 'permission'
                                    ? 'Package needs to be upgraded to use this feature.'
                                    : 'Search failed. Please try again.'}
                            </p>
                        </div>
                    )}

                    {!isLoading && !isError && results.length === 0 && (
                        <div className="card-premium p-16 text-center animate-fade-in-up">
                            <SearchIcon size={52} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>No profiles found</p>
                            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search term</p>
                            {activeCount > 0 && (
                                <button onClick={handleClearFilters} className="btn-outline-gold mt-5"
                                    style={{ height: '2.25rem', borderRadius: '0.75rem', fontSize: '0.875rem', padding: '0 1.25rem' }}>
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}

                    {!isLoading && results.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5 stagger">
                                {results.map(profile => <MatchCard key={profile.id} profile={profile} showScore={false} />)}
                            </div>

                            <InfiniteScrollFooter
                                hasNextPage={!!hasNextPage}
                                isFetchingNextPage={isFetchingNextPage}
                                onLoadMore={() => fetchNextPage()}
                                showEndMessage={results.length > 0}
                                endMessage="No more profiles to show"
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

