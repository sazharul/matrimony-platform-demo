'use client';

import Link from 'next/link';
import {
    CheckIcon,
    MapPinIcon,
    UserIcon,
} from '@/components/ui/icons';
import { CompatibilityScore } from '@/components/match/CompatibilityScore';
import { InterestConnectionActions } from '@/components/interest/InterestConnectionActions';
import { ShortlistToggleButton } from '@/components/profile/ShortlistToggleButton';
import { resolveMatchScore } from '@/lib/matchScore';
import { formatAge, resolvePhotoUrl, timeAgo } from '@/lib/utils';
import type { MatchScore } from '@/types/match';

interface MatchBarCardProps {
    match: MatchScore;
    onSendInterest: (userId: number) => void;
    onInterestAction: (id: number, action: 'accept' | 'decline' | 'ignore') => void;
    onMessage: (match: MatchScore) => void;
    onToggleShortlist: (userId: number) => void;
    isSendingInterest: boolean;
    isMessaging: boolean;
    isTogglingShortlist: boolean;
}

export function MatchBarCard({
    match,
    onSendInterest,
    onInterestAction,
    onMessage,
    onToggleShortlist,
    isSendingInterest,
    isMessaging,
    isTogglingShortlist,
}: MatchBarCardProps) {
    const profile = match.candidate;
    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : '#';

    const connectionStatus = profile.connection_status ?? 'none';
    const isShortlisted = profile.is_shortlisted ?? false;
    const matchScore = resolveMatchScore(profile, match.score);

    return (
        <div className="card-premium p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-[var(--primary)]/20 group">
            <div className="flex items-start gap-3 sm:gap-4">
                <Link href={profileUrl} className="flex-shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-[var(--gold-50)] profile-photo-border">
                        {resolvePhotoUrl(profile.primary_photo) ? (
                            <img
                                src={resolvePhotoUrl(profile.primary_photo)!}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <UserIcon size={24} strokeWidth={1.5} className="text-subtle" />
                            </div>
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                    href={profileUrl}
                                    className="font-semibold text-foreground truncate group-hover:text-[#8A7000] transition-colors"
                                    style={{ fontFamily: 'var(--font-heading)' }}
                                >
                                    {profile.name}
                                </Link>
                                {profile.profile?.is_verified && (
                                    <span className="flex-shrink-0 text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <CheckIcon size={12} strokeWidth={2.5} />
                                        Verified
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                                {profile.profile?.dob && (
                                    <span>{formatAge(profile.profile.dob)}</span>
                                )}
                                {profile.profile?.city && (
                                    <span className="flex items-center gap-0.5">
                                        <MapPinIcon size={12} strokeWidth={1.8} />
                                        {profile.profile.city}
                                        {profile.profile.country && `, ${profile.profile.country}`}
                                    </span>
                                )}
                                {profile.religion && <span>{profile.religion}</span>}
                                {profile.education && (
                                    <span className="truncate max-w-[140px] sm:max-w-none">
                                        {profile.education}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            {matchScore != null && (
                                <CompatibilityScore score={matchScore} size="sm" />
                            )}
                            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
                                {timeAgo(match.calculated_at)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <InterestConnectionActions
                            connection_status={connectionStatus}
                            interest_id={profile.interest_id ?? null}
                            is_interest_sender={profile.is_interest_sender ?? false}
                            conversation_id={profile.conversation_id ?? null}
                            can_send_interest={profile.can_send_interest}
                            onSendInterest={() => onSendInterest(profile.id)}
                            onInterestAction={onInterestAction}
                            onMessage={() => onMessage(match)}
                            isSendingInterest={isSendingInterest}
                            isMessaging={isMessaging}
                        />

                        <ShortlistToggleButton
                            isShortlisted={isShortlisted}
                            onToggle={() => onToggleShortlist(profile.id)}
                            isLoading={isTogglingShortlist}
                        />
                    </div>
                </div>
            </div>

            <div className="sm:hidden mt-2 pt-2 border-t border-gray-50">
                <div className="text-xs text-muted-foreground">
                    Matched {timeAgo(match.calculated_at)}
                </div>
            </div>
        </div>
    );
}
