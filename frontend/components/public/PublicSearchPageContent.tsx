'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { publicSearchService, type PublicSearchFilters } from '@/services/publicSearchService';
import { PublicProfileCard } from '@/components/match/PublicProfileCard';
import { PublicProfileViewPromptModal } from '@/components/public/PublicProfileViewPromptModal';
import { usePublicProfileCardAction } from '@/hooks/usePublicProfileCardAction';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { usePublicInfiniteList } from '@/hooks/usePublicInfiniteList';
import { normalizeMetaPage } from '@/lib/pagination';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { RangeSearchableSelect } from '@/components/ui/RangeSearchableSelect';
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
import { SearchIcon, FilterIcon, XIcon } from '@/components/ui/icons';
import { applyHeightFiltersForApi, cn, formatSearchFilterValue, resolveHeightOptionValue } from '@/lib/utils';
import {
    Users,
    Heart,
    MapPin,
    Briefcase,
    Sparkles,
    Leaf,
    type LucideIcon,
} from 'lucide-react';

const SORT_OPTIONS = [
    { value: 'latest', label: 'Newest Members' },
    { value: 'age_asc', label: 'Age: Youngest First' },
    { value: 'age_desc', label: 'Age: Oldest First' },
    { value: 'completion', label: 'Profile Completeness' },
];

const DEFAULT_FILTERS: PublicSearchFilters = {};

function countActiveFilters(f: PublicSearchFilters): number {
    const skip = new Set(['page', 'sort', 'query']);
    return Object.entries(f).filter(([k, v]) => !skip.has(k) && v !== undefined && v !== '' && v !== null).length;
}

function toOpts(items: { value: string; label: string }[]) {
    return items;
}

function numToStr(v?: number) {
    return v != null ? String(v) : undefined;
}

function parseUrlFilters(params: URLSearchParams): PublicSearchFilters {
    const filters: PublicSearchFilters = {};
    const gender = params.get('gender');
    if (gender === 'male' || gender === 'female') filters.gender = gender;

    const ageMin = params.get('age_min');
    if (ageMin) filters.age_min = Number(ageMin);
    const ageMax = params.get('age_max');
    if (ageMax) filters.age_max = Number(ageMax);

    const religion = params.get('religion');
    if (religion) filters.religion = religion;

    const query = params.get('query');
    if (query) filters.query = query;

    return filters;
}

interface FilterPanelProps {
    filters: PublicSearchFilters;
    onUpdate: <K extends keyof PublicSearchFilters>(key: K, val: PublicSearchFilters[K]) => void;
}

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

    const selectedReligionId = religionOpts.find((o) => o.value === filters.religion)?.id;
    const { data: casteOpts = [] } = useChildOptions('caste', selectedReligionId);

    const selectedCountryOption = countryOpts.find((o) => o.value === filters.country);
    const selectedCountryId = selectedCountryOption?.id;
    const locationMeta = getLocationMetadata(selectedCountryOption);
    const { data: stateOpts = [] } = useChildOptions('country', selectedCountryId);

    const level2SelectionValue = level2ValueForChildren(selectedCountryOption, filters.city, filters.state);
    const selectedLevel2Id = stateOpts.find((o) => o.value === level2SelectionValue)?.id;
    const { data: locationLevel3Opts = [] } = useChildOptions('country', selectedLevel2Id);

    const level3SelectionValue = level3ValueForChildren(
        selectedCountryOption,
        filters.state,
        filters.city,
        filters.upazila,
    );
    const selectedLevel3Id = locationLevel3Opts.find((o) => o.value === level3SelectionValue)?.id;
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
                    {(['male', 'female'] as const).map((g) => (
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
                    idPrefix="psr-age"
                    options={ageOptions}
                    minValue={numToStr(filters.age_min)}
                    maxValue={numToStr(filters.age_max)}
                    onMinChange={(v) => onUpdate('age_min', v ? Number(v) : undefined)}
                    onMaxChange={(v) => onUpdate('age_max', v ? Number(v) : undefined)}
                    minPlaceholder="Min…"
                    maxPlaceholder="Max…"
                />
                <p className="text-xs font-bold uppercase tracking-wider text-meta pt-0.5">Height (ft &amp; in)</p>
                <RangeSearchableSelect
                    idPrefix="psr-ht"
                    options={heightOptions}
                    minValue={heightMinValue}
                    maxValue={heightMaxValue}
                    onMinChange={(v) => onUpdate('height_min', v ? Number(v) : undefined)}
                    onMaxChange={(v) => onUpdate('height_max', v ? Number(v) : undefined)}
                    minPlaceholder="Min…"
                    maxPlaceholder="Max…"
                />
            </FilterSection>

            <FilterSection title="Location" icon={MapPin} defaultOpen>
                <div className="space-y-1.5">
                    <SearchableSelect
                        id="psr-cnt"
                        options={toOpts(countryOpts)}
                        value={filters.country}
                        onChange={(v) => {
                            onUpdate('country', v ?? undefined);
                            onUpdate('state', undefined);
                            onUpdate('city', undefined);
                            onUpdate('upazila', undefined);
                        }}
                        placeholder="Country…"
                    />
                    {stateOpts.length > 0 && level2FormField && (
                        <SearchableSelect
                            id="psr-l2"
                            options={toOpts(stateOpts)}
                            value={level2FilterValue}
                            onChange={(v) => {
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
                            id="psr-l3"
                            options={toOpts(locationLevel3Opts)}
                            value={level3FilterValue}
                            onChange={(v) => {
                                if (!level3FormField) return;
                                onUpdate(level3FormField, v ?? undefined);
                                if (level4FormField) onUpdate(level4FormField, undefined);
                            }}
                            placeholder={`${level3Label}…`}
                        />
                    )}
                    {locationLevel4Opts.length > 0 && level4FormField && (
                        <SearchableSelect
                            id="psr-l4"
                            options={toOpts(locationLevel4Opts)}
                            value={level4FilterValue}
                            onChange={(v) => level4FormField && onUpdate(level4FormField, v ?? undefined)}
                            placeholder={`${level4Label}…`}
                        />
                    )}
                    {/* Nationality filter retired
                    <SearchableSelect
                        id="psr-nat"
                        options={toOpts(nationalityOpts)}
                        value={filters.nationality}
                        onChange={(v) => onUpdate('nationality', v ?? undefined)}
                        placeholder="Nationality…"
                    />
                    */}
                    <SearchableSelect
                        id="psr-rs"
                        options={toOpts(residingStatusOpts)}
                        value={filters.residing_status}
                        onChange={(v) => onUpdate('residing_status', v ?? undefined)}
                        placeholder="Residing status…"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Faith & Family" icon={Heart}>
                <div className="space-y-1.5">
                    <SearchableSelect
                        id="psr-rel"
                        options={toOpts(religionOpts)}
                        value={filters.religion}
                        onChange={(v) => {
                            onUpdate('religion', v ?? undefined);
                            onUpdate('caste', undefined);
                        }}
                        placeholder="Religion…"
                    />
                    {casteOpts.length > 0 && (
                        <SearchableSelect
                            id="psr-cst"
                            options={toOpts(casteOpts)}
                            value={filters.caste}
                            onChange={(v) => onUpdate('caste', v ?? undefined)}
                            placeholder="Caste…"
                        />
                    )}
                    <SearchableSelect
                        id="psr-ms"
                        options={toOpts(maritalOpts)}
                        value={filters.marital_status}
                        onChange={(v) => onUpdate('marital_status', v ?? undefined)}
                        placeholder="Marital status…"
                    />
                    <SearchableSelect
                        id="psr-hc"
                        options={toOpts(haveChildrenOpts)}
                        value={filters.has_children}
                        onChange={(v) => onUpdate('has_children', v ?? undefined)}
                        placeholder="Has children…"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Education & Career" icon={Briefcase}>
                <div className="space-y-1.5">
                    <SearchableSelect
                        id="psr-edu"
                        options={toOpts(educationOpts)}
                        value={filters.education}
                        onChange={(v) => onUpdate('education', v ?? undefined)}
                        placeholder="Education…"
                    />
                    <SearchableSelect
                        id="psr-prf"
                        options={toOpts(professionOpts)}
                        value={filters.profession}
                        onChange={(v) => onUpdate('profession', v ?? undefined)}
                        placeholder="Profession…"
                    />
                    <SearchableSelect
                        id="psr-emp"
                        options={toOpts(employedInOpts)}
                        value={filters.employed_in}
                        onChange={(v) => onUpdate('employed_in', v ?? undefined)}
                        placeholder="Employed in…"
                    />
                    <div>
                        <Label className="text-xs font-semibold text-meta block mb-1">Income (BDT)</Label>
                        <div className="flex items-center gap-1.5">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={filters.income_min ?? ''}
                                onChange={(e) =>
                                    onUpdate('income_min', e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="h-9 flex-1 rounded-lg text-xs"
                            />
                            <span className="text-muted-foreground text-xs">–</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={filters.income_max ?? ''}
                                onChange={(e) =>
                                    onUpdate('income_max', e.target.value ? Number(e.target.value) : undefined)
                                }
                                className="h-9 flex-1 rounded-lg text-xs"
                            />
                        </div>
                    </div>
                </div>
            </FilterSection>

            <FilterSection title="Appearance" icon={Sparkles}>
                <div className="space-y-1.5">
                    <SearchableSelect
                        id="psr-bt"
                        options={toOpts(bodyTypeOpts)}
                        value={filters.body_type}
                        onChange={(v) => onUpdate('body_type', v ?? undefined)}
                        placeholder="Body type…"
                    />
                    <SearchableSelect
                        id="psr-cx"
                        options={toOpts(complexionOpts)}
                        value={filters.complexion}
                        onChange={(v) => onUpdate('complexion', v ?? undefined)}
                        placeholder="Complexion…"
                    />
                    <SearchableSelect
                        id="psr-bg"
                        options={toOpts(bloodGroupOpts)}
                        value={filters.blood_group}
                        onChange={(v) => onUpdate('blood_group', v ?? undefined)}
                        placeholder="Blood group…"
                    />
                    <SearchableSelect
                        id="psr-mt"
                        options={toOpts(motherTongueOpts)}
                        value={filters.mother_tongue}
                        onChange={(v) => onUpdate('mother_tongue', v ?? undefined)}
                        placeholder="Mother tongue…"
                    />
                </div>
            </FilterSection>

            <FilterSection title="Lifestyle" icon={Leaf}>
                <div className="space-y-1.5">
                    <SearchableSelect
                        id="psr-diet"
                        options={toOpts(dietOpts)}
                        value={filters.diet}
                        onChange={(v) => onUpdate('diet', v ?? undefined)}
                        placeholder="Diet…"
                    />
                    <SearchableSelect
                        id="psr-smk"
                        options={toOpts(smokingOpts)}
                        value={filters.smoking}
                        onChange={(v) => onUpdate('smoking', v ?? undefined)}
                        placeholder="Smoking…"
                    />
                    <SearchableSelect
                        id="psr-drk"
                        options={toOpts(drinkingOpts)}
                        value={filters.drinking}
                        onChange={(v) => onUpdate('drinking', v ?? undefined)}
                        placeholder="Drinking…"
                    />
                </div>
            </FilterSection>
        </div>
    );
}

const FILTER_LABELS: Partial<Record<keyof PublicSearchFilters, string>> = {
    gender: 'Gender',
    age_min: 'Age ≥',
    age_max: 'Age ≤',
    height_min: 'Height ≥',
    height_max: 'Height ≤',
    religion: 'Religion',
    caste: 'Caste',
    marital_status: 'Marital',
    has_children: 'Children',
    body_type: 'Body',
    complexion: 'Complexion',
    blood_group: 'Blood',
    mother_tongue: 'Language',
    education: 'Education',
    profession: 'Profession',
    employed_in: 'Employed',
    income_min: 'Income ≥',
    income_max: 'Income ≤',
    country: 'Country',
    state: 'State',
    city: 'City',
    upazila: 'Upazila',
    // nationality: 'Nationality', // retired
    residing_status: 'Residing',
    diet: 'Diet',
    smoking: 'Smoking',
    drinking: 'Drinking',
};

function ActiveBadges({
    filters,
    onRemove,
}: {
    filters: PublicSearchFilters;
    onRemove: (key: keyof PublicSearchFilters) => void;
}) {
    const skip = new Set<string>(['page', 'sort', 'query']);
    const entries = Object.entries(filters).filter(
        ([k, v]) => !skip.has(k) && v !== undefined && v !== '',
    ) as [keyof PublicSearchFilters, unknown][];
    if (entries.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mb-2">
            {entries.map(([key, val]) => (
                <span
                    key={key}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-[var(--primary)]/40 bg-[var(--accent)] text-[#1A1208] font-medium"
                >
                    {FILTER_LABELS[key] ?? String(key)}: <span className="font-semibold">{formatSearchFilterValue(key, val)}</span>
                    <button onClick={() => onRemove(key)} className="ml-0.5 hover:text-red-400 transition-colors">
                        <XIcon size={10} strokeWidth={3} />
                    </button>
                </span>
            ))}
        </div>
    );
}

export default function PublicSearchPageContent() {
    const searchParams = useSearchParams();
    const urlInitRef = useRef(false);

    const [filters, setFilters] = useState<PublicSearchFilters>(DEFAULT_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<PublicSearchFilters>(DEFAULT_FILTERS);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [globalQuery, setGlobalQuery] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (urlInitRef.current) return;
        const initial = parseUrlFilters(searchParams);
        if (Object.keys(initial).length > 0) {
            setFilters(initial);
            setAppliedFilters(initial);
            if (initial.query) setGlobalQuery(initial.query);
        }
        urlInitRef.current = true;
    }, [searchParams]);

    const handleGlobalSearch = useCallback((val: string) => {
        setGlobalQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedFilters((prev) => ({ ...prev, query: val || undefined }));
        }, 420);
    }, []);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    const {
        items: results,
        total,
        isLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = usePublicInfiniteList({
        queryKey: ['search', appliedFilters],
        queryFn: (page) =>
            publicSearchService.search(applyHeightFiltersForApi({ ...appliedFilters, page })).then((r) => normalizeMetaPage(r.data.data, page)),
        retry: false,
    });

    const updateFilter = useCallback(<K extends keyof PublicSearchFilters>(key: K, value: PublicSearchFilters[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const removeFilter = useCallback((key: keyof PublicSearchFilters) => {
        setFilters((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
        });
        setAppliedFilters((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
        });
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
        setAppliedFilters((prev) => ({ ...prev, sort: sort as PublicSearchFilters['sort'] }));
    };

    const activeCount = countActiveFilters(appliedFilters);
    const {
        selectedProfile,
        isModalOpen,
        handleProfileClick,
        setModalOpen,
    } = usePublicProfileCardAction();

    return (
        <>
            <PublicProfileViewPromptModal
                profile={selectedProfile}
                open={isModalOpen}
                onOpenChange={setModalOpen}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-20 min-h-screen" style={{ background: 'linear-gradient(180deg, #FEFCF5 0%, #F8F9FB 12rem)' }}>
                <div className="flex items-start gap-4 lg:gap-5">
                    <aside className="hidden md:flex w-[17.5rem] lg:w-72 flex-shrink-0">
                        <div className="search-filter-sidebar search-filter-sidebar-panel flex flex-col w-full sticky top-[4.25rem] min-h-0 rounded-2xl border-2 border-[#FFCF00]/30 bg-white overflow-hidden">
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
                        <div className="search-page-header mb-3 overflow-hidden rounded-2xl border border-[#FFCF00]/25 bg-white shadow-sm">
                            <div className="h-1 bg-gradient-to-r from-[#FFCF00] via-[#FFE033] to-[#FFCF00]" />
                            <div className="px-4 py-3 sm:px-4 sm:py-3">
                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center justify-between gap-3 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                                            <h1
                                                className="text-lg sm:text-xl font-bold text-[#1A1208] leading-tight"
                                                style={{ fontFamily: 'var(--font-heading, serif)' }}
                                            >
                                                Search Profiles
                                            </h1>
                                            {!isLoading && total > 0 && (
                                                <span className="inline-flex items-center rounded-full bg-[#FFCF00] px-2 py-0.5 text-[10px] font-bold text-[#1A1208]">
                                                    {total.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSidebarOpen(true)}
                                            className="btn-gold md:hidden flex items-center gap-1.5 relative shrink-0"
                                            style={{ height: '2.25rem', borderRadius: '0.625rem', padding: '0 0.875rem', fontSize: '0.8125rem' }}
                                        >
                                            <FilterIcon size={14} strokeWidth={2} /> Filters
                                            {activeCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[1.1rem] h-[1.1rem] rounded-full bg-[#1A1208] text-[#FFCF00] text-[10px] font-bold flex items-center justify-center px-0.5">
                                                    {activeCount}
                                                </span>
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end min-w-0 sm:max-w-xl">
                                        <div className="relative flex-1 min-w-0">
                                            <SearchIcon
                                                size={15}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C4F3A] pointer-events-none"
                                                strokeWidth={2}
                                            />
                                            <input
                                                type="text"
                                                value={globalQuery}
                                                onChange={(e) => handleGlobalSearch(e.target.value)}
                                                placeholder="Search by name, city, religion…"
                                                className="w-full h-10 pl-9 pr-9 rounded-xl border border-[#E8DFCC] bg-[#FFCF00]/5 text-sm text-[#1A1208] placeholder:text-[#5C4F3A] focus:outline-none focus:ring-2 focus:ring-[#FFCF00]/35 focus:border-[#FFCF00] transition-all"
                                            />
                                            {globalQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleGlobalSearch('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C4F3A] hover:text-[#1A1208] transition-colors"
                                                >
                                                    <XIcon size={14} strokeWidth={2} />
                                                </button>
                                            )}
                                        </div>

                                        {!isLoading && results.length > 0 && (
                                            <select
                                                value={appliedFilters.sort ?? 'latest'}
                                                onChange={(e) => handleSortChange(e.target.value)}
                                                className="h-10 min-w-[9.5rem] rounded-xl border border-[#E8DFCC] bg-white px-2.5 text-xs font-semibold text-[#1A1208] focus:outline-none focus:ring-2 focus:ring-[#FFCF00]/35 focus:border-[#FFCF00] cursor-pointer sm:shrink-0"
                                            >
                                                {SORT_OPTIONS.map((o) => (
                                                    <option key={o.value} value={o.value}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-2">
                            <ActiveBadges filters={appliedFilters} onRemove={removeFilter} />
                        </div>

                        {isLoading && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5">
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
                            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                                <p className="text-destructive font-medium">Search failed. Please try again.</p>
                            </div>
                        )}

                        {!isLoading && !isError && results.length === 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center animate-fade-in-up shadow-sm">
                                <SearchIcon size={52} className="mx-auto text-[var(--gold-200)] mb-4" strokeWidth={1.2} />
                                <p
                                    className="text-lg font-semibold text-foreground"
                                    style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                    No profiles found
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search term</p>
                                {activeCount > 0 && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="btn-outline-gold mt-5"
                                        style={{
                                            height: '2.25rem',
                                            borderRadius: '0.75rem',
                                            fontSize: '0.875rem',
                                            padding: '0 1.25rem',
                                        }}
                                    >
                                        Clear All Filters
                                    </button>
                                )}
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5 stagger">
                                    {results.map((profile) => (
                                        <div key={profile.id} className="h-full">
                                            <PublicProfileCard
                                                profile={profile}
                                                onClick={() => handleProfileClick(profile)}
                                            />
                                        </div>
                                    ))}
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
        </>
    );
}
