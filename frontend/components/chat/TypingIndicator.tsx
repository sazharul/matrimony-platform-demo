'use client';

import {cn} from '@/lib/utils';

interface TypingIndicatorProps {
    name?: string;
    className?: string;
}

export function TypingIndicator({name, className}: TypingIndicatorProps) {
    return (
        <div className={cn('flex items-end gap-2', className)}>
            <div
                className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-meta flex-shrink-0">
                {name ? name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
          <span
              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
              style={{animationDelay: '0ms'}}
          />
                    <span
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{animationDelay: '150ms'}}
                    />
                    <span
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{animationDelay: '300ms'}}
                    />
                </div>
            </div>
        </div>
    );
}

