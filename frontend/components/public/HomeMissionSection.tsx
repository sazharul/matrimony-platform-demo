import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Quote, Sparkles } from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';

interface HomeMissionSectionProps {
    siteName: string;
}

export function HomeMissionSection({ siteName }: HomeMissionSectionProps) {
    return (
        <AnimateSection>
            <section className="py-16 md:py-20 bg-white border-y border-[#E8DFCC]/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div className="animate-fade-in-up order-2 lg:order-1">
                            <h2
                                className="text-3xl md:text-4xl lg:text-[2rem] font-bold text-[#1A1208] leading-tight mb-5"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                At {siteName}, <br/> We Help You Find Your{' '}
                                <span className="text-[#FFCF00] bg-[#1A1208] px-2 py-0.5 rounded-lg inline-block">
                                    Life Partner
                                </span>
                            </h2>

                            <div
                                className="relative rounded-2xl p-6 md:p-8 border-2 border-[#FFCF00] mb-8"
                                style={{
                                    background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%)',
                                    boxShadow: '0 8px 32px rgba(255,207,0,0.12)',
                                }}
                            >
                                <Quote
                                    size={32}
                                    className="text-[#FFCF00] mb-3 opacity-80"
                                    strokeWidth={2}
                                />
                                <p className="text-[#1A1208] font-semibold text-base md:text-lg leading-relaxed italic">
                                    &ldquo;Marriage is not just about two people — it is about two families
                                    building a future together. We built {siteName} to honour that journey.&rdquo;
                                </p>
                                <p className="mt-4 text-sm font-bold text-meta">
                                    — The {siteName} Team
                                </p>
                            </div>
                        </div>

                        <div className="relative animate-fade-in-up order-1 lg:order-2">
                            <div
                                className="relative aspect-[5/4] w-full overflow-hidden rounded-3xl border-2 border-[#FFCF00]"
                                style={{ boxShadow: '0 24px 64px rgba(255,207,0,0.2)' }}
                            >
                                <Image
                                    src="/images/home/life-partner.svg"
                                    alt={`${siteName} — helping you find your life partner`}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AnimateSection>
    );
}
