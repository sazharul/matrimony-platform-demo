'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';
import { PublicProfileViewPromptModal } from '@/components/public/PublicProfileViewPromptModal';
import { PublicProfileCard } from '@/components/match/PublicProfileCard';
import { publicSearchService } from '@/services/publicSearchService';
import { usePublicProfileCardAction } from '@/hooks/usePublicProfileCardAction';
import { useAuthStore } from '@/store/authStore';
import type { PublicProfileCard as PublicProfileCardType } from '@/types/publicProfile';

interface NewMembersPreviewProps {
    members: PublicProfileCardType[];
}

export default function NewMembersPreview({members: initialMembers}: NewMembersPreviewProps) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);
    const [members, setMembers] = useState(initialMembers);

    useEffect(() => {
        if (!isAuthenticated) {
            setMembers(initialMembers);
            return;
        }

        let cancelled = false;

        publicSearchService
            .recent(8)
            .then((res) => {
                if (!cancelled) {
                    setMembers(res.data.data ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setMembers(
                        userId
                            ? initialMembers.filter((member) => member.id !== userId)
                            : initialMembers,
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [initialMembers, isAuthenticated, userId]);

    const visibleMembers = userId
        ? members.filter((member) => member.id !== userId)
        : members;

    const {
        selectedProfile,
        isModalOpen,
        handleProfileClick,
        setModalOpen,
    } = usePublicProfileCardAction();

    if (visibleMembers.length === 0) {
        return null;
    }

    return (
        <>
            <PublicProfileViewPromptModal
                profile={selectedProfile}
                open={isModalOpen}
                onOpenChange={setModalOpen}
            />
            <AnimateSection>
            <section className="py-16 md:py-20" style={{background: '#F8F9FB'}}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest mb-1 text-[#1A1208]">
                                New Registrations
                            </p>
                            <h2 className="text-2xl md:text-3xl font-bold text-[#1A1208]">Newly Joined Members</h2>
                        </div>
                        <Link href="/search?sort=latest"
                              className="inline-flex items-center gap-1.5 text-sm font-bold shrink-0 text-[#1A1208] hover:text-meta transition-colors">
                            View All Profiles <ArrowRight size={14}/>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5 stagger">
                        {visibleMembers.map((member) => (
                            <PublicProfileCard
                                key={member.id}
                                profile={member}
                                onClick={() => handleProfileClick(member)}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </AnimateSection>
        </>
    );
}
