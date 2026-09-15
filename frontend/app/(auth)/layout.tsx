import type {Metadata} from 'next';
import {GuestGuard} from '@/components/auth/GuestGuard';
import Link from 'next/link';
import {getSettings} from '@/services/publicService';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'MatriConnect';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    const siteName = settings.site_name ?? APP_NAME;

    return {
        title: {default: 'Login', template: `%s | ${siteName}`},
    };
}

export default async function AuthLayout({children}: { children: React.ReactNode }) {
    const settings = await getSettings();
    const siteName = settings.site_name ?? APP_NAME;
    const siteSlogan = settings.site_slogan ?? 'Find Your Perfect Match';

    return (
        <GuestGuard>
            <div className="min-h-screen flex">
                {/* ── Left decorative panel (desktop) ── */}
                <div
                    className="hidden lg:flex flex-col justify-between w-[46%] relative overflow-hidden"
                    style={{background: 'linear-gradient(145deg, #1A1208 0%, #3C2904 45%, #5A3F06 75%, #7A590A 100%)'}}
                >
                    {/* Decorative rings */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border border-[#FFCF00]/10"/>
                        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full border border-[#FFCF00]/15"/>
                        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full border border-[#FFCF00]/8"/>
                        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border border-[#FFE033]/12"/>
                        {/* Gold glow blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
                             style={{background: 'radial-gradient(circle, rgba(255,207,0,0.12) 0%, transparent 70%)'}}/>
                    </div>

                    {/* Top logo */}
                    <div className="relative z-10 p-10">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                 style={{background: 'linear-gradient(135deg, #FFCF00, #FFE033)'}}>
                                <svg className="w-5 h-5 text-[#1A1208]" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[#FFCF00]">{siteName}</h1>
                                <p className="text-xs text-[#FFE033] font-medium tracking-widest uppercase">{siteSlogan}</p>
                            </div>
                        </Link>
                    </div>

                    {/* Center content */}
                    <div className="relative z-10 px-10 py-8">
                        <div className="mb-8">
                            <span className="text-[#FFCF00] text-xs font-bold tracking-widest uppercase mb-3 block">
                                Find Your Perfect Life Partner
                            </span>
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4"
                                style={{fontFamily: 'var(--font-heading)'}}>
                                Find Your{' '}
                                <span className="text-[#FFCF00]">Perfect Match</span>
                            </h2>
                            <p className="text-white/85 text-sm font-medium leading-relaxed max-w-xs">
                                Join a trusted matrimony platform designed to help individuals and families connect with compatible life partners through secure and intelligent matchmaking.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="flex flex-col gap-3">
                            {[
                                'Verified Profiles',
                                'Smart Match Suggestions',
                                'Privacy & Security',
                                'Start Your Journey Today',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                         style={{background: 'linear-gradient(135deg, #FFCF00, #FFE033)'}}>
                                        <svg className="w-3 h-3 text-[#1A1208]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </div>
                                    <p className="text-white/90 text-sm font-medium">{feature}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom tagline */}
                    <div className="relative z-10 p-10">
                        <p className="text-white/70 text-xs font-medium italic">&ldquo;Where meaningful relationships begin&rdquo;</p>
                    </div>

                    {/* Diagonal separator */}
                    <div className="absolute right-0 top-0 bottom-0 w-8"
                         style={{background: 'linear-gradient(to right, transparent, rgba(247,243,236,0.06))'}}/>
                </div>

                {/* ── Right form panel ── */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12"
                     style={{background: 'linear-gradient(160deg, #F7F3EC 0%, #FCF8F2 100%)'}}>
                    {/* Mobile logo */}
                    <Link href="/" className="text-center mb-8 lg:hidden block">
                        <h1 className="text-3xl font-bold text-[#1A1208]">{siteName}</h1>
                        <p className="text-xs text-muted-foreground font-medium mt-1 tracking-widest uppercase">{siteName} Matrimony</p>
                    </Link>

                    <div className="w-full max-w-md animate-fade-in-up">
                        {children}
                    </div>
                </div>
            </div>
        </GuestGuard>
    );
}