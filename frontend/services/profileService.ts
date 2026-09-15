import api from '@/lib/api';
import type {ApiResponse, PaginatedResponse} from '@/types/user';
import type {FullProfile, PartnerPreference} from '@/types/profile';
import type {MatchScore, SearchFilters} from '@/types/match';
import type {ProfileCard} from '@/types/profile';
import type { ProfileView } from '@/types/profile';

export const profileService = {
    getMyProfile: () =>
        api.get<ApiResponse<FullProfile>>('/profile'),

    updateProfile: (data: Partial<FullProfile>) =>
        api.put<ApiResponse<FullProfile>>('/profile', data),

    getProfileById: (profileId: string) =>
        api.get<ApiResponse<FullProfile>>(`/profile/${profileId}`),

    updatePreferences: (data: Partial<PartnerPreference> | Record<string, unknown>) =>
        api.put<ApiResponse<PartnerPreference>>('/preferences', data),

    getCompletionStatus: () =>
        api.get<ApiResponse<{
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
        }>>('/profile/completion'),

    uploadPhoto: (file: File, isPrivate?: boolean) => {
        const form = new FormData();
        form.append('photo', file);
        if (isPrivate) form.append('is_private', '1');
        // Axios v1.x converts FormData to JSON when the instance default is
        // Content-Type: application/json (via internal FormDataToJSON).
        // Overriding transformRequest with a pass-through bypasses that conversion
        // and lets the browser send the FormData natively with the correct
        // multipart/form-data boundary in the Content-Type header.
        return api.post('/profile/photos', form, {
            transformRequest: [(data: FormData) => data],
        });
    },

    deletePhoto: (photoId: number) =>
        api.delete(`/profile/photos/${photoId}`),

    setPrimaryPhoto: (photoId: number) =>
        api.put(`/profile/photos/${photoId}/primary`),

    getMyViewers: (page = 1, search?: string) =>
        api.get<ApiResponse<PaginatedResponse<ProfileView>>>('/profile-views', {
            params: {page, ...(search ? {search} : {})},
        }),
};

export const matchService = {
    getMatches: (
        page = 1,
        params?: { search?: string; date_from?: string; date_to?: string },
    ) =>
        api.get<ApiResponse<PaginatedResponse<MatchScore>>>('/matches', {
            params: { page, ...params },
        }),

    search: (filters: SearchFilters) =>
        api.get<ApiResponse<PaginatedResponse<ProfileCard>>>('/matches/search', {params: filters}),

    getCompatibilityScore: (userId: number) =>
        api.get<ApiResponse<{
            score: number;
            score_breakdown: import('@/types/match').ScoreBreakdown;
            calculated_at: string
        }>>(`/matches/${userId}/score`),
};

export const interestService = {
    send: (receiverId: number) =>
        api.post('/interests', {receiver_id: receiverId}),

    getReceived: (page = 1, search?: string) =>
        api.get('/interests/received', {params: {page, ...(search ? {search} : {})}}),

    getSent: (page = 1, search?: string) =>
        api.get('/interests/sent', {params: {page, ...(search ? {search} : {})}}),

    getContacts: (page = 1, search?: string) =>
        api.get('/interests/contacts', {params: {page, ...(search ? {search} : {})}}),

    checkStatus: (userId: number) =>
        api.get<ApiResponse<{
            status: 'none' | 'pending' | 'accepted' | 'declined' | 'ignored';
            interest_id?: number | null;
            is_sender?: boolean;
            send_count?: number;
            can_send_interest?: boolean;
            created_at?: string;
            expires_at?: string;
        }>>(`/interests/status/${userId}`),

    accept: (id: number) =>
        api.put(`/interests/${id}/accept`),

    decline: (id: number) =>
        api.put(`/interests/${id}/decline`),

    ignore: (id: number) =>
        api.put(`/interests/${id}/ignore`),
};

export const shortlistService = {
    toggle: (userId: number) =>
        api.post(`/shortlist/${userId}`),

    getAll: (page = 1, search?: string) =>
        api.get('/shortlist', {params: {page, ...(search ? {search} : {})}}),
};

export const blockService = {
    block: (userId: number) =>
        api.post(`/block/${userId}`),

    unblock: (userId: number) =>
        api.delete(`/block/${userId}`),
};

export const reportService = {
    report: (data: { reported_id: number; reason: string; description?: string }) =>
        api.post('/report', data),
};

export const profileViewService = {
    getMyViewers: (page = 1, search?: string) =>
        api.get('/profile-views', {params: {page, ...(search ? {search} : {})}}),
};

