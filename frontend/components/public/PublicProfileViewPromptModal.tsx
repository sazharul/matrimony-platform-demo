'use client';

import Link from 'next/link';
import { BadgeCheck, Lock, LogIn, Sparkles, UserPlus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { resolvePhotoUrl } from '@/lib/utils';
import { UserIcon } from '@/components/ui/icons';
import type { PublicProfileCard } from '@/types/publicProfile';

interface PublicProfileViewPromptModalProps {
    profile: PublicProfileCard | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function PublicProfileViewPromptModal({
    profile,
    open,
    onOpenChange,
}: PublicProfileViewPromptModalProps) {
    if (!profile) return null;

    const photoUrl = resolvePhotoUrl(profile.primary_photo);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
                <div
                    className="h-1.5 w-full"
                    style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}
                />
                <div className="p-6">
                    <DialogHeader className="text-center sm:text-center">
                        <div className="mx-auto mb-4">
                            <div
                                className="relative h-20 w-20 mx-auto rounded-2xl overflow-hidden flex items-center justify-center profile-photo-border"
                                style={{background: 'linear-gradient(135deg,#FDF3CC,#FAE495)'}}
                            >
                                {photoUrl ? (
                                    <img
                                        src={photoUrl}
                                        alt={profile.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <UserIcon size={36} className="text-[#1A1208]" strokeWidth={1.5}/>
                                )}
                                {profile.is_verified && (
                                    <span
                                        className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
                                        style={{background: 'linear-gradient(135deg,#FFCF00,#FFE033)'}}
                                    >
                                        <BadgeCheck size={11} className="text-[#1A1208]"/>
                                    </span>
                                )}
                            </div>
                        </div>
                        <DialogTitle
                            className="text-xl font-bold text-foreground"
                            style={{fontFamily: 'var(--font-heading, serif)'}}
                        >
                            View {profile.name}&apos;s Profile
                        </DialogTitle>
                        <DialogDescription className="text-sm leading-relaxed pt-1">
                            You are browsing as a guest. To view full profile details, photos, and
                            connect with members, please create a free account or login.
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                        {[
                            {icon: UserPlus, text: 'Create a free profile in minutes'},
                            {icon: BadgeCheck, text: 'Browse verified matrimony profiles'},
                            {icon: Lock, text: 'Secure & private matchmaking platform'},
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.text} className="flex items-start gap-2.5">
                                    <span
                                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                        style={{background: 'rgba(255,207,0,0.12)'}}
                                    >
                                        <Icon size={13} style={{color: '#FFCF00'}}/>
                                    </span>
                                    {item.text}
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-6 flex flex-col gap-3">
                        <Link
                            href="/register"
                            className="btn-gold hover-shimmer inline-flex items-center justify-center gap-2 w-full"
                            style={{height: '2.75rem', borderRadius: '0.875rem'}}
                            onClick={() => onOpenChange(false)}
                        >
                            <Sparkles size={16}/> Create Free Account
                        </Link>
                        <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 w-full rounded-xl border font-semibold text-sm transition-colors hover:bg-muted/50"
                            style={{
                                height: '2.75rem',
                                borderColor: 'rgba(255,207,0,0.35)',
                                color: '#FFCF00',
                            }}
                            onClick={() => onOpenChange(false)}
                        >
                            <LogIn size={16}/> Login
                        </Link>
                    </div>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Full profile access may also require an active subscription based on your plan.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
