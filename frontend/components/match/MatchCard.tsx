'use client';

import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {useUserQuery} from '@/hooks/useUserQuery';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {formatAge, formatHeight, resolvePhotoUrl} from '@/lib/utils';
import {CompatibilityScore} from './CompatibilityScore';
import {interestService, shortlistService} from '@/services/profileService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {handleSendInterestError} from '@/lib/interest';
import {invalidateInterestQueries, invalidateShortlistQueries} from '@/lib/cacheInvalidation';
import type {ProfileCard} from '@/types/profile';
import {MapPinIcon, MailIcon, StarIcon, StarFilledIcon, UserIcon, CheckIcon, ClockIcon} from '@/components/ui/icons';
import { ProfileGenderBadge } from '@/components/match/ProfileGenderBadge';

interface MatchCardProps {
    profile: ProfileCard;
    score?: number;
    showScore?: boolean;
}

export function MatchCard({profile, score, showScore = true}: MatchCardProps) {
    const queryClient = useQueryClient();
    const hasInterestFromProfile = profile.connection_status !== undefined;
    const hasShortlistFromProfile = profile.is_shortlisted !== undefined;
    const [interestStatus, setInterestStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'ignored'>(
        profile.connection_status ?? 'none'
    );
    const [isInterestSender, setIsInterestSender] = useState(profile.is_interest_sender ?? true);
    const [canSendInterest, setCanSendInterest] = useState(
        profile.can_send_interest ?? (profile.connection_status === undefined || profile.connection_status === 'none')
    );
    const [shortlisted, setShortlisted] = useState(profile.is_shortlisted ?? false);

    // Fetch interest status only when the profile payload does not already include it
    const {data: interestStatusRes} = useUserQuery({
        queryKey: ['interests-status-card', profile.id],
        queryFn: () => interestService.checkStatus(profile.id).then((r) => r.data.data),
        enabled: !hasInterestFromProfile,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    // Fetch shortlist status only when the profile payload does not already include it
    const shortlistStatusQuery = useUserQuery({
        queryKey: ['shortlist-status-card', profile.id],
        queryFn: async () => {
            try {
                let page = 1;
                let hasMore = true;

                while (hasMore) {
                    const response = await shortlistService.getAll(page);
                    const data = response.data?.data as any;
                    const profiles = data?.data ?? [];

                    const isShortlisted = profiles.some((s: any) => s.user?.id === profile.id);
                    if (isShortlisted) {
                        return true;
                    }

                    const lastPage = data?.last_page ?? 1;
                    const currentPage = data?.current_page ?? 1;
                    hasMore = currentPage < lastPage;
                    page++;

                    if (page > 100) hasMore = false;
                }

                return false;
            } catch (error) {
                console.error('Error checking shortlist status:', error);
                return false;
            }
        },
        enabled: !hasShortlistFromProfile,
        staleTime: 0,
    });

    // Update interest status from API fallback when not embedded in profile
    useEffect(() => {
        if (hasInterestFromProfile) {
            setInterestStatus(profile.connection_status ?? 'none');
            setIsInterestSender(profile.is_interest_sender ?? true);
            setCanSendInterest(
                profile.can_send_interest ?? (profile.connection_status === 'none')
            );
            return;
        }
        if (interestStatusRes) {
            setInterestStatus(interestStatusRes.status as 'none' | 'pending' | 'accepted' | 'declined' | 'ignored');
            setIsInterestSender(interestStatusRes.is_sender ?? true);
            setCanSendInterest(interestStatusRes.can_send_interest ?? interestStatusRes.status === 'none');
        }
    }, [
        hasInterestFromProfile,
        profile.connection_status,
        profile.is_interest_sender,
        profile.can_send_interest,
        interestStatusRes,
    ]);

    // Update shortlist status from API fallback when not embedded in profile
    useEffect(() => {
        if (hasShortlistFromProfile) {
            setShortlisted(profile.is_shortlisted ?? false);
            return;
        }
        if (shortlistStatusQuery.data !== undefined) {
            setShortlisted(shortlistStatusQuery.data);
        }
    }, [hasShortlistFromProfile, profile.is_shortlisted, shortlistStatusQuery.data]);

    const sendInterestMutation = useMutation({
        mutationFn: (id: number) => interestService.send(id),
        onSuccess: () => {
            setInterestStatus('pending');
            setIsInterestSender(true);
            setCanSendInterest(false);
            invalidateInterestQueries(queryClient);
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, { queryClient });
        },
    });

     const shortlistMutation = useMutation({
         mutationFn: (id: number) => shortlistService.toggle(id),
         onSuccess: (response) => {
             const next = response.data?.data?.shortlisted;
             const isNowShortlisted = typeof next === 'boolean' ? next : !shortlisted;
             setShortlisted(isNowShortlisted);
             invalidateShortlistQueries(queryClient);
             showSuccessToast(isNowShortlisted ? 'Added to shortlist' : 'Removed from shortlist');
         },
         onError: (error: any) => {
             const message = getErrorMessage(error);
             showErrorToast(message);
         },
     });

    const profileUrl = profile.profile?.profile_id
        ? `/profile/${profile.profile.profile_id}`
        : `/profile/${profile.id}`;

    const handleSendInterest = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (sendInterestMutation.isPending || !canSendInterest) return;
        sendInterestMutation.mutate(profile.id);
    };

    const handleShortlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (shortlistMutation.isPending) return;
        shortlistMutation.mutate(profile.id);
    };

    const shortlistButtonClass = `flex items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition-all active:scale-95 ${
        shortlisted
            ? 'border-[var(--primary)] text-[#1A1208] bg-white/95'
            : 'border-white/80 text-white bg-black/35 hover:bg-black/50'
    }`;

    const shortlistIcon = shortlisted
        ? <StarFilledIcon size={16} strokeWidth={1.8}/>
        : <StarIcon size={16} strokeWidth={1.8}/>;

    return (
        <div
            className="card-premium profile-card group animate-fade-in flex flex-col h-full min-w-0">
            {/* Photo */}
            <div className="relative profile-card-photo bg-[var(--gold-50)]">
                <Link href={profileUrl} className="block w-full h-full">
                    {resolvePhotoUrl(profile.primary_photo) ? (
                        <img
                            src={resolvePhotoUrl(profile.primary_photo)!}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <UserIcon size={40} className="text-subtle" strokeWidth={1.2}/>
                        </div>
                    )}

                    {/* Score badge */}
                    {showScore && score !== undefined && (
                        <div className="absolute top-2 right-2">
                            <CompatibilityScore score={score} size="sm"/>
                        </div>
                    )}

                    {/* Verified badge — shown only when face scan is approved */}
                    {profile.profile?.is_verified && (
                        <div
                            className="absolute top-2 left-2 bg-white rounded-full px-2 py-0.5 text-xs text-green-700 font-bold flex items-center gap-0.5 shadow-sm z-10">
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Verified
                        </div>
                    )}

                    <ProfileGenderBadge gender={profile.gender} />

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"/>
                </Link>

                {/* Mobile shortlist — on photo, keeps action row full-width */}
                <button
                    type="button"
                    onClick={handleShortlist}
                    disabled={shortlistMutation.isPending}
                    title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                    aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                    className={`absolute bottom-2 right-2 z-10 w-8 h-8 sm:hidden ${shortlistButtonClass}`}
                >
                    {shortlistIcon}
                </button>
            </div>

            {/* Info */}
            <div className="p-2.5 sm:p-3 flex flex-col flex-1 min-w-0">
                <div className="min-w-0">
                    <Link href={profileUrl}>
                        <h3 className="font-semibold text-sm text-foreground truncate hover:text-[#8A7000] transition-colors leading-tight" style={{fontFamily:'var(--font-heading)'}}>
                            {profile.name}
                        </h3>
                    </Link>

                    <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-muted-foreground truncate">
                            {formatAge(profile.profile?.dob)} •{' '}
                            {formatHeight(profile.profile?.height_cm)}
                        </p>
                        {profile.profile?.city && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate font-medium">
                                <MapPinIcon size={12} strokeWidth={1.8} className="shrink-0"/>
                                <span className="truncate">{profile.profile.city}{profile.profile.country ? `, ${profile.profile.country}` : ''}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 flex items-stretch gap-1.5 min-w-0">
                    <button
                        type="button"
                        onClick={handleSendInterest}
                        disabled={!canSendInterest || sendInterestMutation.isPending}
                        className={`w-full sm:flex-1 min-w-0 min-h-8 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 leading-tight ${
                            interestStatus === 'accepted'
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : interestStatus === 'pending' && isInterestSender && !canSendInterest
                                    ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                    : interestStatus === 'declined'
                                        ? 'bg-red-50 text-red-500 border border-red-200'
                                        : interestStatus === 'ignored'
                                            ? 'bg-gray-50 text-meta border border-gray-200'
                                            : canSendInterest
                                                ? 'text-[#1A1208] shadow-sm active:scale-[0.98]'
                                                : 'bg-gray-50 text-meta border border-gray-200'
                        }`}
                        style={canSendInterest && interestStatus !== 'accepted' && !(interestStatus === 'pending' && isInterestSender && !canSendInterest) && interestStatus !== 'declined' && interestStatus !== 'ignored'
                            ? {background: 'var(--gradient-gold-btn)'}
                            : undefined}
                    >
                        {sendInterestMutation.isPending ? (
                            <><ClockIcon size={12} strokeWidth={1.8} className="shrink-0"/><span className="truncate">Sending…</span></>
                        ) : interestStatus === 'accepted' ? (
                            <><CheckIcon size={12} strokeWidth={2.5} className="shrink-0"/><span className="truncate">Approved</span></>
                        ) : interestStatus === 'pending' && isInterestSender && !canSendInterest ? (
                            <><CheckIcon size={12} strokeWidth={2.5} className="shrink-0"/><span className="truncate">Already Sent</span></>
                        ) : interestStatus === 'declined' ? (
                            <span className="truncate">Declined</span>
                        ) : interestStatus === 'ignored' ? (
                            <span className="truncate">Ignored</span>
                        ) : canSendInterest ? (
                            <>
                                <MailIcon size={12} strokeWidth={2} className="shrink-0"/>
                                <span className="truncate">Send Interest</span>
                            </>
                        ) : (
                            <span className="truncate">Unavailable</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleShortlist}
                        disabled={shortlistMutation.isPending}
                        title={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                        aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                        className={`hidden sm:flex shrink-0 w-8 h-8 items-center justify-center rounded-lg border transition-all active:scale-95 ${
                            shortlisted
                                ? 'border-[var(--primary)] text-[#1A1208] bg-[var(--accent)]'
                                : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)] hover:text-[#1A1208] hover:bg-[var(--accent)]'
                        }`}
                    >
                        {shortlistIcon}
                    </button>
                </div>
            </div>
        </div>
    );
}

