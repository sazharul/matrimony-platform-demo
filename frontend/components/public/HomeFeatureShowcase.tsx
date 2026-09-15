import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';

export interface HomeFeatureShowcaseProps {
    eyebrow: string;
    title: string;
    description: string;
    imageSrc: string;
    imageAlt: string;
    icon: LucideIcon;
    reverse?: boolean;
    variant?: 'light' | 'cream' | 'dark';
    bullets?: string[];
    cta?: { label: string; href: string };
}

export function HomeFeatureShowcase({
    eyebrow,
    title,
    description,
    imageSrc,
    imageAlt,
    icon: Icon,
    reverse = false,
    variant = 'light',
    bullets,
    cta,
}: HomeFeatureShowcaseProps) {
    const isDark = variant === 'dark';
    const isCream = variant === 'cream';

    const sectionClass = isDark
        ? 'py-16 md:py-24'
        : isCream
            ? 'py-16 md:py-24 bg-[#FFF9E6]'
            : 'py-16 md:py-24 bg-white';

    const sectionStyle = isDark
        ? { background: 'linear-gradient(135deg,#0d1117,#161b27)' }
        : undefined;

    return (
        <AnimateSection>
            <section className={sectionClass} style={sectionStyle}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                            reverse ? 'lg:[&>*:first-child]:order-2' : ''
                        }`}
                    >
                        {/* Image */}
                        <div className="relative animate-fade-in-up">
                            <div
                                className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-2 border-[#FFCF00] shadow-xl"
                                style={{ boxShadow: '0 20px 60px rgba(255,207,0,0.18)' }}
                            >
                                <Image
                                    src={imageSrc}
                                    alt={imageAlt}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(255,207,0,0.08) 0%, transparent 55%)',
                                    }}
                                />
                            </div>
                            <div
                                className="absolute -bottom-4 -right-4 hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#FFCF00] shadow-lg"
                                style={{ background: '#FFCF00' }}
                            >
                                <Icon size={28} className="text-[#1A1208]" strokeWidth={2.25} />
                            </div>
                        </div>

                        {/* Copy */}
                        <div className="animate-fade-in-up min-w-0">
                            <p
                                className={`text-sm font-bold uppercase tracking-widest mb-3 ${
                                    isDark ? 'text-[#FFCF00]' : 'text-[#1A1208]'
                                }`}
                            >
                                {eyebrow}
                            </p>
                            <h2
                                className={`text-2xl md:text-4xl font-bold leading-tight mb-5 ${
                                    isDark ? 'text-white' : 'text-[#1A1208]'
                                }`}
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                {title}
                            </h2>
                            <p
                                className={`text-base md:text-lg font-medium leading-relaxed mb-6 ${
                                    isDark ? 'text-gray-300' : 'text-meta'
                                }`}
                            >
                                {description}
                            </p>

                            {bullets && bullets.length > 0 && (
                                <ul className="space-y-3 mb-8">
                                    {bullets.map((item) => (
                                        <li
                                            key={item}
                                            className={`flex items-start gap-3 text-sm md:text-base font-medium ${
                                                isDark ? 'text-gray-200' : 'text-[#1A1208]'
                                            }`}
                                        >
                                            <span
                                                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                                style={{ background: '#FFCF00' }}
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {cta && (
                                <Link
                                    href={cta.href}
                                    className={`inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] ${
                                        isDark
                                            ? 'bg-[#FFCF00] text-[#1A1208] hover:brightness-105'
                                            : 'bg-[#1A1208] text-[#FFCF00] hover:bg-[#2a1f0f]'
                                    }`}
                                >
                                    {cta.label}
                                    <ArrowRight size={16} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </AnimateSection>
    );
}
