'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface AnimateSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number; // in ms
}

/**
 * Wraps content in a div that fades + slides up when it enters the viewport.
 * Uses IntersectionObserver — no layout shift on initial load.
 */
export default function AnimateSection({ children, className = '', delay = 0 }: AnimateSectionProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('scroll-in-view');
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div ref={ref} className={`scroll-animate ${className}`}>
            {children}
        </div>
    );
}

