import { cn } from '@/lib/utils';

interface ProfileGenderBadgeProps {
    gender?: 'male' | 'female' | null;
    className?: string;
}

export function ProfileGenderBadge({ gender, className }: ProfileGenderBadgeProps) {
    if (gender !== 'male' && gender !== 'female') return null;

    const label = gender === 'male' ? 'Male' : 'Female';

    return (
        <span
            className={cn(
                'absolute bottom-2 left-2 z-10 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide shadow-sm ring-1 ring-[#1A1208]/15',
                'bg-[#FFCF00] text-[#1A1208]',
                className,
            )}
        >
            {label}
        </span>
    );
}
