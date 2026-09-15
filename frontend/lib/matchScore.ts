import type { ProfileCard } from '@/types/profile';

export function resolveMatchScore(
    profile: ProfileCard,
    explicitScore?: number | null,
): number | null {
    if (explicitScore != null) return explicitScore;
    if (profile.compatibility_score?.score != null) {
        return profile.compatibility_score.score;
    }
    return null;
}
