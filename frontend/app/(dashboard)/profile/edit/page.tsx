'use client';

import {useState, useEffect, useRef, Suspense, useMemo} from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {useUserQuery} from '@/hooks/useUserQuery';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {invalidateProfileQueries, invalidateDashboardQueries} from '@/lib/cacheInvalidation';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useSearchParams} from 'next/navigation';
import {profileService} from '@/services/profileService';
import {authService} from '@/services/authService';
import { showSuccessToast, showErrorToast, getErrorMessage } from '@/lib/toast';
import { heightGroupMaxCm, heightGroupMinCm, resolveHeightOptionValue, resolveProfilePhotoUrl } from '@/lib/utils';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {ProfileCompletionBar} from '@/components/profile/ProfileCompletionBar';
import {SearchableSelect, MultiSearchableSelect} from '@/components/ui/SearchableSelect';
import type {ProfilePhoto} from '@/types/profile';
import {
    heightOptions, weightOptions, ageOptions,
    siblingCountOptions, siblingPositionOptions,
    experienceOptions,
} from '@/lib/profileOptions';
import {
    useOptionsBulk,
    useChildOptions,
    useChildOptionsBulk,
    pickOptions,
    PROFILE_EDIT_OPTION_GROUPS,
} from '@/hooks/useSelectOptions';
import {
    clearDeeperLocationFields,
    clearLocationFields,
    getLevelLabel,
    getLocationMetadata,
    level2Field,
    level2ValueForChildren,
    level3Field,
    level3ValueForChildren,
    level4Field,
} from '@/lib/locationHierarchy';

// ─── Tab order for auto-advance after save ───────────────────────────────────
const PROFILE_EDIT_TABS = [
    'basic', 'location', 'religion', 'career', 'lifestyle', 'family',
    'horoscope', 'photo', 'preferences', 'security',
] as const;

// ─── ENUM fields that must not be sent as empty string ───────────────────────
const ENUM_FIELDS = new Set([
    'marital_status','manglik_status','employed_in','diet','smoking','drinking',
    'family_type','family_status','complexion','blood_group','body_type',
    'disability','eye_wear','has_children','child_living_status','family_values',
    'residing_status','profile_created_for','looking_for','religiousness','pray',
    'profile_created_by',
]);

// ─── Schemas ──────────────────────────────────────────────────────────────────
const basicSchema = z.object({
    name: z.string().max(100).optional(),
    nick_name: z.string().max(100).optional(),
    profile_created_by: z.string().optional(),
    profile_created_for: z.string().optional(),
    looking_for: z.string().optional(),
    dob: z.string().optional(),
    marital_status: z.string().optional(),
    height_cm: z.string().optional(),
    weight_kg: z.string().optional(),
    body_type: z.string().optional(),
    eye_color: z.string().optional(),
    hair_color: z.string().optional(),
    complexion: z.string().optional(),
    blood_group: z.string().optional(),
    disability: z.string().optional(),
    mother_tongue: z.string().optional(),
    about_me: z.string().max(2000).optional(),
    what_looking_for: z.string().max(2000).optional(),
});

const locationSchema = z.object({
    // nationality: z.string().optional(), // retired
    country: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    upazila: z.string().optional(),
    postal_code: z.string().max(20).optional(),
    residing_status: z.string().optional(),
});

const religiousSchema = z.object({
    religion: z.string().optional(),
    caste: z.string().optional(),
    sub_caste: z.string().max(100).optional(),
    gotra: z.string().max(100).optional(),
    manglik_status: z.string().optional(),
    religiousness: z.string().optional(),
    pray: z.string().optional(),
});

const educationSchema = z.object({
    highest_education: z.string().optional(),
    college_university: z.string().max(300).optional(),
    institution_name_year: z.string().max(300).optional(),
    employer_name: z.string().max(200).optional(),
    job_location: z.string().max(200).optional(),
    designation: z.string().max(200).optional(),
    experience_years: z.string().optional(),
    profession: z.string().optional(),
    employed_in: z.string().optional(),
    annual_income_bdt: z.string().optional(),
});

const lifestyleSchema = z.object({
    diet: z.string().optional(),
    smoking: z.string().optional(),
    drinking: z.string().optional(),
    eye_wear: z.string().optional(),
    hobbies: z.array(z.string()).optional(),
});

const familySchema = z.object({
    family_type: z.string().optional(),
    family_status: z.string().optional(),
    family_income_bdt_per_month: z.string().optional(),
    father_occupation: z.string().optional(),
    mother_occupation: z.string().optional(),
    brothers_count: z.string().optional(),
    sisters_count: z.string().optional(),
    sibling_position: z.string().optional(),
    has_children: z.string().optional(),
    child_living_status: z.string().optional(),
    family_values: z.string().optional(),
});

const horoscopeSchema = z.object({
    birth_place: z.string().max(200).optional(),
    birth_time: z.string().optional(),
    rashi: z.string().max(100).optional(),
    nakshatra: z.string().max(100).optional(),
    manglik: z.boolean().optional(),
});

const preferencesSchema = z.object({
    age_min: z.string().optional().refine(v => !v || (Number(v) >= 18 && Number(v) <= 100), { message: 'Age must be between 18 and 100' }),
    age_max: z.string().optional().refine(v => !v || (Number(v) >= 18 && Number(v) <= 100), { message: 'Age must be between 18 and 100' }),
    height_min_cm: z.string().optional().refine(v => !v || Number(v) >= 100, { message: 'Height must be at least 100 cm' }),
    height_max_cm: z.string().optional().refine(v => !v || Number(v) >= 100, { message: 'Height must be at least 100 cm' }),
    pref_marital_status: z.array(z.string()).optional(),
    pref_diet: z.array(z.string()).optional(),
    pref_education: z.array(z.string()).optional(),
    pref_religion: z.array(z.string()).optional(),
    pref_caste: z.string().optional(),
    pref_profession: z.array(z.string()).optional(),
    income_min_bdt: z.string().optional(),
    income_max_bdt: z.string().optional(),
    pref_country: z.array(z.string()).optional(),
    // Location hierarchy preferences
    pref_divisions: z.array(z.string()).optional(),
    pref_districts: z.array(z.string()).optional(),
    pref_provinces: z.array(z.string()).optional(),
    pref_states: z.array(z.string()).optional(),
    smoking_acceptable: z.boolean().optional(),
    drinking_acceptable: z.boolean().optional(),
    // Extended fields
    pref_body_type: z.array(z.string()).optional(),
    pref_complexion: z.array(z.string()).optional(),
    pref_blood_group: z.array(z.string()).optional(),
    pref_mother_tongue: z.array(z.string()).optional(),
    pref_manglik_status: z.array(z.string()).optional(),
    pref_rashi: z.array(z.string()).optional(),
    pref_religiousness: z.array(z.string()).optional(),
    pref_pray: z.array(z.string()).optional(),
    pref_has_children: z.string().optional(),
    pref_child_living_status: z.array(z.string()).optional(),
    pref_family_type: z.array(z.string()).optional(),
    pref_family_values: z.array(z.string()).optional(),
    pref_working_status: z.array(z.string()).optional(),
    pref_employed_in: z.array(z.string()).optional(),
    pref_residing_status: z.array(z.string()).optional(),
}).refine(d => !d.age_min || !d.age_max || Number(d.age_min) <= Number(d.age_max), {
    message: 'Min age must not be greater than max age',
    path: ['age_min'],
}).refine(d => !d.height_min_cm || !d.height_max_cm || Number(d.height_min_cm) <= Number(d.height_max_cm), {
    message: 'Min height must not be greater than max height',
    path: ['height_min_cm'],
});

const changePasswordSchema = z.object({
    current_password: z.string().min(1,'Current password is required'),
    new_password: z.string().min(8,'New password must be at least 8 characters'),
    new_password_confirmation: z.string().min(8,'Please confirm your new password'),
}).refine(d => d.new_password === d.new_password_confirmation,{
    message:'Passwords do not match', path:['new_password_confirmation'],
});

type BasicForm = z.infer<typeof basicSchema>;
type LocationForm = z.infer<typeof locationSchema>;
type ReligiousForm = z.infer<typeof religiousSchema>;
type EducationForm = z.infer<typeof educationSchema>;
type LifestyleForm = z.infer<typeof lifestyleSchema>;
type FamilyForm = z.infer<typeof familySchema>;
type HoroscopeForm = z.infer<typeof horoscopeSchema>;
type PreferencesForm = z.infer<typeof preferencesSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function SaveStatus({saved,saving}:{saved:boolean;saving:boolean}) {
    if (saving) return <span className="text-xs text-[#4A3F2E]">Saving…</span>;
    if (saved) return <span className="text-xs text-green-600 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Saved</span>;
    return null;
}

function FieldRow({label,hint,required,children}:{label:string;hint?:string;required?:boolean;children:React.ReactNode}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
            {hint && <p className="text-xs text-[#4A3F2E]">{hint}</p>}
            {children}
        </div>
    );
}

// ─── Date of Birth Picker ─────────────────────────────────────────────────────
function DobPicker({value, onChange}: {value: string; onChange: (v: string) => void}) {
    const selected = useMemo(() => {
        if (!value) return null;
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }, [value]);

    const maxDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d;
    }, []);

    const minDate = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 90);
        return d;
    }, []);

    return (
        <DatePicker
            selected={selected}
            onChange={(date: Date | null) => {
                if (date) {
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    onChange(`${y}-${m}-${d}`);
                } else {
                    onChange('');
                }
            }}
            dateFormat="dd MMMM yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            maxDate={maxDate}
            minDate={minDate}
            placeholderText="Select date of birth"
            className="h-8 w-full border border-border bg-input rounded-lg px-2.5 py-1 text-sm text-foreground focus:outline-none focus:ring-3 focus:ring-ring/50 focus:border-primary"
            wrapperClassName="w-full"
            popperProps={{strategy: 'fixed'}}
            popperPlacement="bottom-start"
            portalId="datepicker-portal"
        />
    );
}

// ─── Inner Page ───────────────────────────────────────────────────────────────
function ProfileEditInner() {
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') ?? 'basic';
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [savedTab,setSavedTab] = useState<string|null>(null);
    const [uploadingPhoto,setUploadingPhoto] = useState(false);
    const [photoError,setPhotoError] = useState<string|null>(null);
    const [pwSuccess,setPwSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Update active tab when URL changes
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab') ?? 'basic';
        setActiveTab(tabFromUrl);
    }, [searchParams]);

    const {data:profileRes,isLoading} = useUserQuery({queryKey:['my-profile'],queryFn:()=>profileService.getMyProfile().then(r=>r.data)});
    const {data:completionRes} = useUserQuery({queryKey:['profile-completion'],queryFn:()=>profileService.getCompletionStatus().then(r=>r.data.data)});

    const invalidateProfileData = () => {
        invalidateProfileQueries(queryClient);
        invalidateDashboardQueries(queryClient);
    };

    const saveMutation = useMutation({
        mutationFn:(data:Record<string,unknown>)=>profileService.updateProfile(data),
        onSuccess:()=>{invalidateProfileData();},
    });
    const prefMutation = useMutation({
        mutationFn:(data:Record<string,unknown>)=>profileService.updatePreferences(data),
        onSuccess:()=>{invalidateProfileData();},
    });
    const changePasswordMutation = useMutation({mutationFn:(data:ChangePasswordForm)=>authService.changePassword(data)});

    const profile = profileRes?.data;

    const basicForm = useForm<BasicForm>({resolver:zodResolver(basicSchema)});
    const locationForm = useForm<LocationForm>({resolver:zodResolver(locationSchema)});
    const religiousForm = useForm<ReligiousForm>({resolver:zodResolver(religiousSchema)});
    const educationForm = useForm<EducationForm>({resolver:zodResolver(educationSchema)});
    const lifestyleForm = useForm<LifestyleForm>({resolver:zodResolver(lifestyleSchema)});
    const familyForm = useForm<FamilyForm>({resolver:zodResolver(familySchema)});
    const horoscopeForm = useForm<HoroscopeForm>({resolver:zodResolver(horoscopeSchema)});
    const preferencesForm = useForm<PreferencesForm>({resolver:zodResolver(preferencesSchema)});
    const changePasswordForm = useForm<ChangePasswordForm>({resolver:zodResolver(changePasswordSchema)});

    const watchedReligion = religiousForm.watch('religion');
    const watchedCountry = locationForm.watch('country');
    const watchedCity = locationForm.watch('city');
    const watchedState = locationForm.watch('state');
    const watchedUpazila = locationForm.watch('upazila');

    // ── Dynamic select options from API (single bulk request) ───────────────
    const { data: bulkOptions } = useOptionsBulk(PROFILE_EDIT_OPTION_GROUPS);

    const profileCreatedByOptions = pickOptions(bulkOptions, 'profile_created_by');
    const profileCreatedForOptions = pickOptions(bulkOptions, 'profile_created_for');
    const lookingForOptions = pickOptions(bulkOptions, 'looking_for');
    const maritalStatusOptions = pickOptions(bulkOptions, 'marital_status');
    const haveChildrenOptions = pickOptions(bulkOptions, 'have_children');
    const childLivingStatusOptions = pickOptions(bulkOptions, 'child_living_status');
    const bodyTypeOptions = pickOptions(bulkOptions, 'body_type');
    const eyeColorOptions = pickOptions(bulkOptions, 'eye_color');
    const hairColorOptions = pickOptions(bulkOptions, 'hair_color');
    const complexionOptions = pickOptions(bulkOptions, 'complexion');
    const bloodGroupOptions = pickOptions(bulkOptions, 'blood_group');
    const disabilityOptions = pickOptions(bulkOptions, 'disability');
    const smokingOptions = pickOptions(bulkOptions, 'smoking');
    const drinkingOptions = pickOptions(bulkOptions, 'drinking');
    const religionOptions = pickOptions(bulkOptions, 'religion');
    const religiousnessOptions = pickOptions(bulkOptions, 'religiousness');
    const prayOptions = pickOptions(bulkOptions, 'pray');
    const manglikStatusOptions = pickOptions(bulkOptions, 'manglik_status');
    const motherTongueOptions = pickOptions(bulkOptions, 'mother_tongue');
    const familyValuesOptions = pickOptions(bulkOptions, 'family_values');
    const occupationOptions = pickOptions(bulkOptions, 'occupation');
    const professionOptions = pickOptions(bulkOptions, 'profession');
    const educationLevelOptions = pickOptions(bulkOptions, 'education_level');
    const employedInOptions = pickOptions(bulkOptions, 'employed_in');
    const dietOptions = pickOptions(bulkOptions, 'diet');
    const eyeWearOptions = pickOptions(bulkOptions, 'eye_wear');
    const hobbiesOptions = pickOptions(bulkOptions, 'hobbies');
    // const nationalityOptions = pickOptions(bulkOptions, 'nationality'); // retired
    const countryOptions = pickOptions(bulkOptions, 'country');
    const residingStatusOptions = pickOptions(bulkOptions, 'residing_status');
    const familyTypeOptions = pickOptions(bulkOptions, 'family_type');
    const familyStatusOptions = pickOptions(bulkOptions, 'family_status');
    const rashiOptions = pickOptions(bulkOptions, 'rashi');
    const workingStatusOptions = pickOptions(bulkOptions, 'working_status');
    const prefHasChildrenOptions = pickOptions(bulkOptions, 'pref_has_children');

    // ── Dependent (nested) options ───────────────────────────────────────────
    // Caste depends on selected religion
    const selectedReligionId = religionOptions.find(o => o.value === watchedReligion)?.id;
    const { data: casteOpts = [] } = useChildOptions('caste', selectedReligionId);

  // Location cascade driven by country metadata
    const selectedCountryOption = countryOptions.find(o => o.value === watchedCountry);
    const selectedCountryId = selectedCountryOption?.id;
    const locationMeta = getLocationMetadata(selectedCountryOption);
    const { data: locationLevel2Opts = [] } = useChildOptions('country', selectedCountryId);

    const level2SelectionValue = level2ValueForChildren(selectedCountryOption, watchedCity, watchedState);
    const selectedLevel2Id = locationLevel2Opts.find(o => o.value === level2SelectionValue)?.id;
    const { data: locationLevel3Opts = [] } = useChildOptions('country', selectedLevel2Id);

    const level3SelectionValue = level3ValueForChildren(selectedCountryOption, watchedState, watchedCity, watchedUpazila);
    const selectedLevel3Id = locationLevel3Opts.find(o => o.value === level3SelectionValue)?.id;
    const { data: locationLevel4Opts = [] } = useChildOptions('country', selectedLevel3Id);

    const level2Label = getLevelLabel(locationMeta, 2, 'State / Division');
    const level3Label = getLevelLabel(locationMeta, 3, 'District / City');
    const level4Label = getLevelLabel(locationMeta, 4, 'Upazila / Thana');
    const level2FormField = level2Field(selectedCountryOption);
    const level3FormField = level3Field(selectedCountryOption);
    const level4FormField = level4Field(selectedCountryOption);

    // ── Preferences Location Hierarchy ────────────────────────────────────────
    const watchedPrefCountries = preferencesForm.watch('pref_country');
    const watchedPrefDivisions = preferencesForm.watch('pref_divisions');
    const isBangladeshSelected = watchedPrefCountries?.includes('bangladesh');
    const isCanadaSelected = watchedPrefCountries?.includes('canada');
    const isUsaSelected = watchedPrefCountries?.includes('united_states');

    // Bangladesh: first show divisions
    const bangladeshOption = countryOptions.find(o => o.value === 'bangladesh');
    const { data: prefDivisionOpts = [] } = useChildOptions('country', isBangladeshSelected ? bangladeshOption?.id : undefined);

    // Bangladesh: then load districts under selected division(s)
    const selectedPrefDivisionIds = useMemo(() => {
        if (!isBangladeshSelected || !watchedPrefDivisions?.length) return [] as number[];
        const selected = new Set(watchedPrefDivisions);
        return prefDivisionOpts
            .filter((o) => selected.has(o.value))
            .map((o) => o.id);
    }, [isBangladeshSelected, watchedPrefDivisions, prefDivisionOpts]);

    const { data: prefDistrictOpts = [] } = useChildOptionsBulk(
        'country',
        isBangladeshSelected ? selectedPrefDivisionIds : [],
    );

    // Get Canada country ID for fetching provinces
    const canadaOption = countryOptions.find(o => o.value === 'canada');
    const { data: prefProvinceOpts = [] } = useChildOptions('country', isCanadaSelected ? canadaOption?.id : undefined);

    // Get USA country ID for fetching states
    const usaOption = countryOptions.find(o => o.value === 'united_states');
    const { data: prefStateOpts = [] } = useChildOptions('country', isUsaSelected ? usaOption?.id : undefined);

    useEffect(()=>{
        if (!profile) return;
        const p = profile.profile;
        if (p) {
            const dobParts = p.dob ? p.dob.split('T')[0] : '';
            basicForm.reset({
                name:profile.name??'', nick_name:p.nick_name??'',
                profile_created_by:(profile as any).profile_created_by??'',
                profile_created_for:p.profile_created_for??'', looking_for:p.looking_for??'',
                dob:dobParts, marital_status:p.marital_status??'',
                height_cm: resolveHeightOptionValue(p.height_cm?.toString()) ?? p.height_cm?.toString() ?? '',
                weight_kg:p.weight_kg?.toString()??'',
                body_type:p.body_type??'', eye_color:p.eye_color??'', hair_color:p.hair_color??'',
                complexion:p.complexion??'', blood_group:p.blood_group??'', disability:p.disability??'',
                mother_tongue:p.mother_tongue??'', about_me:p.about_me??'', what_looking_for:p.what_looking_for??'',
            });
            locationForm.reset({
                // nationality:p.nationality??'', // retired
                country:p.country??'', city:p.city??'',
                state:p.state??'', upazila:(p as {upazila?: string}).upazila??'',
                postal_code:p.postal_code??'', residing_status:p.residing_status??'',
            });
        }
        if (profile.religious_detail) {
            const rd = profile.religious_detail;
            religiousForm.reset({
                religion:rd.religion??'', caste:rd.caste??'', sub_caste:rd.sub_caste??'',
                gotra:rd.gotra??'', manglik_status:rd.manglik_status??'',
                religiousness:rd.religiousness??'', pray:rd.pray??'',
            });
        }
        if (profile.education_career) {
            const ec = profile.education_career;
            educationForm.reset({
                highest_education:ec.highest_education??'', college_university:ec.college_university??'',
                institution_name_year:ec.institution_name_year??'', employer_name:ec.employer_name??'',
                job_location:ec.job_location??'', designation:ec.designation??'',
                experience_years:ec.experience_years?.toString()??'', profession:ec.profession??'',
                employed_in:ec.employed_in??'', annual_income_bdt:ec.annual_income_bdt?.toString()??'',
            });
        }
        if (profile.lifestyle) {
            const ls = profile.lifestyle;
            lifestyleForm.reset({diet:ls.diet??'',smoking:ls.smoking??'',drinking:ls.drinking??'',eye_wear:ls.eye_wear??'',hobbies:ls.hobbies??[]});
        }
        if (profile.family_detail) {
            const fd = profile.family_detail;
            familyForm.reset({
                family_type:fd.family_type??'', family_status:fd.family_status??'',
                family_income_bdt_per_month:fd.family_income_bdt_per_month?.toString()??'',
                father_occupation:fd.father_occupation??'', mother_occupation:fd.mother_occupation??'',
                brothers_count:fd.brothers_count?.toString()??'0', sisters_count:fd.sisters_count?.toString()??'0',
                sibling_position:fd.sibling_position?.toString()??'', has_children:fd.has_children??'',
                child_living_status:fd.child_living_status??'', family_values:fd.family_values??'',
            });
        }
        if (profile.horoscope_detail) {
            const h = profile.horoscope_detail;
            horoscopeForm.reset({birth_place:h.birth_place??'',birth_time:h.birth_time??'',rashi:h.rashi??'',nakshatra:h.nakshatra??'',manglik:h.manglik??false});
        }
        if (profile.partner_preference) {
            const pp = profile.partner_preference;
            preferencesForm.reset({
                age_min:pp.age_min?.toString()??'', age_max:pp.age_max?.toString()??'',
                height_min_cm: resolveHeightOptionValue(pp.height_min_cm?.toString()) ?? pp.height_min_cm?.toString() ?? '',
                height_max_cm: resolveHeightOptionValue(pp.height_max_cm?.toString()) ?? pp.height_max_cm?.toString() ?? '',
                pref_marital_status:pp.marital_status??[], pref_diet:pp.diet??[], pref_education:pp.education??[],
                pref_religion:pp.religion??[], pref_caste:pp.caste?.join(', ')??'',
                pref_profession:pp.profession??[], income_min_bdt:pp.income_min_bdt?.toString()??'',
                income_max_bdt:pp.income_max_bdt?.toString()??'', pref_country:pp.country??[],
                smoking_acceptable:pp.smoking_acceptable??false,
                drinking_acceptable:pp.drinking_acceptable??false,
                // Location hierarchy preferences
                pref_divisions: pp.pref_divisions??[],
                pref_districts: pp.pref_districts??[],
                pref_provinces: pp.pref_provinces??[],
                pref_states: pp.pref_states??[],
                // Extended
                pref_body_type: pp.body_type??[],
                pref_complexion: pp.complexion??[],
                pref_blood_group: pp.blood_group??[],
                pref_mother_tongue: pp.mother_tongue??[],
                pref_manglik_status: pp.manglik_status??[],
                pref_rashi: pp.rashi??[],
                pref_religiousness: pp.religiousness??[],
                pref_pray: pp.pray??[],
                pref_has_children: pp.has_children??'',
                pref_child_living_status: pp.child_living_status??[],
                pref_family_type: pp.family_type??[],
                pref_family_values: pp.family_values??[],
                pref_working_status: pp.working_status??[],
                pref_employed_in: pp.employed_in??[],
                pref_residing_status: pp.pref_residing_status??[],
            });
        }
    },[profile]);

    const coerceNumeric = (data:Record<string,unknown>,keys:string[])=>{
        const out={...data};
        for (const k of keys){if(k in out&&out[k]!==''&&out[k]!=null)out[k]=Number(out[k]);else if(k in out&&out[k]==='')delete out[k];}
        return out;
    };

    const goToNextTab = (currentTab: string) => {
        const idx = PROFILE_EDIT_TABS.indexOf(currentTab as typeof PROFILE_EDIT_TABS[number]);
        if (idx >= 0 && idx < PROFILE_EDIT_TABS.length - 1) {
            setActiveTab(PROFILE_EDIT_TABS[idx + 1]);
        }
    };

    const handleSave = async(data:Record<string,unknown>,tabKey:string)=>{
        let processed={...data};
        for(const k of Object.keys(processed)){if(ENUM_FIELDS.has(k)&&processed[k]==='')delete processed[k];}
        processed = coerceNumeric(processed,['height_cm','weight_kg','annual_income_bdt','family_income_bdt_per_month','brothers_count','sisters_count','sibling_position','experience_years']);
        try {
            await saveMutation.mutateAsync(processed);
            setSavedTab(tabKey); setTimeout(()=>setSavedTab(null),2000);
            showSuccessToast('Profile updated successfully.');
            goToNextTab(tabKey);
        } catch (err: unknown) {
            showErrorToast(getErrorMessage(err), 'Update failed');
        }
    };

    const handleSavePreferences = async(data:PreferencesForm)=>{
        const toArray=(v:string|undefined):string[]|null=>v?v.split(',').map(s=>s.trim()).filter(Boolean):null;
        const toArr=(v:string[]|undefined):string[]|null=>v&&v.length>0?v:null;
        const payload={
            age_min:data.age_min?Number(data.age_min):null, age_max:data.age_max?Number(data.age_max):null,
            height_min_cm:data.height_min_cm?heightGroupMinCm(Number(data.height_min_cm)):null,
            height_max_cm:data.height_max_cm?heightGroupMaxCm(Number(data.height_max_cm)):null,
            marital_status:toArr(data.pref_marital_status), diet:toArr(data.pref_diet), education:toArr(data.pref_education),
            religion:toArr(data.pref_religion), caste:toArray(data.pref_caste), profession:toArr(data.pref_profession),
            country:toArr(data.pref_country),
            // Location hierarchy preferences
            pref_divisions: toArr(data.pref_divisions),
            pref_districts: toArr(data.pref_districts),
            pref_provinces: toArr(data.pref_provinces),
            pref_states: toArr(data.pref_states),
            income_min_bdt:data.income_min_bdt?Number(data.income_min_bdt):null, income_max_bdt:data.income_max_bdt?Number(data.income_max_bdt):null,
            smoking_acceptable:data.smoking_acceptable??false, drinking_acceptable:data.drinking_acceptable??false,
            // Extended
            body_type: toArr(data.pref_body_type),
            complexion: toArr(data.pref_complexion),
            blood_group: toArr(data.pref_blood_group),
            mother_tongue: toArr(data.pref_mother_tongue),
            manglik_status: toArr(data.pref_manglik_status),
            rashi: toArr(data.pref_rashi),
            religiousness: toArr(data.pref_religiousness),
            pray: toArr(data.pref_pray),
            has_children: data.pref_has_children || null,
            child_living_status: toArr(data.pref_child_living_status),
            family_type: toArr(data.pref_family_type),
            family_values: toArr(data.pref_family_values),
            working_status: toArr(data.pref_working_status),
            employed_in: toArr(data.pref_employed_in),
            pref_residing_status: toArr(data.pref_residing_status),
        };
        try {
            await prefMutation.mutateAsync(payload);
            setSavedTab('preferences'); setTimeout(()=>setSavedTab(null),2000);
            showSuccessToast('Preferences updated successfully.');
            goToNextTab('preferences');
        } catch(err:unknown) {
            showErrorToast(getErrorMessage(err), 'Update failed');
            const apiErrors = (err as {response?:{data?:{errors?:Record<string,string[]>}}})?.response?.data?.errors;
            if (apiErrors) {
                const fieldMap: Record<string, keyof PreferencesForm> = {
                    age_min: 'age_min', age_max: 'age_max',
                    height_min_cm: 'height_min_cm', height_max_cm: 'height_max_cm',
                    income_min_bdt: 'income_min_bdt', income_max_bdt: 'income_max_bdt',
                };
                for (const [apiField, formField] of Object.entries(fieldMap)) {
                    if (apiErrors[apiField]?.[0]) {
                        preferencesForm.setError(formField, { type: 'server', message: apiErrors[apiField][0] });
                    }
                }
            }
        }
    };

    const handleChangePassword = async(data:ChangePasswordForm)=>{
        setPwSuccess(false);
        try {
            await changePasswordMutation.mutateAsync(data);
            setPwSuccess(true); changePasswordForm.reset(); setTimeout(()=>setPwSuccess(false),3000);
            showSuccessToast('Password updated successfully.');
        } catch (err: unknown) {
            showErrorToast(getErrorMessage(err), 'Password update failed');
        }
    };

    const handlePhotoUpload = async(e:React.ChangeEvent<HTMLInputElement>)=>{
        const file=e.target.files?.[0]; if(!file) return;
        setUploadingPhoto(true); setPhotoError(null);
        try{await profileService.uploadPhoto(file);invalidateProfileData();}
        catch{setPhotoError('Upload failed. Please try a smaller image (max 5 MB).');}
        finally{setUploadingPhoto(false);if(fileInputRef.current)fileInputRef.current.value='';}
    };
    const handleDeletePhoto=async(id:number)=>{await profileService.deletePhoto(id);invalidateProfileData();};
    const handleSetPrimary=async(id:number)=>{await profileService.setPrimaryPhoto(id);invalidateProfileQueries(queryClient);};

    const dobValue = basicForm.watch('dob');
    const age = useMemo(()=>{
        if (!dobValue) return null;
        const diff=Date.now()-new Date(dobValue).getTime();
        const a=Math.floor(diff/(1000*60*60*24*365.25));
        return isNaN(a)?null:a;
    },[dobValue]);

    if (isLoading) return <div className="max-w-3xl mx-auto"><div className="skeleton-gold h-96"/></div>;
    const photos:ProfilePhoto[]=profile?.photos??[];

    const btnStyle={height:'2.5rem',borderRadius:'0.75rem',padding:'0 1.25rem'};

    return (
        <div className="max-w-4xl mx-auto pb-20 md:pb-6 space-y-5 animate-fade-in">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Edit Profile</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Keep your profile up to date for the best matches</p>
            </div>
            {completionRes && <ProfileCompletionBar status={completionRes}/>}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="overflow-x-auto pb-1 mb-2">
                    <TabsList className="flex min-w-max gap-1 h-auto p-1 rounded-xl bg-muted">
                        {[
                            {value:'basic',label:'Basic Info'},{value:'location',label:'Location'},
                            {value:'religion',label:'Religion'},{value:'career',label:'Career'},
                            {value:'lifestyle',label:'Lifestyle'},{value:'family',label:'Family'},
                            {value:'horoscope',label:'Horoscope'},{value:'photo',label:'Photos'},
                            {value:'preferences',label:'Preferences'},{value:'security',label:'Security'},
                        ].map(tab=>(
                            <TabsTrigger key={tab.value} value={tab.value}
                                className="rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-card data-[state=active]:text-[#1A1208]">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* ── Basic Info ─────────────────────────────────────────── */}
                <TabsContent value="basic">
                    <form onSubmit={basicForm.handleSubmit(d=>handleSave(d,'basic'))} className="card-premium p-6 space-y-5">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Basic Information</h2>
                            <SaveStatus saved={savedTab==='basic'} saving={saveMutation.isPending}/>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Profile Created By" required>
                                <Controller name="profile_created_by" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="pcb" options={profileCreatedByOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Profile Created For" required>
                                <Controller name="profile_created_for" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="pcf" options={profileCreatedForOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Looking For" required>
                                <Controller name="looking_for" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="lf" options={lookingForOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>

                        <hr className="border-border"/>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Full Name" required>
                                <Input placeholder="Your full name" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...basicForm.register('name')}/>
                            </FieldRow>
                            <FieldRow label="Nick Name">
                                <Input placeholder="Optional nickname" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...basicForm.register('nick_name')}/>
                            </FieldRow>
                            <FieldRow label="Date of Birth" required>
                                <Controller name="dob" control={basicForm.control} render={({field})=>(
                                    <DobPicker value={field.value??''} onChange={field.onChange}/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Age">
                                <div className="flex items-center h-[37px] px-3 border border-border rounded-xl bg-input/50 text-sm text-muted-foreground">
                                    {age!=null ? `${age} years old` : 'Auto-calculated from DOB'}
                                </div>
                            </FieldRow>
                        </div>

                        <hr className="border-border"/>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Marital Status" required>
                                <Controller name="marital_status" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="ms" options={maritalStatusOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>

                        <hr className="border-border"/>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Height" required>
                                <Controller name="height_cm" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="ht" options={heightOptions} value={resolveHeightOptionValue(field.value) ?? field.value ?? ''} onChange={v=>field.onChange(v??'')} placeholder="Select height…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Weight">
                                <Controller name="weight_kg" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="wt" options={weightOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select weight…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Body Type" required>
                                <Controller name="body_type" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="bt" options={bodyTypeOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Complexion" required>
                                <Controller name="complexion" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="cx" options={complexionOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Eyes">
                                <Controller name="eye_color" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="ec" options={eyeColorOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select eye color…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Hair">
                                <Controller name="hair_color" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="hc2" options={hairColorOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select hair color…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Blood Group">
                                <Controller name="blood_group" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="bg" options={bloodGroupOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Any Disability" required>
                                <Controller name="disability" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="dis" options={disabilityOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Mother Tongue" required>
                                <Controller name="mother_tongue" control={basicForm.control} render={({field})=>(
                                    <SearchableSelect id="mt" options={motherTongueOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Search language…"/>
                                )}/>
                            </FieldRow>
                        </div>

                        <hr className="border-border"/>

                        <FieldRow label="My Details / About Me" required hint="Min. 50 characters for full profile score">
                            <Textarea rows={4} placeholder="Tell potential matches about yourself…"
                                className="resize-none border-border bg-input focus-visible:ring-ring focus-visible:border-primary"
                                {...basicForm.register('about_me')}/>
                        </FieldRow>
                        <FieldRow label="What I Am Looking For" required>
                            <Textarea rows={3} placeholder="Describe the qualities you're looking for in a partner…"
                                className="resize-none border-border bg-input focus-visible:ring-ring focus-visible:border-primary"
                                {...basicForm.register('what_looking_for')}/>
                        </FieldRow>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Location ──────────────────────────────────────────────── */}
                <TabsContent value="location">
                    <form onSubmit={locationForm.handleSubmit(d=>handleSave(d,'location'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Location Details</h2>
                            <SaveStatus saved={savedTab==='location'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {/* Nationality retired — restore useSelectOptions + seeder blocks to bring back
                            <FieldRow label="Nationality" required>
                                <Controller name="nationality" control={locationForm.control} render={({field})=>(
                                    <SearchableSelect id="nat" options={nationalityOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Search nationality…"/>
                                )}/>
                            </FieldRow>
                            */}
                            <FieldRow label="Country Living In" required>
                                <Controller name="country" control={locationForm.control} render={({field})=>(
                                    <SearchableSelect id="cnt" options={countryOptions} value={field.value} onChange={v=>{field.onChange(v??'');clearLocationFields(locationForm.setValue);}} placeholder="Search country…"/>
                                )}/>
                            </FieldRow>
                            {locationLevel2Opts.length > 0 && level2FormField && (
                                <FieldRow label={level2Label} required>
                                    <Controller name={level2FormField} control={locationForm.control} render={({field})=>(
                                        <SearchableSelect
                                            id="loc-l2"
                                            options={locationLevel2Opts}
                                            value={field.value}
                                            onChange={v=>{
                                                field.onChange(v??'');
                                                clearDeeperLocationFields(locationMeta, 2, locationForm.setValue);
                                            }}
                                            placeholder={`Select ${level2Label.toLowerCase()}…`}
                                        />
                                    )}/>
                                </FieldRow>
                            )}
                            {locationLevel3Opts.length > 0 && level3FormField && (
                                <FieldRow label={level3Label}>
                                    <Controller name={level3FormField} control={locationForm.control} render={({field})=>(
                                        <SearchableSelect
                                            id="loc-l3"
                                            options={locationLevel3Opts}
                                            value={field.value}
                                            onChange={v=>{
                                                field.onChange(v??'');
                                                clearDeeperLocationFields(locationMeta, 3, locationForm.setValue);
                                            }}
                                            placeholder={`Select ${level3Label.toLowerCase()}…`}
                                        />
                                    )}/>
                                </FieldRow>
                            )}
                            {locationLevel4Opts.length > 0 && level4FormField && (
                                <FieldRow label={level4Label}>
                                    <Controller name={level4FormField} control={locationForm.control} render={({field})=>(
                                        <SearchableSelect id="loc-l4" options={locationLevel4Opts} value={field.value} onChange={v=>field.onChange(v??'')} placeholder={`Select ${level4Label.toLowerCase()}…`}/>
                                    )}/>
                                </FieldRow>
                            )}
                            {locationLevel2Opts.length === 0 && (
                                <>
                                    {/*<FieldRow label="City" required>*/}
                                    {/*    <Input placeholder="e.g. London" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...locationForm.register('city')}/>*/}
                                    {/*</FieldRow>*/}
                                    <FieldRow label="State / Province" required>
                                        <Input placeholder="e.g. England" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...locationForm.register('state')}/>
                                    </FieldRow>
                                </>
                            )}
                            <FieldRow label="Postal / Zip Code" required>
                                <Input placeholder="e.g. 1215" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...locationForm.register('postal_code')}/>
                            </FieldRow>
                            <FieldRow label="Residing Status" required>
                                <Controller name="residing_status" control={locationForm.control} render={({field})=>(
                                    <SearchableSelect id="rs" options={residingStatusOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Religion ──────────────────────────────────────────────── */}
                <TabsContent value="religion">
                    <form onSubmit={religiousForm.handleSubmit(d=>handleSave(d,'religion'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Religious Background</h2>
                            <SaveStatus saved={savedTab==='religion'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Religion" required>
                                <Controller name="religion" control={religiousForm.control} render={({field})=>(
                                    <SearchableSelect id="rel" options={religionOptions} value={field.value} onChange={v=>{field.onChange(v??'');religiousForm.setValue('caste','');}} placeholder="Select religion…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Caste" required>
                                <Controller name="caste" control={religiousForm.control} render={({field})=>(
                                    <SearchableSelect id="cst" options={casteOpts} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select caste…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Sub Caste">
                                <Input placeholder="Optional" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...religiousForm.register('sub_caste')}/>
                            </FieldRow>
                            <FieldRow label="Religiousness">
                                <Controller name="religiousness" control={religiousForm.control} render={({field})=>(
                                    <SearchableSelect id="rns" options={religiousnessOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Pray">
                                <Controller name="pray" control={religiousForm.control} render={({field})=>(
                                    <SearchableSelect id="prv" options={prayOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Manglik Status">
                                <Controller name="manglik_status" control={religiousForm.control} render={({field})=>(
                                    <SearchableSelect id="mst" options={manglikStatusOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>Save Changes</Button>
                    </form>
                </TabsContent>

                {/* ── Career ────────────────────────────────────────────────── */}
                <TabsContent value="career">
                    <form onSubmit={educationForm.handleSubmit(d=>handleSave(d,'career'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Education &amp; Career</h2>
                            <SaveStatus saved={savedTab==='career'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Education Level" required>
                                <Controller name="highest_education" control={educationForm.control} render={({field})=>(
                                    <SearchableSelect id="he" options={educationLevelOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select education…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Institution Name &amp; Year">
                                <Input placeholder="e.g. Dhaka University, 2018" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('institution_name_year')}/>
                            </FieldRow>
                            <FieldRow label="College / University">
                                <Input placeholder="University or college name" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('college_university')}/>
                            </FieldRow>
                            <FieldRow label="Employer / Institution Name">
                                <Input placeholder="Current employer or institution" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('employer_name')}/>
                            </FieldRow>
                            <FieldRow label="Profession" required>
                                <Controller name="profession" control={educationForm.control} render={({field})=>(
                                    <SearchableSelect id="prf" options={professionOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Search profession…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Working As / Designation">
                                <Input placeholder="e.g. Senior Software Engineer" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('designation')}/>
                            </FieldRow>
                            <FieldRow label="Job Location">
                                <Input placeholder="e.g. Dhaka, Bangladesh" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('job_location')}/>
                            </FieldRow>
                            <FieldRow label="Experience">
                                <Controller name="experience_years" control={educationForm.control} render={({field})=>(
                                    <SearchableSelect id="exp" options={experienceOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select years…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Employed In">
                                <Controller name="employed_in" control={educationForm.control} render={({field})=>(
                                    <SearchableSelect id="ei" options={employedInOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Annual Income (BDT)">
                                <Input type="number" placeholder="e.g. 600000" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...educationForm.register('annual_income_bdt')}/>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>Save Changes</Button>
                    </form>
                </TabsContent>

                {/* ── Lifestyle ─────────────────────────────────────────────── */}
                <TabsContent value="lifestyle">
                    <form onSubmit={lifestyleForm.handleSubmit(d=>handleSave(d,'lifestyle'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Lifestyle</h2>
                            <SaveStatus saved={savedTab==='lifestyle'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Diet" required>
                                <Controller name="diet" control={lifestyleForm.control} render={({field})=>(
                                    <SearchableSelect id="dt" options={dietOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Smoke" required>
                                <Controller name="smoking" control={lifestyleForm.control} render={({field})=>(
                                    <SearchableSelect id="smk" options={smokingOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Drink" required>
                                <Controller name="drinking" control={lifestyleForm.control} render={({field})=>(
                                    <SearchableSelect id="drk" options={drinkingOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Eye-Wear" required>
                                <Controller name="eye_wear" control={lifestyleForm.control} render={({field})=>(
                                    <SearchableSelect id="ew" options={eyeWearOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>
                        <FieldRow label="Hobbies / Interests">
                            <Controller name="hobbies" control={lifestyleForm.control} render={({field})=>(
                                <MultiSearchableSelect id="hob" options={hobbiesOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select hobbies…"/>
                            )}/>
                        </FieldRow>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>Save Changes</Button>
                    </form>
                </TabsContent>

                {/* ── Family ────────────────────────────────────────────────── */}
                <TabsContent value="family">
                    <form onSubmit={familyForm.handleSubmit(d=>handleSave(d,'family'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-semibold text-foreground">Family Details</h2>
                            <SaveStatus saved={savedTab==='family'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Family Type">
                                <Controller name="family_type" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="ft" options={familyTypeOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Family Status">
                                <Controller name="family_status" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="fst" options={familyStatusOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Family Values" required>
                                <Controller name="family_values" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="fv" options={familyValuesOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Monthly Family Income (BDT)">
                                <Input type="number" placeholder="e.g. 80000" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...familyForm.register('family_income_bdt_per_month')}/>
                            </FieldRow>
                            <FieldRow label="Father's Occupation">
                                <Controller name="father_occupation" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="fo" options={occupationOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Search occupation…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Mother's Occupation">
                                <Controller name="mother_occupation" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="mo" options={occupationOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Search occupation…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Brother(s)" required>
                                <Controller name="brothers_count" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="br" options={siblingCountOptions} value={field.value} onChange={v=>field.onChange(v??'0')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Sister(s)" required>
                                <Controller name="sisters_count" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="sr" options={siblingCountOptions} value={field.value} onChange={v=>field.onChange(v??'0')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Position Among Siblings">
                                <Controller name="sibling_position" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="sp" options={siblingPositionOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select position…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Have Children">
                                <Controller name="has_children" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="hc3" options={haveChildrenOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                            <FieldRow label="Child Living Status">
                                <Controller name="child_living_status" control={familyForm.control} render={({field})=>(
                                    <SearchableSelect id="cls2" options={childLivingStatusOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Select…"/>
                                )}/>
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Horoscope ─────────────────────────────────────────────── */}
                <TabsContent value="horoscope">
                    <form onSubmit={horoscopeForm.handleSubmit(d=>handleSave(d,'horoscope'))} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="font-semibold text-foreground">Horoscope Details</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Filling at least one field here completes this section (5%).</p>
                            </div>
                            <SaveStatus saved={savedTab==='horoscope'} saving={saveMutation.isPending}/>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FieldRow label="Birth Place"><Input placeholder="e.g. Dhaka" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...horoscopeForm.register('birth_place')}/></FieldRow>
                            <FieldRow label="Birth Time"><Input type="time" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...horoscopeForm.register('birth_time')}/></FieldRow>
                            <FieldRow label="Rashi (Moon Sign)"><Input placeholder="e.g. Aries, Taurus" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...horoscopeForm.register('rashi')}/></FieldRow>
                            <FieldRow label="Nakshatra"><Input placeholder="e.g. Ashwini" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...horoscopeForm.register('nakshatra')}/></FieldRow>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-primary" {...horoscopeForm.register('manglik')}/>
                            <span className="text-sm text-foreground">Manglik</span>
                        </label>
                        <Button type="submit" disabled={saveMutation.isPending} className="btn-gold" style={btnStyle}>
                            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Photos ────────────────────────────────────────────────── */}
                <TabsContent value="photo">
                    <div className="card-premium p-6 space-y-5">
                        <div>
                            <h2 className="font-semibold text-foreground">Profile Photos</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">Upload clear, recent photos. Hover a photo to set it as primary or delete it.</p>
                        </div>
                        <div>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload}/>
                            <Button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploadingPhoto} className="btn-gold" style={btnStyle}>
                                {uploadingPhoto ? 'Uploading…' : '+ Upload Photo'}
                            </Button>
                            {photoError && <p className="text-xs text-red-500 mt-2">{photoError}</p>}
                        </div>
                        {photos.length>0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {photos.map(photo=>(
                                    <div key={photo.id} className="relative group rounded-xl overflow-hidden profile-photo-border">
                                        <img src={resolveProfilePhotoUrl(photo) ?? ''} alt="Profile photo" className="w-full aspect-square object-cover"/>
                                        {photo.is_primary && <span className="absolute top-2 left-2 bg-[#FFCF00] text-[#1A1208] text-[10px] font-bold px-2 py-0.5 rounded-full">Primary</span>}
                                        {photo.moderation_status==='pending' && <span className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Pending</span>}
                                        {photo.moderation_status==='rejected' && <span className="absolute top-2 right-2 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Rejected</span>}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end gap-1 pb-2">
                                             {!photo.is_primary && <button onClick={()=>handleSetPrimary(photo.id)} className="text-[#1A1208] text-xs bg-[#FFCF00] rounded-full px-2.5 py-1 hover:bg-[#E6BA00] transition-colors text-[11px]">Primary</button>}
                                             <button onClick={()=>handleDeletePhoto(photo.id)} className="text-white text-xs bg-red-500 rounded-full px-2.5 py-1 hover:bg-red-600 transition-colors text-[11px]">Delete</button>
                                         </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
                                </svg>
                                <p className="text-meta font-medium text-sm">No photos yet</p>
                                <p className="text-xs text-[#4A3F2E] mt-1">Upload your first photo to attract more matches</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ── Partner Preferences ───────────────────────────────────── */}
                <TabsContent value="preferences">
                    <form onSubmit={preferencesForm.handleSubmit(handleSavePreferences)} className="card-premium p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold text-foreground">Partner Preferences</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">The more specific you are, the better your matches.</p>
                            </div>
                            <SaveStatus saved={savedTab==='preferences'} saving={prefMutation.isPending}/>
                        </div>

                        {/* ── Basic Range ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Age, Height &amp; Income</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Age Range">
                                    <div className="flex gap-2 items-center min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <Controller name="age_min" control={preferencesForm.control} render={({ field }) => (
                                                <SearchableSelect
                                                    id="pref-age-min"
                                                    options={ageOptions}
                                                    value={field.value || undefined}
                                                    onChange={v => field.onChange(v ?? '')}
                                                    placeholder="Min"
                                                    compact
                                                />
                                            )} />
                                        </div>
                                        <span className="text-muted-foreground text-sm shrink-0">–</span>
                                        <div className="min-w-0 flex-1">
                                            <Controller name="age_max" control={preferencesForm.control} render={({ field }) => (
                                                <SearchableSelect
                                                    id="pref-age-max"
                                                    options={ageOptions}
                                                    value={field.value || undefined}
                                                    onChange={v => field.onChange(v ?? '')}
                                                    placeholder="Max"
                                                    compact
                                                />
                                            )} />
                                        </div>
                                    </div>
                                    {preferencesForm.formState.errors.age_min && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.age_min.message}</p>}
                                    {preferencesForm.formState.errors.age_max && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.age_max.message}</p>}
                                </FieldRow>
                                <FieldRow label={'Height Range (ft & in)'}>
                                    <div className="flex gap-2 items-center min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <Controller name="height_min_cm" control={preferencesForm.control} render={({ field }) => (
                                                <SearchableSelect
                                                    id="pref-ht-min"
                                                    options={heightOptions}
                                                    value={resolveHeightOptionValue(field.value) ?? field.value ?? undefined}
                                                    onChange={v => field.onChange(v ?? '')}
                                                    placeholder="Min"
                                                    compact
                                                />
                                            )} />
                                        </div>
                                        <span className="text-muted-foreground text-sm shrink-0">–</span>
                                        <div className="min-w-0 flex-1">
                                            <Controller name="height_max_cm" control={preferencesForm.control} render={({ field }) => (
                                                <SearchableSelect
                                                    id="pref-ht-max"
                                                    options={heightOptions}
                                                    value={resolveHeightOptionValue(field.value) ?? field.value ?? undefined}
                                                    onChange={v => field.onChange(v ?? '')}
                                                    placeholder="Max"
                                                    compact
                                                />
                                            )} />
                                        </div>
                                    </div>
                                    {preferencesForm.formState.errors.height_min_cm && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.height_min_cm.message}</p>}
                                    {preferencesForm.formState.errors.height_max_cm && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.height_max_cm.message}</p>}
                                </FieldRow>
                                <FieldRow label="Annual Income (BDT)">
                                    <div className="flex gap-2 items-center">
                                        <Input type="number" placeholder="Min" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...preferencesForm.register('income_min_bdt')}/>
                                        <span className="text-muted-foreground text-sm">–</span>
                                        <Input type="number" placeholder="Max" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...preferencesForm.register('income_max_bdt')}/>
                                    </div>
                                    {preferencesForm.formState.errors.income_min_bdt && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.income_min_bdt.message}</p>}
                                    {preferencesForm.formState.errors.income_max_bdt && <p className="text-xs text-red-500 mt-1">{preferencesForm.formState.errors.income_max_bdt.message}</p>}
                                </FieldRow>
                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Physical ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Physical Appearance</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Body Type">
                                    <Controller name="pref_body_type" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pbt" options={bodyTypeOptions} value={field.value??[]} onChange={field.onChange} placeholder="Any body type…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Complexion">
                                    <Controller name="pref_complexion" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pcx" options={complexionOptions} value={field.value??[]} onChange={field.onChange} placeholder="Any complexion…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Blood Group">
                                    <Controller name="pref_blood_group" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pbg" options={bloodGroupOptions} value={field.value??[]} onChange={field.onChange} placeholder="Any blood group…"/>
                                    )}/>
                                </FieldRow>
                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Religion & Spirituality ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Religion &amp; Spirituality</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Religion">
                                    <Controller name="pref_religion" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pr" options={religionOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select religions…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Caste" hint="Comma-separated e.g. Sunni, Brahmin">
                                    <Input placeholder="Sunni, Brahmin" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...preferencesForm.register('pref_caste')}/>
                                </FieldRow>
                                <FieldRow label="Religiousness">
                                    <Controller name="pref_religiousness" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="prns" options={religiousnessOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Religious, Moderate…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Prayer Frequency">
                                    <Controller name="pref_pray" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pprv" options={prayOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Always, Usually…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Manglik Status">
                                    <Controller name="pref_manglik_status" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pmst" options={manglikStatusOptions} value={field.value??[]} onChange={field.onChange} placeholder="Any manglik status…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Rashi / Zodiac Sign">
                                    <Controller name="pref_rashi" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="prsh" options={rashiOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Aries, Leo…"/>
                                    )}/>
                                </FieldRow>
                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Family ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Family</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Family Type">
                                    <Controller name="pref_family_type" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pft" options={familyTypeOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Nuclear, Joint…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Family Values">
                                    <Controller name="pref_family_values" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pfv" options={familyValuesOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Traditional, Moderate…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Has Children">
                                    <Controller name="pref_has_children" control={preferencesForm.control} render={({field})=>(
                                        <SearchableSelect id="phch" options={prefHasChildrenOptions} value={field.value} onChange={v=>field.onChange(v??'')} placeholder="Any / select…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Child Living Status">
                                    <Controller name="pref_child_living_status" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pcls" options={childLivingStatusOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select…"/>
                                    )}/>
                                </FieldRow>
                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Career & Employment ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Career &amp; Employment</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Working Status">
                                    <Controller name="pref_working_status" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pws" options={workingStatusOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Working, Student…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Employed In">
                                    <Controller name="pref_employed_in" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pei" options={employedInOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Government, Private…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Profession">
                                    <Controller name="pref_profession" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="ppr" options={professionOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select professions…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Minimum Education Level">
                                    <Controller name="pref_education" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="ped" options={educationLevelOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select education levels…"/>
                                    )}/>
                                </FieldRow>
                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Location & Identity ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Location &amp; Identity</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Mother Tongue">
                                    <Controller name="pref_mother_tongue" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pmt" options={motherTongueOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Bengali, Urdu…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Residing Status">
                                    <Controller name="pref_residing_status" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="prst" options={residingStatusOptions} value={field.value??[]} onChange={field.onChange} placeholder="e.g. Citizen, PR…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Country">
                                    <Controller name="pref_country" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pct" options={countryOptions} value={field.value??[]} onChange={v=>{field.onChange(v);preferencesForm.setValue('pref_divisions',[]);preferencesForm.setValue('pref_districts',[]);preferencesForm.setValue('pref_provinces',[]);preferencesForm.setValue('pref_states',[]);}} placeholder="Select countries…"/>
                                    )}/>
                                </FieldRow>

                                {/* ── Bangladesh Divisions & Districts ── */}
                                {isBangladeshSelected && (
                                    <>
                                        <FieldRow label="Division (Bangladesh)">
                                            <Controller name="pref_divisions" control={preferencesForm.control} render={({field})=>(
                                                <MultiSearchableSelect id="pdiv" options={prefDivisionOpts} value={field.value??[]} onChange={(v)=>{field.onChange(v);preferencesForm.setValue('pref_districts',[]);}} placeholder="Select divisions…"/>
                                            )}/>
                                        </FieldRow>
                                        {selectedPrefDivisionIds.length > 0 && (
                                            <FieldRow label="District / City (Bangladesh)">
                                                <Controller name="pref_districts" control={preferencesForm.control} render={({field})=>(
                                                    <MultiSearchableSelect id="pdist" options={prefDistrictOpts} value={field.value??[]} onChange={field.onChange} placeholder="Select districts / cities…"/>
                                                )}/>
                                            </FieldRow>
                                        )}
                                    </>
                                )}

                                {/* ── Canada Provinces ── */}
                                {isCanadaSelected && (
                                    <FieldRow label="Provinces / Territories (Canada)">
                                        <Controller name="pref_provinces" control={preferencesForm.control} render={({field})=>(
                                            <MultiSearchableSelect id="pprov" options={prefProvinceOpts} value={field.value??[]} onChange={field.onChange} placeholder="Select provinces…"/>
                                        )}/>
                                    </FieldRow>
                                )}

                                {/* ── USA States ── */}
                                {isUsaSelected && (
                                    <FieldRow label="States (USA)">
                                        <Controller name="pref_states" control={preferencesForm.control} render={({field})=>(
                                            <MultiSearchableSelect id="pst" options={prefStateOpts} value={field.value??[]} onChange={field.onChange} placeholder="Select states…"/>
                                        )}/>
                                    </FieldRow>
                                )}

                            </div>
                        </div>

                        <hr className="border-border"/>

                        {/* ── Lifestyle ── */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lifestyle &amp; More</p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <FieldRow label="Marital Status">
                                    <Controller name="pref_marital_status" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pms" options={maritalStatusOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select marital status…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Diet">
                                    <Controller name="pref_diet" control={preferencesForm.control} render={({field})=>(
                                        <MultiSearchableSelect id="pdt" options={dietOptions} value={field.value??[]} onChange={field.onChange} placeholder="Select diet preferences…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Smoking Acceptable">
                                    <Controller name="smoking_acceptable" control={preferencesForm.control} render={({field})=>(
                                        <SearchableSelect id="psmk" isClearable={false} options={[{value:'true',label:'Yes, acceptable'},{value:'false',label:'No, not acceptable'}]} value={field.value===true?'true':field.value===false?'false':''} onChange={v=>field.onChange(v==='true')} placeholder="Select…"/>
                                    )}/>
                                </FieldRow>
                                <FieldRow label="Drinking Acceptable">
                                    <Controller name="drinking_acceptable" control={preferencesForm.control} render={({field})=>(
                                        <SearchableSelect id="pdrk" isClearable={false} options={[{value:'true',label:'Yes, acceptable'},{value:'false',label:'No, not acceptable'}]} value={field.value===true?'true':field.value===false?'false':''} onChange={v=>field.onChange(v==='true')} placeholder="Select…"/>
                                    )}/>
                                </FieldRow>
                            </div>
                        </div>

                        <Button type="submit" disabled={prefMutation.isPending} className="btn-gold" style={btnStyle}>
                            {prefMutation.isPending ? 'Saving…' : 'Save Preferences'}
                        </Button>
                    </form>
                </TabsContent>

                {/* ── Security ──────────────────────────────────────────────── */}
                <TabsContent value="security">
                    <form onSubmit={changePasswordForm.handleSubmit(handleChangePassword)} className="card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="font-semibold text-foreground">Change Password</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Choose a strong password of at least 8 characters.</p>
                            </div>
                            {pwSuccess && <span className="text-xs text-green-600 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Password updated</span>}
                        </div>
                        {changePasswordMutation.isError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                                {(changePasswordMutation.error as {response?:{data?:{message?:string}}})?.response?.data?.message ?? 'Something went wrong. Please try again.'}
                            </div>
                        )}
                        <div className="space-y-4 max-w-md">
                            <FieldRow label="Current Password">
                                <Input type="password" placeholder="Enter your current password" autoComplete="current-password" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...changePasswordForm.register('current_password')}/>
                                {changePasswordForm.formState.errors.current_password && <p className="text-xs text-red-500 mt-1">{changePasswordForm.formState.errors.current_password.message}</p>}
                            </FieldRow>
                            <FieldRow label="New Password">
                                <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...changePasswordForm.register('new_password')}/>
                                {changePasswordForm.formState.errors.new_password && <p className="text-xs text-red-500 mt-1">{changePasswordForm.formState.errors.new_password.message}</p>}
                            </FieldRow>
                            <FieldRow label="Confirm New Password">
                                <Input type="password" placeholder="Repeat new password" autoComplete="new-password" className="border-border bg-input focus-visible:ring-ring focus-visible:border-primary" {...changePasswordForm.register('new_password_confirmation')}/>
                                {changePasswordForm.formState.errors.new_password_confirmation && <p className="text-xs text-red-500 mt-1">{changePasswordForm.formState.errors.new_password_confirmation.message}</p>}
                            </FieldRow>
                        </div>
                        <Button type="submit" disabled={changePasswordMutation.isPending} className="btn-gold" style={btnStyle}>
                            {changePasswordMutation.isPending ? 'Updating…' : 'Update Password'}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function ProfileEditPage() {
    return (
        <Suspense fallback={<div className="max-w-3xl mx-auto"><div className="skeleton-gold h-96"/></div>}>
            <ProfileEditInner/>
        </Suspense>
    );
}
