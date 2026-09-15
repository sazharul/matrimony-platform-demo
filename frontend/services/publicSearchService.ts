import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse } from '@/types/user';
import type { SearchFilters } from '@/types/match';
import type { PublicProfileCard } from '@/types/publicProfile';

export type PublicSearchFilters = Omit<SearchFilters, 'profile_id'>;

export const publicSearchService = {
    search: (filters: PublicSearchFilters) =>
        api.get<ApiResponse<PaginatedResponse<PublicProfileCard>>>('/public/profiles/search', {
            params: filters,
        }),

    recent: (limit = 6) =>
        api.get<ApiResponse<PublicProfileCard[]>>('/public/profiles/recent', {
            params: { limit },
        }),
};
