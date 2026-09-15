'use client';

import Link from 'next/link';
import {Progress} from '@/components/ui/progress';
import {CheckCircleIcon} from '@/components/ui/icons';

interface CompletionStatus {
    percentage: number;
    has_basic_info: boolean;
    has_religious_detail: boolean;
    has_family_detail: boolean;
    has_education: boolean;
    has_lifestyle: boolean;
    has_horoscope: boolean;
    has_preferences: boolean;
    has_photo: boolean;
    has_about_me: boolean;
}

const STEPS = [
    {key: 'has_basic_info', label: 'Basic Info', href: '/profile/edit?tab=basic'},
    {key: 'has_photo', label: 'Photo', href: '/profile/edit?tab=photo'},
    {key: 'has_religious_detail', label: 'Religion', href: '/profile/edit?tab=religion'},
    {key: 'has_family_detail', label: 'Family', href: '/profile/edit?tab=family'},
    {key: 'has_education', label: 'Career', href: '/profile/edit?tab=career'},
    {key: 'has_lifestyle', label: 'Lifestyle', href: '/profile/edit?tab=lifestyle'},
    {key: 'has_preferences', label: 'Preferences', href: '/profile/edit?tab=preferences'},
    {key: 'has_about_me', label: 'About Me', href: '/profile/edit?tab=basic'},
];

export function ProfileCompletionBar({status}: { status: CompletionStatus }) {
    const missing = STEPS.filter((s) => !status[s.key as keyof CompletionStatus]);

    return (
        <div className="card-premium p-5 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Profile Completion</h3>
                <span
                    className={`text-sm font-bold ${
                        status.percentage >= 80 ? 'text-green-600' : status.percentage >= 50 ? 'text-[var(--gold-600)]' : 'text-destructive'
                    }`}
                >
          {status.percentage}%
        </span>
            </div>

            <Progress value={status.percentage} className="h-2 mb-3 [&>div]:bg-gradient-to-r [&>div]:from-[var(--gold-600)] [&>div]:to-[var(--gold-400)] [&>div]:transition-all [&>div]:duration-700"/>

            {missing.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground mb-2">Complete to get more matches:</p>
                    <div className="flex flex-wrap gap-2">
                        {missing.map((step) => (
                            <Link
                                key={step.key}
                                href={step.href}
                                className="text-xs bg-[var(--gold-50)] text-[var(--gold-700)] border border-[var(--gold-200)] rounded-full px-3 py-1 hover:bg-[var(--gold-100)] transition-colors"
                            >
                                + {step.label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {missing.length === 0 && (
                <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircleIcon size={14} strokeWidth={2}/> Profile complete! You have the best chance of matching.
                </p>
            )}
        </div>
    );
}

