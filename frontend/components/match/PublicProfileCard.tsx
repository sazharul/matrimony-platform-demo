'use client';

import { formatAge, formatHeight, resolvePhotoUrl } from '@/lib/utils';
import type { PublicProfileCard } from '@/types/publicProfile';
import { MapPinIcon, UserIcon } from '@/components/ui/icons';
import { ProfileGenderBadge } from '@/components/match/ProfileGenderBadge';

interface PublicProfileCardProps {
    profile: PublicProfileCard;
    onClick?: () => void;
}

export function PublicProfileCard({ profile, onClick }: PublicProfileCardProps) {
    const location = [profile.profile?.city, profile.profile?.country]
        .filter(Boolean)
        .join(', ');
    const photoUrl = resolvePhotoUrl(profile.primary_photo);

    return (
        <button
            type="button"
            onClick={onClick}
            className="card-premium profile-card animate-fade-in flex flex-col h-full w-full min-w-0 text-left cursor-pointer transition-all duration-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        >
            <div className="relative w-full profile-card-photo shrink-0 overflow-hidden bg-[var(--gold-50)]">
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={profile.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <UserIcon size={40} className="text-subtle" strokeWidth={1.2} />
                    </div>
                )}

                {profile.is_verified && (
                    <div className="absolute top-2 left-2 bg-white rounded-full px-2 py-0.5 text-xs text-green-700 font-bold flex items-center gap-0.5 shadow-sm">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified
                    </div>
                )}

                <ProfileGenderBadge gender={profile.gender} />
            </div>

            <div className="flex flex-1 flex-col p-2.5 sm:p-3 min-h-0">
                <h3
                    className="font-semibold text-sm text-foreground truncate leading-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                >
                    {profile.name}
                </h3>

                <div className="mt-1 space-y-0.5 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">
                        {formatAge(profile.profile?.dob)} • {formatHeight(profile.profile?.height_cm)}
                    </p>
                    {location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate font-medium">
                            <MapPinIcon size={12} strokeWidth={1.8} className="shrink-0" />
                            <span className="truncate">{location}</span>
                        </p>
                    )}
                </div>
            </div>
        </button>
    );
}
