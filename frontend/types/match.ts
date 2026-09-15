import type {ProfileCard} from './profile';

export interface ScoreBreakdown {
    religion: number;
    age: number;
    location: number;
    education: number;
    income: number;
    marital_status: number;
    diet: number;
    height: number;
    lifestyle: number;
}

export interface MatchScore {
    id: number;
    score: number;
    score_breakdown: ScoreBreakdown;
    calculated_at: string;
    candidate: ProfileCard;
}

export interface SearchFilters {
    // Basic
    gender?: 'male' | 'female';
    age_min?: number;
    age_max?: number;
    // Physical
    height_min?: number;
    height_max?: number;
    body_type?: string;
    complexion?: string;
    blood_group?: string;
    // Religion
    religion?: string;
    caste?: string;
    // Family / life
    marital_status?: string;
    has_children?: string;
    mother_tongue?: string;
    // Education / career
    education?: string;
    profession?: string;
    employed_in?: string;
    income_min?: number;
    income_max?: number;
    // Location
    country?: string;
    state?: string;
    city?: string;
    upazila?: string;
    nationality?: string;
    residing_status?: string;
    // Lifestyle
    diet?: string;
    smoking?: string;
    drinking?: string;
    // Direct lookup
    profile_id?: string;
    // Global search
    query?: string;
    // Sort & pagination
    sort?: 'latest' | 'age_asc' | 'age_desc' | 'completion';
    page?: number;
}

