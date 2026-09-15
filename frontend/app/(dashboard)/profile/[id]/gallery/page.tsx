'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { ProfileAccessGate } from '@/components/profile/ProfileAccessGate';
import { ProfilePhotoGallery } from '@/components/profile/ProfilePhotoGallery';
import { Button } from '@/components/ui/button';
import { getApprovedPhotos } from '@/lib/profilePhotos';

export default function ProfileGalleryPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const {
        profile,
        isLoading,
        isError,
        isFreePlanAccessError,
        isSubscriptionLimitError,
        subscriptionLimitMessage,
    } = usePublicProfile(params.id);

    const photoCount = getApprovedPhotos(profile?.photos).length;

    return (
        <ProfileAccessGate
            isLoading={isLoading}
            isFreePlanAccessError={isFreePlanAccessError}
            isSubscriptionLimitError={isSubscriptionLimitError}
            subscriptionLimitMessage={subscriptionLimitMessage}
            isError={isError}
        >
            {!profile ? (
                <div className="min-h-[60vh] flex items-center justify-center px-4 bg-[#FDFAF4]">
                    <div className="text-center space-y-4">
                        <p className="font-serif text-xl text-gray-700">Profile Not Found</p>
                        <Button onClick={() => router.back()} variant="outline" className="rounded-full border-[#FFCF00] text-[#1A1208] hover:bg-[#FFCF00]/5">
                            Go Back
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-[#FDFAF4] min-h-screen pb-24 md:pb-10"
                     style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    <div className="border-b border-[#e8d59a]/60 bg-white/70 backdrop-blur-sm">
                        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between gap-4">
                            <div>
                                <Link
                                    href={`/profile/${params.id}`}
                                    className="inline-flex items-center gap-1.5 text-xs text-[#1A1208] hover:text-[#8A7000] transition-colors mb-2"
                                    style={{ fontFamily: 'system-ui, sans-serif' }}
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Back to Profile
                                </Link>
                                <h1 className="text-2xl md:text-3xl font-semibold text-[#1F2937]"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                    {profile.name}&apos;s Gallery
                                </h1>
                                <p className="text-sm text-meta mt-1" style={{ fontFamily: 'system-ui, sans-serif' }}>
                                    {photoCount} {photoCount === 1 ? 'photo' : 'photos'} · Tap any image to preview
                                </p>
                            </div>
                            {profile.profile?.profile_id && (
                                <span className="font-mono text-[10px] bg-[#FFCF00]/10 border border-[#FFCF00]/25 text-[#1A1208] px-2.5 py-1 rounded tracking-widest shrink-0">
                                    {profile.profile.profile_id}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                        <ProfilePhotoGallery photos={profile.photos} subjectName={profile.name} />
                    </div>
                </div>
            )}
        </ProfileAccessGate>
    );
}
