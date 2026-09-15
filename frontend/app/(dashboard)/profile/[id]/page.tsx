'use client';

import React, {useState} from 'react';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useParams, useRouter} from 'next/navigation';
import {
    interestService,
    shortlistService,
    blockService,
    reportService
} from '@/services/profileService';
import {chatService} from '@/services/chatService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {handleSendInterestError} from '@/lib/interest';
import {
    invalidateInterestQueries,
    invalidateShortlistQueries,
    invalidateConversationQueries,
    invalidateProfileQueries,
} from '@/lib/cacheInvalidation';
import {CompatibilityScore} from '@/components/match/CompatibilityScore';
import {formatAge, formatHeight, formatHeightRange} from '@/lib/utils';
import {getApprovedPhotos, resolvePrimaryPhotoUrl} from '@/lib/profilePhotos';
import {usePublicProfile} from '@/hooks/usePublicProfile';
import {useOptions} from '@/hooks/useSelectOptions';
import {optionLabel, optionLabels} from '@/lib/optionLabels';
import {formatProfileLocationLine, useProfileLocationDisplay} from '@/hooks/useProfileLocationDisplay';
import {ProfileAccessGate} from '@/components/profile/ProfileAccessGate';
import {Dialog, DialogContent, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useAuthStore} from '@/store/authStore';
import type {FullProfile} from '@/types/profile';
import {
    ReligionIcon, GraduationCapIcon, MailIcon, ChatIcon,
    StarIcon, StarFilledIcon, CheckIcon, ClockIcon, UserIcon, CrownIcon, XIcon,
} from '@/components/ui/icons';
import Link from 'next/link';
import type {ProfileAccess} from '@/types/profile';

const REPORT_REASONS = [
    {value: 'fake_profile', label: 'Fake Profile'},
    {value: 'inappropriate_photo', label: 'Inappropriate Photo'},
    {value: 'abusive', label: 'Abusive Behavior'},
    {value: 'spam', label: 'Spam'},
    {value: 'other', label: 'Other'},
];

/* ─── Ornament SVG ─── */
const OrnamentDivider = () => (
    <div className="flex items-center gap-3 my-1">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FFCF00]/40 to-transparent"/>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L10.5 7.5H17L11.5 11.5L13.5 17L9 13L4.5 17L6.5 11.5L1 7.5H7.5L9 1Z" fill="#FFCF00" opacity="0.7"/>
        </svg>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FFCF00]/40 to-transparent"/>
    </div>
);

export default function ProfileViewPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const currentUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    const [interestStatus, setInterestStatus] = useState<'none' | 'pending' | 'accepted' | 'declined' | 'ignored'>('none');
    const [isInterestSender, setIsInterestSender] = useState(true);
    const [interestId, setInterestId] = useState<number | null>(null);
    const [canSendInterest, setCanSendInterest] = useState(true);
    const [shortlisted, setShortlisted] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [blockOpen, setBlockOpen] = useState(false);
    const [reportReason, setReportReason] = useState('fake_profile');
    const [reportDesc, setReportDesc] = useState('');

    const {
        profile: profileData,
        isLoading,
        isError,
        isFreePlanAccessError,
        isSubscriptionLimitError,
        subscriptionLimitMessage,
    } = usePublicProfile(params.id);

    const { data: maritalOptions = [] } = useOptions('marital_status');
    const { data: educationOptions = [] } = useOptions('education_level');
    const { data: profileCreatedByOptions = [] } = useOptions('profile_created_by');
    const { data: profileCreatedForOptions = [] } = useOptions('profile_created_for');
    const locationRows = useProfileLocationDisplay(profileData?.profile);
    const locationLine = formatProfileLocationLine(locationRows);

    const profileRes = profileData ? { data: profileData } : undefined;

    // Determine if this is own profile early
    const isOwnProfile = currentUser?.id === profileRes?.data?.id;

    // Sync viewer context from the single profile API response
    React.useEffect(() => {
        if (!profileData || isOwnProfile) {
            return;
        }

        setInterestStatus(profileData.connection_status ?? 'none');
        setIsInterestSender(profileData.is_interest_sender ?? true);
        setInterestId(profileData.interest_id ?? null);
        setCanSendInterest(
            profileData.can_send_interest ?? (profileData.connection_status === 'none' || profileData.connection_status === undefined)
        );
        setShortlisted(profileData.is_shortlisted ?? false);
    }, [profileData, isOwnProfile]);

    const sendInterestMutation = useMutation({
        mutationFn: (id: number) => interestService.send(id),
        onSuccess: () => {
            setInterestStatus('pending');
            setIsInterestSender(true);
            setCanSendInterest(false);
            invalidateInterestQueries(queryClient);
            invalidateProfileQueries(queryClient);
            showSuccessToast('Interest sent successfully!');
        },
        onError: (error: unknown) => {
            handleSendInterestError(error, { queryClient });
        }
    });

    const interestActionMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: 'accept' | 'decline' | 'ignore' }) => {
            if (action === 'accept') return interestService.accept(id);
            if (action === 'decline') return interestService.decline(id);
            return interestService.ignore(id);
        },
        onSuccess: (_, variables) => {
            invalidateInterestQueries(queryClient);
            invalidateProfileQueries(queryClient);
            if (variables.action === 'accept') {
                setInterestStatus('accepted');
                invalidateConversationQueries(queryClient);
                showSuccessToast('Interest accepted!');
                return;
            }
            setInterestStatus('none');
            setIsInterestSender(false);
            showSuccessToast(variables.action === 'decline' ? 'Interest declined.' : 'Interest ignored.');
        },
        onError: (error: unknown) => {
            showErrorToast(getErrorMessage(error));
        },
    });

     const shortlistMutation = useMutation({
         mutationFn: (id: number) => shortlistService.toggle(id),
         onSuccess: async () => {
             setShortlisted((s) => !s);
             invalidateShortlistQueries(queryClient);
             invalidateProfileQueries(queryClient);
             showSuccessToast(shortlisted ? 'Removed from shortlist' : 'Added to shortlist');
         },
         onError: (error: any) => {
             const message = getErrorMessage(error);
             showErrorToast(message);
         }
     });

    const blockMutation = useMutation({
        mutationFn: (id: number) => blockService.block(id),
        onSuccess: () => {
            setBlockOpen(false);
            router.push('/matches');
        },
        onError: (error: unknown) => {
            showErrorToast(getErrorMessage(error));
        },
    });

    const [messageError, setMessageError] = useState<string | null>(null);

    const messageMutation = useMutation({
        mutationFn: (userId: number) => chatService.getOrCreateConversation(userId),
        onSuccess: (conv) => {
            invalidateConversationQueries(queryClient);
            router.push(`/chat/${conv.id}`);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.message
                || error?.message
                || 'Chat is only available after a mutual interest is accepted.';
            setMessageError(errorMessage);
        },
    });

    const reportMutation = useMutation({
        mutationFn: (data: { reported_id: number; reason: string; description?: string }) =>
            reportService.report(data),
        onSuccess: () => {
            setReportOpen(false);
            setReportDesc('');
        },
    });

    if (isLoading || isFreePlanAccessError || isSubscriptionLimitError) {
        return (
            <ProfileAccessGate
                isLoading={isLoading}
                isFreePlanAccessError={isFreePlanAccessError}
                isSubscriptionLimitError={isSubscriptionLimitError}
                subscriptionLimitMessage={subscriptionLimitMessage}
                isError={false}
            >
                {null}
            </ProfileAccessGate>
        );
    }

    if (isError || !profileRes?.data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    </div>
                    <p className="font-serif text-xl text-gray-700">Profile Not Found</p>
                    <Button onClick={() => router.back()} variant="outline" className="rounded-full border-[#FFCF00] text-[#1A1208] hover:bg-[#FFCF00]/5">Go Back</Button>
                </div>
            </div>
        );
    }

    const p: FullProfile = profileRes.data;
    const approvedPhotos = getApprovedPhotos(p.photos);
    const heroPhotoUrl = resolvePrimaryPhotoUrl(p.primary_photo, p.photos);
    const profileViewUsage = p.access?.profile_views_per_day;
    const compatibilityScore = p.compatibility_score;
    const galleryHref = `/profile/${params.id}/gallery`;

    return (
        <div className="bg-[#FDFAF4] min-h-screen pb-24 md:pb-10"
             style={{fontFamily: "'Georgia', 'Times New Roman', serif"}}>

            {/* ══════════════════════════════════
                HERO SECTION — Full-bleed cinematic
            ══════════════════════════════════ */}
            <div className="relative w-full overflow-hidden" style={{background: 'linear-gradient(135deg, #1a1207 0%, #2d1f08 40%, #1a1207 100%)'}}>
                {/* Background texture */}
                <div className="absolute inset-0 opacity-10"
                     style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A227' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}/>

                <div className="relative max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14">
                    <div className="md:flex md:gap-10 md:items-start">

                        {/* ── Photo Column ── */}
                        <div className="md:w-72 lg:w-80 shrink-0">
                            {/* Main photo with ornate frame */}
                            <div className="relative mx-auto md:mx-0" style={{maxWidth: 300}}>
                                {/* Ornate gold frame */}
                                <div className="absolute -inset-[3px] rounded-2xl"
                                     style={{background: 'linear-gradient(135deg, #FFCF00 0%, #f0d060 30%, #FFCF00 60%, #8a6b10 100%)'}}/>
                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
                                    {heroPhotoUrl ? (
                                        <img
                                            src={heroPhotoUrl}
                                            alt={`${p.name}'s photo`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                            <UserIcon size={80} className="text-[#3D3220]" strokeWidth={1}/>
                                        </div>
                                    )}
                                    {/* Verified badge — shown only when face scan is approved */}
                                    {p.profile?.is_verified && (
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-green-600 font-medium flex items-center gap-1 shadow-sm z-10">
                                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            Verified
                                        </div>
                                    )}
                                    {/* Gradient overlay bottom */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent"/>
                                </div>
                            </div>

                            {approvedPhotos.length > 0 && (
                                <Link
                                    href={galleryHref}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#FFCF00]/35 bg-[#FFCF00]/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#FFCF00]/20 transition-colors"
                                    style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 300 }}
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                    </svg>
                                    View Image Gallery ({approvedPhotos.length})
                                </Link>
                            )}
                        </div>

                        {/* ── Identity Column ── */}
                        <div className="flex-1 mt-8 md:mt-0 text-white">
                            {/* Eyebrow */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-px w-8 bg-[#FFCF00]"/>
                                <span className="text-[#FFCF00] text-xs tracking-[0.25em] uppercase font-sans"
                                      style={{fontFamily: 'system-ui, sans-serif'}}>
                                    {optionLabel(profileCreatedForOptions, p.profile?.profile_created_for) ?? 'Profile'}
                                </span>
                            </div>

                            {/* Name */}
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white"
                                style={{fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.01em'}}>
                                {p.name}
                            </h1>

                            {/* Profile ID + location line */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                                {p.profile?.profile_id && (
                                    <span className="font-mono text-[10px] bg-white/10 border border-white/20 text-white px-2.5 py-1 rounded tracking-widest">
                                        {p.profile.profile_id}
                                    </span>
                                )}
                                {p.profile?.dob && (
                                    <span className="text-white/60 text-sm" style={{fontFamily: 'system-ui, sans-serif'}}>
                                        {formatAge(p.profile.dob)}
                                    </span>
                                )}
                                {locationLine && (
                                    <span className="text-white/60 text-sm flex items-center gap-1" style={{fontFamily: 'system-ui, sans-serif'}}>
                                        <svg className="w-3 h-3 text-[#FFCF00]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                                        {locationLine}
                                    </span>
                                )}
                            </div>

                            {/* Quick trait pills */}
                            <div className="mt-5 flex flex-wrap gap-2">
                                {p.profile?.height_cm && <GoldPill label={formatHeight(p.profile.height_cm)} />}
                                {p.profile?.marital_status && <GoldPill label={optionLabel(maritalOptions, p.profile.marital_status) ?? ''} />}
                                {p.religious_detail?.religion && <GoldPill label={p.religious_detail.religion} />}
                                {p.education_career?.highest_education && (
                                    <GoldPill label={optionLabel(educationOptions, p.education_career.highest_education) ?? ''} />
                                )}
                                {p.family_detail?.family_type && <GoldPill label={`${p.family_detail.family_type} Family`} />}
                            </div>

                            {/* About me quote */}
                            {p.profile?.about_me && (
                                <div className="mt-6 border-l-2 border-[#FFCF00] pl-4">
                                    <p className="text-white/70 text-sm leading-relaxed italic"
                                       style={{fontFamily: "'Georgia', serif"}}>
                                        "{p.profile.about_me}"
                                    </p>
                                </div>
                            )}

                            {/* Compatibility score + actions row */}
                             <div className="mt-7 flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-1">
                                 {compatibilityScore && (
                                     <div className="mr-1 shrink-0">
                                         <CompatibilityScore score={compatibilityScore.score} size="lg"/>
                                     </div>
                                 )}

                                 {!isOwnProfile ? (
                                     <>
                                         {canSendInterest && interestStatus !== 'pending' && interestStatus !== 'accepted' && (
                                             <button
                                                 onClick={() => sendInterestMutation.mutate(p.id)}
                                                 disabled={sendInterestMutation.isPending}
                                                 className="group relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 overflow-hidden shadow-md shrink-0 whitespace-nowrap bg-[#FFCF00] hover:bg-[#FFE033] text-[#1A1208] hover:shadow-[0_0_15px_rgba(255,207,0,0.4)]"
                                                 style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 {sendInterestMutation.isPending
                                                     ? <><ClockIcon size={12} strokeWidth={1.8}/> Sending…</>
                                                     : <><MailIcon size={12} strokeWidth={1.8}/> Send Interest</>
                                                 }
                                             </button>
                                         )}

                                         {interestStatus === 'pending' && !isInterestSender && interestId && (
                                             <>
                                                 <button
                                                     onClick={() => interestActionMutation.mutate({ id: interestId, action: 'accept' })}
                                                     className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFCF00] text-[#1A1208] shadow-md shrink-0 whitespace-nowrap"
                                                     style={{fontFamily: 'system-ui, sans-serif'}}>
                                                     <CheckIcon size={12} strokeWidth={2.5}/> Accept
                                                 </button>
                                                 <button
                                                     onClick={() => interestActionMutation.mutate({ id: interestId, action: 'decline' })}
                                                     className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-red-400/40 text-red-300 shrink-0 whitespace-nowrap"
                                                     style={{fontFamily: 'system-ui, sans-serif'}}>
                                                     <XIcon size={12} strokeWidth={2.5}/> Decline
                                                 </button>
                                                 <button
                                                     onClick={() => interestActionMutation.mutate({ id: interestId, action: 'ignore' })}
                                                     className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white/70 shrink-0 whitespace-nowrap"
                                                     style={{fontFamily: 'system-ui, sans-serif'}}>
                                                     Ignore
                                                 </button>
                                             </>
                                         )}

                                         {interestStatus === 'pending' && isInterestSender && !canSendInterest && (
                                             <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0 whitespace-nowrap"
                                                   style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 <CheckIcon size={12} strokeWidth={2.5}/> Already Sent
                                             </span>
                                         )}

                                         {interestStatus === 'accepted' && (
                                             <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-600/20 border border-green-500/40 text-green-400 shrink-0 whitespace-nowrap"
                                                   style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 <CheckIcon size={12} strokeWidth={2.5}/> Interest Accepted
                                             </span>
                                         )}

                                         {interestStatus === 'declined' && (
                                             <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/20 border border-red-400/40 text-red-300 shrink-0 whitespace-nowrap"
                                                   style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 Declined
                                             </span>
                                         )}

                                         {interestStatus === 'ignored' && (
                                             <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white/60 shrink-0 whitespace-nowrap"
                                                   style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 Ignored
                                             </span>
                                         )}

                                         {interestStatus === 'accepted' && (
                                             <button
                                                 onClick={() => {setMessageError(null); messageMutation.mutate(p.id);}}
                                                 disabled={messageMutation.isPending}
                                                 className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm shadow-md shrink-0 whitespace-nowrap"
                                                 style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 {messageMutation.isPending
                                                     ? <><ClockIcon size={12} strokeWidth={1.8}/> Opening…</>
                                                     : <><ChatIcon size={12} strokeWidth={1.8}/> Message</>
                                                 }
                                             </button>
                                         )}

                                         {/* Shortlist */}
                                         <button
                                             onClick={() => shortlistMutation.mutate(p.id)}
                                             disabled={shortlistMutation.isPending}
                                             className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all duration-200 border shrink-0 whitespace-nowrap
                                                 ${shortlisted
                                                 ? 'border-white/20 text-white bg-[#FFCF00]/10'
                                                 : 'border-white/20 text-white hover:border-[#FFCF00]/60 hover:text-[#FFCF00]'
                                             }`}
                                             style={{fontFamily: 'system-ui, sans-serif'}}>
                                             {shortlisted ? <StarFilledIcon size={12} strokeWidth={1.8}/> : <StarIcon size={12} strokeWidth={1.8}/>}
                                             {shortlisted ? 'Shortlisted' : 'Shortlist'}
                                         </button>

                                         {/* Secondary actions */}
                                         <div className="flex gap-1 ml-auto shrink-0">
                                             <button onClick={() => setReportOpen(true)}
                                                     className="text-white hover:text-white/70 text-xs px-2 py-1.5 rounded-full border border-white/20 hover:border-white/25 transition-colors whitespace-nowrap"
                                                     style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 Report
                                             </button>
                                             <button onClick={() => setBlockOpen(true)}
                                                     className="text-white hover:text-red-400 text-xs px-2 py-1.5 rounded-full border border-white/20 hover:border-red-400/30 transition-colors whitespace-nowrap"
                                                     style={{fontFamily: 'system-ui, sans-serif'}}>
                                                 Block
                                             </button>
                                         </div>
                                     </>
                                 ) : (
                                     <a href="/profile/edit"
                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFCF00] hover:bg-[#FFE033] text-[#1A1208] text-xs font-semibold shadow-md transition-all whitespace-nowrap"
                                        style={{fontFamily: 'system-ui, sans-serif'}}>
                                         Edit Profile
                                     </a>
                                 )}
                             </div>

                            {messageError && (
                                <p className="mt-2 text-xs text-red-400" style={{fontFamily: 'system-ui, sans-serif'}}>{messageError}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom scallop */}
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-[#FDFAF4]"
                     style={{borderRadius: '50% 50% 0 0 / 100% 100% 0 0', transform: 'scaleX(1.05)'}}/>
            </div>

            {/* ══════════════════════════════════
                DETAIL SECTIONS
            ══════════════════════════════════ */}
            <div className="max-w-5xl mx-auto px-4 md:px-8 pt-6 space-y-6">

                {!isOwnProfile && profileViewUsage && (
                    <ProfileViewsUsageBanner usage={profileViewUsage} />
                )}

                {/* About & Preferences — full width feature card */}
                {(p.profile?.about_me || p.profile?.what_looking_for) && (
                    <div className="relative rounded-3xl overflow-hidden shadow-md"
                         style={{background: 'linear-gradient(135deg, #fffbf0 0%, #fdf5dc 100%)', border: '1px solid #e8d59a'}}>
                        <div className="absolute top-0 left-0 w-1.5 h-full"
                             style={{background: 'linear-gradient(to bottom, #FFCF00, #f0d060, #FFCF00)'}}/>
                        <div className="px-8 py-6 pl-10">
                            <SectionTitle icon={
                                <svg className="w-4 h-4 text-[#1A1208]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            }>About & Preferences</SectionTitle>
                            <div className="mt-4 grid md:grid-cols-2 gap-6">
                                {p.profile.about_me && (
                                    <div>
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-[#1A1208] font-sans mb-2"
                                           style={{fontFamily: 'system-ui, sans-serif'}}>About Me</p>
                                        <p className="text-gray-700 text-sm leading-relaxed italic">"{p.profile.about_me}"</p>
                                    </div>
                                )}
                                {p.profile.what_looking_for && (
                                    <div>
                                        <p className="text-[10px] tracking-[0.2em] uppercase text-[#1A1208] font-sans mb-2"
                                           style={{fontFamily: 'system-ui, sans-serif'}}>What I'm Looking For</p>
                                        <p className="text-gray-700 text-sm leading-relaxed italic">"{p.profile.what_looking_for}"</p>
                                    </div>
                                )}
                            </div>
                            {p.profile.profile_completion_percentage != null && (
                                <div className="mt-5">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-meta" style={{fontFamily: 'system-ui, sans-serif'}}>{p.name}'s profile is {p.profile.profile_completion_percentage}% complete</span>
                                        <span className="text-xs font-bold text-[#1A1208]" style={{fontFamily: 'system-ui, sans-serif'}}>{p.profile.profile_completion_percentage}%</span>
                                    </div>
                                    <div className="h-1.5 bg-[#FFCF00]/15 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700"
                                             style={{width: `${p.profile.profile_completion_percentage}%`, background: 'linear-gradient(to right, #FFCF00, #f0d060)'}}/>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Main grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {p.profile && (
                        <PremiumCard title="Basic Profile" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        }>
                            <Row label="Profile ID" value={p.profile.profile_id}/>
                            <Row label="Nick Name" value={p.profile.nick_name}/>
                            <Row label="Profile Created By" value={optionLabel(profileCreatedByOptions, p.profile_created_by)}/>
                            <Row label="Created For" value={optionLabel(profileCreatedForOptions, p.profile.profile_created_for)}/>
                            <Row label="Looking For" value={p.profile.looking_for?.replace('_', ' ')}/>
                            <Row label="Age" value={p.profile.dob ? formatAge(p.profile.dob) : null}/>
                            <Row label="Marital Status" value={optionLabel(maritalOptions, p.profile.marital_status)}/>
                            <Row label="Mother Tongue" value={p.profile.mother_tongue}/>
                        </PremiumCard>
                    )}

                    {p.religious_detail && (
                        <PremiumCard title="Religious Background" icon={<ReligionIcon size={16} strokeWidth={1.8}/>}>
                            <Row label="Religion" value={p.religious_detail.religion}/>
                            <Row label="Caste" value={p.religious_detail.caste}/>
                            <Row label="Sub Caste" value={p.religious_detail.sub_caste}/>
                            <Row label="Gotra" value={p.religious_detail.gotra}/>
                            <Row label="Manglik Status" value={p.religious_detail.manglik_status?.replace('_', ' ')}/>
                            <Row label="Religiousness" value={p.religious_detail.religiousness?.replace('_', ' ')}/>
                            <Row label="Pray Frequency" value={p.religious_detail.pray?.replace('_', ' ')}/>
                        </PremiumCard>
                    )}

                    {p.profile && (
                        <PremiumCard title="Physical Attributes" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="9" ry="9"/><circle cx="12" cy="12" r="3"/></svg>
                        }>
                            <Row label="Height" value={p.profile.height_cm ? formatHeight(p.profile.height_cm) : null}/>
                            <Row label="Weight" value={p.profile.weight_kg ? `${p.profile.weight_kg} kg` : null}/>
                            <Row label="Body Type" value={p.profile.body_type?.replace('_', ' ')}/>
                            <Row label="Complexion" value={p.profile.complexion?.replace('_', ' ')}/>
                            <Row label="Eyes" value={p.profile.eye_color}/>
                            <Row label="Hair" value={p.profile.hair_color}/>
                            <Row label="Blood Group" value={p.profile.blood_group}/>
                            <Row label="Disability" value={p.profile.disability}/>
                        </PremiumCard>
                    )}

                    {p.family_detail && (
                        <PremiumCard title="Family Details" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        }>
                            <Row label="Family Type" value={p.family_detail.family_type?.replace('_', ' ')}/>
                            <Row label="Family Status" value={p.family_detail.family_status?.replace('_', ' ')}/>
                            <Row label="Family Values" value={p.family_detail.family_values?.replace('_', ' ')}/>
                            <Row label="Brothers" value={p.family_detail.brothers_count?.toString()}/>
                            <Row label="Sisters" value={p.family_detail.sisters_count?.toString()}/>
                            <Row label="Sibling Position" value={p.family_detail.sibling_position?.toString()}/>
                            <Row label="Has Children" value={p.family_detail.has_children?.replace('_', ' ')}/>
                            <Row label="Family Income" value={p.family_detail.family_income_bdt_per_month ? `₹${(p.family_detail.family_income_bdt_per_month).toLocaleString()} / month` : null}/>
                            <Row label="Father's Occupation" value={p.family_detail.father_occupation}/>
                            <Row label="Mother's Occupation" value={p.family_detail.mother_occupation}/>
                        </PremiumCard>
                    )}

                    {p.education_career && (
                        <PremiumCard title="Education & Career" icon={<GraduationCapIcon size={16} strokeWidth={1.8}/>}>
                            <Row label="Education" value={optionLabel(educationOptions, p.education_career.highest_education)}/>
                            <Row label="University" value={p.education_career.college_university}/>
                            <Row label="Institution" value={p.education_career.institution_name_year}/>
                            <Row label="Profession" value={p.education_career.profession}/>
                            <Row label="Designation" value={p.education_career.designation}/>
                            <Row label="Employer" value={p.education_career.employer_name}/>
                            <Row label="Job Location" value={p.education_career.job_location}/>
                            <Row label="Employment Type" value={p.education_career.employed_in?.replace('_', ' ')}/>
                            <Row label="Experience" value={p.education_career.experience_years ? `${p.education_career.experience_years} years` : null}/>
                            <Row label="Annual Income" value={p.education_career.annual_income_bdt ? `₹${(p.education_career.annual_income_bdt).toLocaleString()}` : null}/>
                        </PremiumCard>
                    )}

                    {p.lifestyle && (
                        <PremiumCard title="Lifestyle" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        }>
                            <Row label="Diet" value={p.lifestyle.diet?.replace('_', ' ')}/>
                            <Row label="Smoking" value={p.lifestyle.smoking?.replace('_', ' ')}/>
                            <Row label="Drinking" value={p.lifestyle.drinking?.replace('_', ' ')}/>
                            <Row label="Eye Wear" value={p.lifestyle.eye_wear?.replace('_', ' ')}/>
                            {p.lifestyle.hobbies && p.lifestyle.hobbies.length > 0 && (
                                <div className="pt-2">
                                    <OrnamentDivider/>
                                    <p className="text-[10px] tracking-[0.18em] uppercase text-[#1A1208] mt-3 mb-2"
                                       style={{fontFamily: 'system-ui, sans-serif'}}>Hobbies</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.lifestyle.hobbies.map((h) => (
                                            <span key={h} className="text-xs bg-[#FFCF00]/10 border border-[#FFCF00]/20 text-[#1A1208] rounded-full px-3 py-1"
                                                  style={{fontFamily: 'system-ui, sans-serif'}}>{h}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {p.lifestyle.languages_known && p.lifestyle.languages_known.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-[10px] tracking-[0.18em] uppercase text-[#1A1208] mt-3 mb-2"
                                       style={{fontFamily: 'system-ui, sans-serif'}}>Languages</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.lifestyle.languages_known.map((lang) => (
                                            <span key={lang} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-3 py-1"
                                                  style={{fontFamily: 'system-ui, sans-serif'}}>{lang}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </PremiumCard>
                    )}

                    {p.profile && (
                        <PremiumCard title="Location & Status" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        }>
                            {locationRows.map((row) => (
                                <Row key={row.label} label={row.label} value={row.value}/>
                            ))}
                            <Row label="Postal Code" value={p.profile.postal_code}/>
                            <Row label="Residing Status" value={p.profile.residing_status?.replace('_', ' ')}/>
                            {/* <Row label="Nationality" value={p.profile.nationality}/> */}
                            <Row label="Mother Tongue" value={p.profile.mother_tongue}/>
                            <Row label="Disability" value={p.profile.disability}/>
                            <Row label="Marital Status" value={optionLabel(maritalOptions, p.profile.marital_status)}/>
                            <Row label="Profile Created By" value={optionLabel(profileCreatedByOptions, p.profile_created_by)}/>
                            <Row label="Profile Created For" value={optionLabel(profileCreatedForOptions, p.profile.profile_created_for)}/>
                        </PremiumCard>
                    )}

                    {p.horoscope_detail && (
                        <PremiumCard title="Horoscope Details" icon={
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                        }>
                            <Row label="Birth Place" value={p.horoscope_detail.birth_place}/>
                            <Row label="Birth Time" value={p.horoscope_detail.birth_time}/>
                            <Row label="Rashi" value={p.horoscope_detail.rashi}/>
                            <Row label="Nakshatra" value={p.horoscope_detail.nakshatra}/>
                            <Row label="Manglik" value={p.horoscope_detail.manglik ? 'Yes' : p.horoscope_detail.manglik === false ? 'No' : null}/>
                        </PremiumCard>
                    )}
                </div>

                {/* Partner Preferences — full-width premium section */}
                {p.partner_preference && (
                    <div className="rounded-3xl overflow-hidden shadow-md border border-[#e8d59a]"
                         style={{background: 'linear-gradient(135deg, #fffbf0 0%, #fdf5dc 100%)'}}>
                        <div className="px-6 py-5 border-b border-[#e8d59a]/60"
                             style={{background: 'linear-gradient(135deg, #2d1f08 0%, #1a1207 100%)'}}>
                            <h2 className="text-white text-lg flex items-center gap-3"
                                style={{fontFamily: "'Playfair Display', Georgia, serif"}}>
                                <svg className="w-5 h-5 text-[#1A1208]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                                Partner Preferences
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-0">
                            <div className="space-y-1 md:pr-6 md:border-r border-[#e8d59a]/60">
                                <PreferenceGroupTitle>Appearance</PreferenceGroupTitle>
                                <Row label="Age Range" value={p.partner_preference.age_min && p.partner_preference.age_max ? `${p.partner_preference.age_min} – ${p.partner_preference.age_max} years` : null}/>
                                <Row label="Height Range" value={p.partner_preference.height_min_cm && p.partner_preference.height_max_cm ? formatHeightRange(p.partner_preference.height_min_cm, p.partner_preference.height_max_cm) : null}/>
                                <Row label="Body Types" value={p.partner_preference.body_type?.join(', ') ?? null}/>
                                <Row label="Complexion" value={p.partner_preference.complexion?.join(', ') ?? null}/>
                                <Row label="Income Range" value={p.partner_preference.income_min_bdt && p.partner_preference.income_max_bdt ? `₹${p.partner_preference.income_min_bdt.toLocaleString()} – ₹${p.partner_preference.income_max_bdt.toLocaleString()}` : null}/>
                            </div>
                            <div className="space-y-1 md:pl-6 mt-4 md:mt-0">
                                <PreferenceGroupTitle>Background & Values</PreferenceGroupTitle>
                                <Row label="Religion(s)" value={p.partner_preference.religion?.join(', ') ?? null}/>
                                <Row label="Caste(s)" value={p.partner_preference.caste?.join(', ') ?? null}/>
                                <Row label="Marital Status" value={optionLabels(maritalOptions, p.partner_preference.marital_status)}/>
                                <Row label="Family Type" value={p.partner_preference.family_type?.join(', ') ?? null}/>
                                <Row label="Diet(s)" value={p.partner_preference.diet?.join(', ') ?? null}/>
                                <Row label="Smoking Acceptable" value={p.partner_preference.smoking_acceptable ? 'Yes' : 'No'}/>
                                <Row label="Drinking Acceptable" value={p.partner_preference.drinking_acceptable ? 'Yes' : 'No'}/>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer ornament */}
                <div className="flex flex-col items-center py-4 gap-2 opacity-40">
                    <OrnamentDivider/>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-[#4A3F2E]"
                       style={{fontFamily: 'system-ui, sans-serif'}}>End of Profile</p>
                </div>
            </div>

            {/* ══════════════════════════════════
                BLOCK MODAL
            ══════════════════════════════════ */}
            <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100"
                         style={{background: 'linear-gradient(135deg, #2d1f08 0%, #1a1207 100%)'}}>
                        <DialogTitle className="text-white text-lg"
                                     style={{fontFamily: "'Playfair Display', Georgia, serif"}}>
                            Block User
                        </DialogTitle>
                    </div>
                    <div className="p-6 bg-[#FDFAF4]">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4 ring-4 ring-red-100/80">
                                <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                            </div>
                            <p className="text-gray-800 font-medium text-base"
                               style={{fontFamily: "'Playfair Display', Georgia, serif"}}>
                                Block {p.name}?
                            </p>
                            <p className="text-meta text-sm mt-2 max-w-xs leading-relaxed"
                               style={{fontFamily: 'system-ui, sans-serif'}}>
                                They will no longer be able to view your profile or contact you. You won&apos;t see them in search or matches either.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-end pt-6">
                            <Button
                                variant="outline"
                                onClick={() => setBlockOpen(false)}
                                disabled={blockMutation.isPending}
                                className="rounded-full border-gray-200 text-[#3D3220] text-sm"
                                style={{fontFamily: 'system-ui, sans-serif'}}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => blockMutation.mutate(p.id)}
                                disabled={blockMutation.isPending}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full text-sm shadow-md min-w-[7rem]"
                                style={{fontFamily: 'system-ui, sans-serif'}}
                            >
                                {blockMutation.isPending ? 'Blocking…' : 'Block User'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════
                REPORT MODAL
            ══════════════════════════════════ */}
            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl border-0 p-0 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100"
                         style={{background: 'linear-gradient(135deg, #2d1f08 0%, #1a1207 100%)'}}>
                        <DialogTitle className="text-white text-lg"
                                     style={{fontFamily: "'Playfair Display', Georgia, serif"}}>Report Profile</DialogTitle>
                    </div>
                    <div className="p-6 space-y-4 bg-[#FDFAF4]">
                        <div>
                            <label className="text-xs tracking-widest uppercase text-[#1A1208] block mb-2"
                                   style={{fontFamily: 'system-ui, sans-serif'}}>Reason</label>
                            <select
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full border border-[#e8d59a] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FFCF00]/40 text-gray-700"
                                style={{fontFamily: 'system-ui, sans-serif'}}
                            >
                                {REPORT_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs tracking-widest uppercase text-[#1A1208] block mb-2"
                                   style={{fontFamily: 'system-ui, sans-serif'}}>Description (optional)</label>
                            <Textarea
                                value={reportDesc}
                                onChange={(e) => setReportDesc(e.target.value)}
                                placeholder="Please provide any additional details…"
                                maxLength={500}
                                rows={3}
                                className="resize-none border-[#e8d59a] rounded-xl focus-visible:ring-[#FFCF00]/40 bg-white text-gray-700"
                                style={{fontFamily: 'system-ui, sans-serif'}}
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                            <Button variant="outline" onClick={() => setReportOpen(false)}
                                    className="rounded-full border-gray-200 text-[#3D3220] text-sm"
                                    style={{fontFamily: 'system-ui, sans-serif'}}>Cancel</Button>
                            <Button
                                onClick={() => reportMutation.mutate({
                                    reported_id: p.id,
                                    reason: reportReason,
                                    description: reportDesc || undefined
                                })}
                                disabled={reportMutation.isPending}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full text-sm shadow-md"
                                style={{fontFamily: 'system-ui, sans-serif'}}
                            >
                                {reportMutation.isPending ? 'Submitting…' : 'Submit Report'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/* ─── Sub-components ─── */

function SectionTitle({icon, children}: {icon?: React.ReactNode; children: React.ReactNode}) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-[#1A1208]">{icon}</span>
            <h2 className="text-[#1F2937] text-lg font-semibold" style={{fontFamily: "'Playfair Display', Georgia, serif"}}>
                {children}
            </h2>
        </div>
    );
}

function PreferenceGroupTitle({children}: {children: React.ReactNode}) {
    return (
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#1A1208] font-semibold mb-2 mt-1"
           style={{fontFamily: 'system-ui, sans-serif'}}>{children}</p>
    );
}

function PremiumCard({title, icon, children}: {title: string; icon?: React.ReactNode; children: React.ReactNode}) {
    return (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-[#e8d59a]/60 bg-white/80 backdrop-blur-sm">
            {/* Card header */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#e8d59a]/40"
                 style={{background: 'linear-gradient(to right, #fdf5dc, #fffbf0)'}}>
                <span className="text-[#1A1208]">{icon}</span>
                <h3 className="font-semibold text-[#1F2937] text-sm tracking-wide"
                    style={{fontFamily: "'Playfair Display', Georgia, serif"}}>{title}</h3>
            </div>
            {/* Card body */}
            <div className="px-5 py-4 divide-y divide-[#e8d59a]/30">
                {children}
            </div>
        </div>
    );
}

function Row({label, value}: {label: string; value?: string | null}) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-2 gap-4">
            <span className="text-[#4A3F2E] text-xs shrink-0 pt-0.5 tracking-wide"
                  style={{fontFamily: 'system-ui, sans-serif'}}>{label}</span>
            <span className="text-[#1F2937] text-xs font-medium capitalize text-right leading-relaxed"
                  style={{fontFamily: 'system-ui, sans-serif'}}>{value}</span>
        </div>
    );
}

function GoldPill({label}: {label: string}) {
    return (
        <span className="inline-flex items-center text-xs px-3 py-1.5 rounded-full border font-medium tracking-wide"
              style={{
                  fontFamily: 'system-ui, sans-serif',
                  background: 'rgba(255,207,0,0.12)',
                  borderColor: 'rgba(255,207,0,0.35)',
                  color: '#FFFFFF'
              }}>
            {label}
        </span>
    );
}

function ProfileViewsUsageBanner({usage}: {usage: ProfileAccess['profile_views_per_day']}) {
    const label = usage.unlimited
        ? `Profile Views Today: ${usage.used} (Unlimited)`
        : `Profile Views Today: ${usage.used} / ${usage.limit}`;

    return (
        <div className="rounded-2xl border border-[#e8d59a]/60 bg-white/80 backdrop-blur-sm px-5 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#FFCF00]/10 flex items-center justify-center shrink-0">
                <CrownIcon size={18} strokeWidth={2} className="text-[#1A1208]" />
            </div>
            <div>
                <p className="text-sm font-semibold text-[#1F2937]" style={{fontFamily: 'system-ui, sans-serif'}}>
                    {label}
                </p>
                <p className="text-xs text-meta mt-0.5" style={{fontFamily: 'system-ui, sans-serif'}}>
                    Profile Views per Day from your subscription
                </p>
            </div>
        </div>
    );
}