import api from '@/lib/api';
import type { ApiResponse } from '@/types/user';
import type { MatchScore } from '@/types/match';

export interface DashboardCompletion {
    percentage: number;
    has_basic_info: boolean;
    has_religious_detail: boolean;
    has_family_detail: boolean;
    has_education: boolean;
    has_lifestyle: boolean;
    has_horoscope: boolean;
    has_preferences: boolean;
    has_photo: boolean;
    has_about_me: boolean;
}

export interface DashboardStats {
    pending_interests: number;
    total_matches: number;
    profile_viewers: number | null;
    profile_viewers_locked: boolean;
    shortlist_count: number;
    contacts_count: number;
}

export interface DashboardSummary {
    completion: DashboardCompletion;
    stats: DashboardStats;
    matches: MatchScore[];
    matches_total: number;
}

export const dashboardService = {
    getSummary: () =>
        api.get<ApiResponse<DashboardSummary>>('/dashboard'),
};
