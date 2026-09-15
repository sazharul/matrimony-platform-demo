export interface ProfileData {
    profile_id: string;
    nick_name: string | null;
    profile_created_for: 'self' | 'son' | 'daughter' | 'brother' | 'sister' | 'relative' | null;
    looking_for: 'bride' | 'groom' | null;
    dob: string | null;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    body_type: 'slim' | 'average' | 'athletic' | 'heavy' | null;
    eye_color: string | null;
    hair_color: string | null;
    complexion: 'very_fair' | 'fair' | 'wheatish' | 'dark' | null;
    blood_group: string | null;
    marital_status: 'never_married' | 'divorced' | 'widowed' | 'separated' | null;
    disability: string | null;
    mother_tongue: string | null;
    nationality: string | null;
    country: string | null;
    state: string | null;
    city: string | null;
    upazila: string | null;
    postal_code: string | null;
    residing_status: 'citizen' | 'permanent_resident' | 'work_permit' | 'student_visa' | 'visitor_visa' | 'refugee' | 'other' | null;
    about_me: string | null;
    what_looking_for: string | null;
    profile_completion_percentage: number;
    is_verified: boolean;
    is_photo_approved: boolean;
    last_seen_at: string | null;
    privacy_settings: PrivacySettings | null;
}

export interface PrivacySettings {
    show_photo_to: 'all' | 'connections_only' | 'none';
    show_phone_to: 'connections_only' | 'none';
    show_email_to: 'none';
    hide_profile_from: number[];
    show_online_status: boolean;
}

export interface ReligiousDetail {
    religion: string | null;
    caste: string | null;
    sub_caste: string | null;
    gotra: string | null;
    manglik_status: 'yes' | 'no' | 'partial' | 'dont_know' | null;
    religiousness: 'very_religious' | 'religious' | 'moderate' | 'not_religious' | null;
    pray: 'always' | 'usually' | 'sometimes' | 'rarely' | 'never' | null;
}

export interface FamilyDetail {
    family_type: 'joint' | 'nuclear' | 'extended' | null;
    family_status: 'middle_class' | 'upper_middle_class' | 'rich' | 'affluent' | null;
    family_income_bdt_per_month: number | null;
    father_occupation: string | null;
    mother_occupation: string | null;
    brothers_count: number;
    sisters_count: number;
    has_children: 'no' | 'yes' | null;
    child_living_status: string | null;
    family_values: 'traditional' | 'moderate' | 'liberal' | 'religious' | null;
    sibling_position: number | null;
}

export interface EducationCareer {
    highest_education: string | null;
    college_university: string | null;
    institution_name_year: string | null;
    employer_name: string | null;
    job_location: string | null;
    designation: string | null;
    experience_years: number | null;
    profession: string | null;
    employed_in: 'private' | 'government' | 'business' | 'self_employed' | 'not_working' | null;
    annual_income_bdt: number | null;
}

export interface Lifestyle {
    diet: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain' | null;
    smoking: 'non_smoker' | 'smoker' | 'occasionally' | null;
    drinking: 'non_drinker' | 'drinker' | 'occasionally' | null;
    eye_wear: 'none' | 'glasses' | 'contact_lens' | null;
    hobbies: string[] | null;
    languages_known: string[];
}

export interface HoroscopeDetail {
    birth_place: string | null;
    birth_time: string | null;
    rashi: string | null;
    nakshatra: string | null;
    manglik: boolean | null;
}

export interface PartnerPreference {
    age_min: number | null;
    age_max: number | null;
    height_min_cm: number | null;
    height_max_cm: number | null;
    marital_status: string[] | null;
    religion: string[] | null;
    caste: string[] | null;
    education: string[] | null;
    profession: string[] | null;
    income_min_bdt: number | null;
    income_max_bdt: number | null;
    country: string[] | null;
    // Location hierarchy preferences
    pref_divisions: string[] | null;
    pref_districts: string[] | null;
    pref_provinces: string[] | null;
    pref_states: string[] | null;
    diet: string[] | null;
    smoking_acceptable: boolean;
    drinking_acceptable: boolean;
    // Extended preference fields
    body_type: string[] | null;
    complexion: string[] | null;
    blood_group: string[] | null;
    mother_tongue: string[] | null;
    manglik_status: string[] | null;
    rashi: string[] | null;
    religiousness: string[] | null;
    pray: string[] | null;
    has_children: 'no' | 'yes' | 'any' | null;
    child_living_status: string[] | null;
    family_type: string[] | null;
    family_values: string[] | null;
    working_status: string[] | null;
    employed_in: string[] | null;
    pref_residing_status: string[] | null;
}

export interface ProfilePhoto {
    id: number;
    file_path: string;
    url?: string | null;
    is_primary: boolean;
    is_approved: boolean;
    is_private: boolean;
    moderation_status: 'pending' | 'approved' | 'rejected';
}

export interface ProfileCard {
    id: number;
    name: string;
    gender: 'male' | 'female';
    subscription_plan: string;
    profile: {
        profile_id: string;
        dob: string | null;
        age: number | null;
        height_cm: number | null;
        marital_status: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        is_verified: boolean;
        last_seen_at: string | null;
        profile_completion_percentage: number;
    } | null;
    religion: string | null;
    caste: string | null;
    education: string | null;
    profession: string | null;
    diet: string | null;
    primary_photo: string | null;
    face_scan_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
    is_shortlisted?: boolean;
    connection_status?: 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';
    is_interest_sender?: boolean;
    can_send_interest?: boolean;
    interest_id?: number | null;
    conversation_id?: number | null;
    compatibility_score?: CompatibilityScoreData | null;
}

export interface ProfileViewUsage {
    limit: number;
    used: number;
    unlimited: boolean;
    remaining: number | null;
}

export interface ProfileAccess {
    full_profile: boolean;
    profile_views_per_day: ProfileViewUsage;
}

export interface CompatibilityScoreData {
    score: number;
    score_breakdown?: Record<string, unknown> | null;
    calculated_at?: string | null;
}

export interface FullProfile {
    id: number;
    name: string;
    gender: 'male' | 'female';
    profile_created_by?: string | null;
    profile: ProfileData | null;
    religious_detail: ReligiousDetail | null;
    family_detail: FamilyDetail | null;
    education_career: EducationCareer | null;
    lifestyle: Lifestyle | null;
    horoscope_detail: HoroscopeDetail | null;
    partner_preference: PartnerPreference | null;
    photos: ProfilePhoto[];
    primary_photo?: string | null;
    face_scan_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
    access?: ProfileAccess;
    connection_status?: 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';
    interest_id?: number | null;
    is_interest_sender?: boolean;
    can_send_interest?: boolean;
    is_shortlisted?: boolean;
    compatibility_score?: CompatibilityScoreData | null;
}

export interface ShortlistItem {
    id: number;
    created_at: string;
    connection_status: 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';
    interest_id: number | null;
    is_interest_sender: boolean;
    conversation_id: number | null;
    send_count?: number;
    can_send_interest?: boolean;
    user: ProfileCard;
}

export interface ProfileView {
    viewer_id: number;
    viewed_at: string;
    connection_status: 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';
    interest_id: number | null;
    is_interest_sender: boolean;
    conversation_id: number | null;
    send_count?: number;
    can_send_interest?: boolean;
    viewer: ProfileCard;
}
