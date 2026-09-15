'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { PublicProfileCard } from '@/types/publicProfile';

export function usePublicProfileCardAction() {
    const router = useRouter();
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const [selectedProfile, setSelectedProfile] = useState<PublicProfileCard | null>(null);

    const handleProfileClick = useCallback(
        (profile: PublicProfileCard) => {
            if (isAuthenticated) {
                const profileId = profile.profile?.profile_id;
                if (profileId) {
                    router.push(`/profile/${profileId}`);
                }
                return;
            }
            setSelectedProfile(profile);
        },
        [isAuthenticated, router],
    );

    const closeModal = useCallback(() => setSelectedProfile(null), []);

    return {
        selectedProfile,
        isModalOpen: selectedProfile !== null,
        handleProfileClick,
        closeModal,
        setModalOpen: (open: boolean) => {
            if (!open) setSelectedProfile(null);
        },
    };
}
