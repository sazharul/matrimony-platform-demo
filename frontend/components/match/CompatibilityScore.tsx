import {cn, getScoreBgColor} from '@/lib/utils';

interface CompatibilityScoreProps {
    score: number;
    size?: 'sm' | 'md' | 'lg';
}

export function CompatibilityScore({score, size = 'md'}: CompatibilityScoreProps) {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-1',
        lg: 'text-base px-3 py-1.5',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-semibold',
                sizeClasses[size],
                getScoreBgColor(score)
            )}
        >
      <span className="text-xs">♥</span>
            {Math.round(score)}% match
    </span>
    );
}

