'use client';

import { useUserQuery } from '@/hooks/useUserQuery';
import { profileService } from '@/services/profileService';
import type { FullProfile } from '@/types/profile';

type ProfileApiError = {
    response?: {
        status?: number;
        data?: {
            message?: string;
            errors?: { feature?: string };
        };
    };
};

function getSubscriptionErrorFeature(error: unknown): string | undefined {
    return (error as ProfileApiError)?.response?.data?.errors?.feature;
}

export function usePublicProfile(profileId: string | undefined) {
    const query = useUserQuery({
        queryKey: ['profile', profileId],
        queryFn: () => profileService.getProfileById(profileId!).then((r) => r.data),
        enabled: !!profileId,
        retry: false,
    });

    const feature = getSubscriptionErrorFeature(query.error);
    const is403 = (query.error as ProfileApiError)?.response?.status === 403;

    return {
        ...query,
        profile: query.data?.data as FullProfile | undefined,
        isFreePlanAccessError: is403 && feature === 'full_profile_access',
        isSubscriptionLimitError: is403 && feature === 'profile_views_per_day',
        subscriptionLimitMessage:
            (query.error as ProfileApiError)?.response?.data?.message
            ?? 'You have reached your daily profile view limit. Upgrade your plan to view more profiles.',
    };
}
