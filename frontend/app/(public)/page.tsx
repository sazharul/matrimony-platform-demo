import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {getSettings, getPage, getRecentMembers} from '@/services/publicService';
import type {PageDetail} from '@/types/page';
import {
    Heart, Search, Star, Shield, Users, CheckCircle, ArrowRight,
    BadgeCheck, Zap, MessageCircle, Video, Crown, ChevronRight,
    MapPin, GraduationCap, HandHeart, Sparkles, Lock, PhoneCall,
    Quote, Globe, SlidersHorizontal, Headset,
} from 'lucide-react';
import { EngagementRingIcon } from '@/components/ui/icons';
import AnimateSection from '@/components/public/AnimateSection';
import NewMembersPreview from '@/components/public/NewMembersPreview';
import { HomeMissionSection } from '@/components/public/HomeMissionSection';
import { HomeFeatureShowcase } from '@/components/public/HomeFeatureShowcase';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    return {
        title: settings.meta_title ?? 'MatriConnect — Find Your Perfect Life Partner',
        description: settings.meta_description ?? 'Find your perfect life partner on MatriConnect.',
        keywords: settings.meta_keywords ?? 'matrimony, marriage, Bangladesh, bride, groom, matchmaking',
        openGraph: {
            title: settings.meta_title ?? 'MatriConnect — Matrimony',
            description: settings.meta_description ?? '',
            type: 'website',
        },
    };
}

/* ─── Static Data ─────────────────────────────────────────────────────────── */

const platformFeatures = [
    {icon: BadgeCheck, label: 'Verified Member Profiles'},
    {icon: Lock, label: 'Secure & Private Platform'},
    {icon: HandHeart, label: 'Family-Friendly Matchmaking'},
    {icon: Search, label: 'Smart Search & Filters'},
    {icon: Crown, label: 'Subscription-Based Premium Features'},
    {icon: PhoneCall, label: 'Dedicated Customer Support'},
];

const features = [
    {
        icon: Shield,
        title: 'Verified Profiles',
        desc: 'Every profile passes strict NID, photo and email verification before being visible to matches.'
    },
    {
        icon: Zap,
        title: 'Smart Matching',
        desc: 'Our algorithm scores compatibility on religion, education, location, lifestyle, and more.'
    },
    {
        icon: Lock,
        title: 'Privacy First',
        desc: 'Contact details are never shared without consent. You control exactly who sees what.'
    },
    {
        icon: Users,
        title: 'Trusted Community',
        desc: 'Thousands of families across Bangladesh found their perfect match right here.'
    },
    {
        icon: MessageCircle,
        title: 'Secure Chat',
        desc: 'Chat privately with mutual connections. No unsolicited messages or spam — ever.'
    },
    {
        icon: Video,
        title: 'Voice & Video Calls',
        desc: 'Gold & Platinum members can make encrypted voice and video calls inside the platform.'
    },
    {
        icon: SlidersHorizontal,
        title: 'Advanced Search',
        desc: 'You can easily search profiles using many filters including age, religion, location, education, profession, language, and other specific criteria.'
    },
    {
        icon: Globe,
        title: 'Global Reach',
        desc: 'Our platform connects you within Bangladesh or among the Non-Resident Bangladeshi (NRB) community worldwide.'
    },
    {
        icon: Headset,
        title: 'Ongoing Support',
        desc: 'We are here to answer your questions and provide support throughout your matchmaking journey, ensuring you feel confident and informed every step of the way.'
    },
];

const steps = [
    {
        step: '01',
        icon: BadgeCheck,
        title: 'Create Your Profile',
        desc: 'Sign up free. Build a rich profile with photos, preferences, religion, education, and family info.'
    },
    {
        step: '02',
        icon: Search,
        title: 'Discover Matches',
        desc: 'Browse daily smart suggestions or use advanced filters — age, height, location, career, and more.'
    },
    {
        step: '03',
        icon: HandHeart,
        title: 'Send Interest',
        desc: "Express interest. Once mutual, both of you unlock private chat and voice calls."
    },
    {
        step: '04',
        icon: EngagementRingIcon,
        title: 'Connect & Marry',
        desc: "It's easy to find out the best life partner for a happy married life on our platform."
    },
];

const plans = [
    {
        name: 'Free',
        price: '৳0',
        period: 'Forever',
        color: '#6B7280',
        bg: '#fff',
        features: ['10 profile views / day', '5 interests / day', 'Search & smart filters', 'Chat on request only'],
        cta: 'Get Started',
        href: '/register',
        highlight: false
    },
    {
        name: 'Silver',
        price: '৳499',
        period: '/month',
        color: '#9CA3AF',
        bg: '#fff',
        features: ['Unlimited profile views', '20 interests / day', 'Chat enabled', 'See profile visitors'],
        cta: 'Choose Silver',
        href: '/register',
        highlight: false
    },
    {
        name: 'Gold',
        price: '৳999',
        period: '/month',
        color: '#FFCF00',
        bg: 'linear-gradient(160deg,#fffbeb,#fef9e0)',
        features: ['Everything in Silver', '50 interests / day', 'Voice & Video calls', 'Unlimited daily matches'],
        cta: 'Choose Gold',
        href: '/register',
        highlight: true
    },
    {
        name: 'Platinum',
        price: '৳1,799',
        period: '/month',
        color: '#7C3AED',
        bg: '#fff',
        features: ['Everything in Gold', 'Unlimited interests', 'More photo uploads', 'Priority support'],
        cta: 'Choose Platinum',
        href: '/register',
        highlight: false
    },
];

const testimonials = [
    {
        name: 'Farhan & Nusrat', location: 'Dhaka', year: '2024', initials: 'FN', occupation: 'Engineer & Doctor',
        text: 'We met through MatriConnect in 2024. The verified profiles gave our families great confidence. Alhamdulillah, we are happily married now — forever grateful!'
    },
    {
        name: 'Sabbir & Mitu', location: 'Chittagong', year: '2024', initials: 'SM', occupation: 'Banker & Teacher',
        text: "MatriConnect's smart matching suggested Sabbir to me. We chatted for weeks and our families connected. It was the most natural and respectful process."
    },
    {
        name: 'Rakib & Sumaiya', location: 'Sylhet', year: '2023', initials: 'RS', occupation: 'Businessman & Designer',
        text: "I was skeptical initially, but the profile verification process built real trust. Found my life partner within 3 months. Will recommend to everyone."
    },
];

const browseCategories = [
    {icon: '🕌', label: 'Muslim', query: 'religion=muslim'},
    {icon: '🛕', label: 'Hindu', query: 'religion=hindu'},
    {icon: '✝️', label: 'Christian', query: 'religion=christian'},
    {icon: '🎓', label: 'Graduates', query: 'education=bachelors'},
    {icon: '💼', label: 'Professionals', query: 'employed_in=private'},
    {icon: '🌍', label: 'NRB / Abroad', query: 'country=abroad'},
    {icon: '🏙️', label: 'Dhaka', query: 'city=dhaka'},
    {icon: '🌊', label: 'Chittagong', query: 'city=chittagong'},
    {icon: '🌿', label: 'Sylhet', query: 'city=sylhet'},
    {icon: '🌾', label: 'Rajshahi', query: 'city=rajshahi'},
];

const trustItems = [
    {icon: Shield, title: 'Face Verified', desc: 'Profiles verified with live face scan'},
    {icon: BadgeCheck, title: 'Photo Approved', desc: 'Admin-approved photos only'},
    {icon: Lock, title: 'Data Encrypted', desc: 'TLS encryption on all data'},
    {icon: PhoneCall, title: '24/7 Support', desc: 'Dedicated trust & safety team'},
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function HomePage() {
    const [settings, recentMembers] = await Promise.all([
        getSettings(),
        getRecentMembers(),
    ]);

    let heroPage: PageDetail | null = null;
    try {
        heroPage = await getPage('home_hero');
    } catch { /* static fallback */
    }

    const heroTitle = 'Find Your Perfect Life Partner';
    const heroBadge = "Find Your Perfect Life Partner";
    const heroSubtitle = heroPage?.meta_description ?? settings.meta_description
        ?? `Join thousands of verified profiles. Let ${settings.site_name}'s smart algorithm find your ideal match.`;
    const heroContent = "Connect with genuine and verified profiles through a secure matrimony platform designed to help individuals and families build meaningful relationships.";

    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'WebSite',
        name: settings.site_name, description: settings.meta_description,
        url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://MatriConnect.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://MatriConnect.com'}/search?query={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}/>

            {/* ══════════════════════════════════════════════════════════════════
                HERO — full-screen photo + layered dark/gold overlay
            ══════════════════════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden min-h-[94vh] flex flex-col justify-center">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="//images/home/hero-bg.svg"
                        alt="Happy couple — MatriConnect matrimony"
                        fill priority
                        className="object-cover object-center"
                        sizes="100vw"
                    />
                    {/* Primary dark overlay */}
                    <div className="absolute inset-0"
                         style={{background: 'linear-gradient(135deg,rgba(6,8,18,0.93) 0%,rgba(12,18,36,0.88) 50%,rgba(18,26,55,0.84) 100%)'}}/>
                    {/* Gold accent glows */}
                    <div className="hero-blob absolute -top-40 -left-40 h-125 w-125 rounded-full opacity-[0.12]"
                         style={{background: 'radial-gradient(circle,#FFCF00 0%,transparent 70%)'}}/>
                    <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full opacity-[0.08]"
                         style={{background: 'radial-gradient(circle,#FFE033 0%,transparent 70%)'}}/>
                    {/* Bottom fade to site bg */}
                    <div className="absolute bottom-0 left-0 w-full h-32"
                         style={{background: 'linear-gradient(to top,#1f1f1fc4,transparent)'}}/>
                </div>

                {/* Content */}
                <div
                    className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-15 pb-10 md:pt-15 md:pb-14 text-center">

                    {/* Badge */}
                    {/*<div*/}
                    {/*    className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-7"*/}
                    {/*    style={{*/}
                    {/*        background: 'rgba(255,207,0,0.15)',*/}
                    {/*        color: '#FFCF00',*/}
                    {/*        border: '1px solid rgba(255,207,0,0.35)'*/}
                    {/*    }}>{heroBadge}*/}
                    {/*</div>*/}

                    {/* H1 */}
                    <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.08] mb-6 tracking-tight"
                        style={{fontFamily: 'var(--font-heading,serif)', animationDelay: '80ms'}}>
                        {heroTitle.includes('Life Partner') ? (
                            <>
                                {heroTitle.split('Life Partner')[0]}
                                <span className="text-[#FFCF00]"> Life Partner</span>
                                {heroTitle.split('Life Partner')[1]}
                            </>
                        ) : heroTitle}
                    </h1>

                    {heroContent && (
                        <div
                            className="animate-fade-in prose prose-invert prose-sm max-w-2xl mx-auto mb-8 text-gray-200 font-medium [&_strong]:text-[#FFCF00]"
                            dangerouslySetInnerHTML={{__html: heroContent}}
                            style={{animationDelay: '160ms'}}
                        />
                    )}

                    {/* Feature Highlights */}
                    <div
                        className="animate-fade-in-up flex flex-wrap justify-center gap-3 sm:gap-4 mb-10 max-w-3xl mx-auto"
                        style={{animationDelay: '200ms'}}>
                        {[
                            {label: 'Verified Profiles'},
                            {label: 'Smart Match Suggestions'},
                            {label: 'Privacy & Security'},
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="inline-flex items-center gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full text-sm font-medium text-gray-200 transition-all duration-200 hover:border-[#FFCF00]/50 hover:bg-white/[0.08]"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,207,0,0.2)',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                                }}>
                                <CheckCircle size={15} className="shrink-0" style={{color: '#FFCF00'}}/>
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <p
                        className="animate-fade-in-up text-lg sm:text-xl md:text-2xl font-semibold text-white mb-7 tracking-tight"
                        style={{fontFamily: 'var(--font-heading,serif)', animationDelay: '240ms'}}>
                        Start Your Journey Today
                    </p>

                    {/* CTA buttons */}
                    <div
                        className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
                        style={{animationDelay: '280ms'}}>
                        <Link href="/register"
                              className="btn-gold hover-shimmer inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-bold text-[#1A1208] text-base min-h-[3.25rem] min-w-[220px] sm:min-w-0"
                              style={{height: 'auto'}}>
                            <Sparkles size={17}/> Create Free Profile
                        </Link>
                        <Link href="/search"
                              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-semibold text-white text-base border transition-all hover:bg-white/10 min-h-[3.25rem] min-w-[220px] sm:min-w-0"
                              style={{borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', height: 'auto'}}>
                            <Search size={17}/> Browse Profiles
                        </Link>
                    </div>

                    {/* Profile Discovery Section */}
                    <div
                        className="animate-fade-in-up mb-10 max-w-3xl mx-auto w-full"
                        style={{animationDelay: '340ms'}}>
                        <div
                            className="rounded-2xl px-6 py-8 sm:px-10 sm:py-10 text-center"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,207,0,0.22)',
                                backdropFilter: 'blur(12px)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                            }}>
                            <h2
                                className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight"
                                style={{fontFamily: 'var(--font-heading,serif)'}}>
                                Explore Matrimony Profiles
                            </h2>
                            <p className="text-base sm:text-lg font-medium text-gray-200 mb-3">
                                Looking for a Bride or Groom?
                            </p>
                            <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed mb-8 max-w-xl mx-auto">
                                Browse verified profiles based on age, religion, education, profession, and location to find compatible matches.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                <Link
                                    href="/search?gender=female"
                                    className="group flex flex-col items-center gap-3 rounded-xl px-6 py-5 transition-all duration-200 hover:-translate-y-1"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,207,0,0.22) 0%, rgba(255,207,0,0.10) 100%)',
                                        border: '1px solid rgba(255,207,0,0.45)',
                                        boxShadow: '0 4px 20px rgba(255,207,0,0.15)',
                                    }}>
                                    <span
                                        className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-110"
                                        style={{background: '#FFFFFF', border: '2px solid rgba(255,207,0,0.6)'}}>
                                        <Image
                                            src="/images/home/female_icon.png"
                                            alt=""
                                            width={72}
                                            height={72}
                                            className="h-full w-full object-cover object-top"
                                        />
                                    </span>
                                    <span className="font-bold text-white text-base">Browse Bride Profiles</span>
                                </Link>
                                <Link
                                    href="/search?gender=male"
                                    className="group flex flex-col items-center gap-3 rounded-xl px-6 py-5 transition-all duration-200 hover:-translate-y-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    }}>
                                    <span
                                        className="flex h-[4.5rem] w-[4.5rem] items-center justify-center overflow-hidden rounded-full transition-transform duration-200 group-hover:scale-110"
                                        style={{background: '#FFFFFF', border: '2px solid rgba(255,255,255,0.7)'}}>
                                        <Image
                                            src="/images/home/male_icon.png"
                                            alt=""
                                            width={72}
                                            height={72}
                                            className="h-full w-full object-cover object-top"
                                        />
                                    </span>
                                    <span className="font-bold text-white text-base">Browse Groom Profiles</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-float hidden sm:block">
                    <div
                        className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center pt-1.5">
                        <div className="w-1 h-2.5 rounded-full bg-white/40 animate-bounce"/>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════════
                VERIFIED MEMBER PROFILES / PLATFORM FEATURES
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section style={{background: '#FFCF00'}}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 stagger">
                            {platformFeatures.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div
                                        key={f.label}
                                        className="flex items-center gap-3.5 rounded-xl px-5 py-4 animate-fade-in-up transition-all duration-200"
                                        style={{
                                            background: 'rgba(255,255,255,0.35)',
                                            border: '1px solid rgba(26,18,8,0.12)',
                                        }}>
                                        <CheckCircle size={20} className="shrink-0 text-[#1A1208]" strokeWidth={2.5}/>
                                        <Icon size={19} className="shrink-0 text-[#1A1208]" strokeWidth={2.25}/>
                                        <span className="text-base sm:text-lg font-bold text-[#1A1208] leading-snug">
                                            {f.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                MISSION — We help find your life partner (Section 3)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeMissionSection siteName={settings.site_name} />

            {/* ══════════════════════════════════════════════════════════════════
                CHAT FOR FREE (Section 4)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeFeatureShowcase
                eyebrow="Connect Instantly"
                title="Chat for Free"
                description="Explore profiles, express interest, and start meaningful conversations — all at no cost. Once there is mutual interest, unlock private chat and get to know your match in a safe, respectful space."
                imageSrc="/images/home/chat-for-free.svg"
                imageAlt="Free chat on MatriConnect matrimony platform"
                icon={MessageCircle}
                bullets={[
                    'Send interests and chat after mutual connection',
                    'No spam — only approved conversations',
                    'Family-friendly messaging environment',
                ]}
                cta={{ label: 'Browse Profiles', href: '/search' }}
            />

            {/* ══════════════════════════════════════════════════════════════════
                HD VIDEO CALLING (Section 5)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeFeatureShowcase
                eyebrow="See Each Other Clearly"
                title="HD Video Calling"
                description="Chatting is a good start — but seeing each other brings you closer. Enjoy smooth, HD video calls directly through the platform, with no phone numbers needed. Private, secure, and face-to-face."
                imageSrc="/images/home/hd-video-calling.svg"
                imageAlt="HD video calling on MatriConnect"
                icon={Video}
                reverse
                bullets={[
                    'Encrypted voice and video inside the app',
                    'No personal phone numbers shared',
                    'Available for premium members',
                ]}
                cta={{ label: 'View Membership', href: '/plan' }}
            />

            {/* ══════════════════════════════════════════════════════════════════
                COMPLETE PRIVACY (Section 7)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeFeatureShowcase
                eyebrow="Your Data, Your Control"
                title="Complete Privacy"
                description="Your profile, your rules. Keep your photos private and choose exactly who gets to see them. Contact details are never shared without your consent — total control, complete privacy."
                imageSrc="/images/home/complete-privacy.svg"
                imageAlt="Complete privacy controls on MatriConnect"
                icon={Lock}
                bullets={[
                    'Control who views your photos and details',
                    'Contact info shared only with consent',
                    'Secure, encrypted platform infrastructure',
                ]}
                cta={{ label: 'Learn About Privacy', href: '/privacy-policy' }}
            />

            {/* ══════════════════════════════════════════════════════════════════
                FACE VERIFICATION (Section 10)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeFeatureShowcase
                eyebrow="Trust & Safety"
                title="Face Verification"
                description={`${settings.site_name} cares about your safety. That is why we use live Face Verification to confirm each member's identity and stop fake profiles — so you can connect with confidence.`}
                imageSrc="/images/home/face-verification.svg"
                imageAlt="Face verification on MatriConnect"
                icon={Shield}
                reverse
                bullets={[
                    'Live face scan matched to profile photos',
                    'Reduces fake and misleading accounts',
                    'Builds trust for families and matches',
                ]}
                cta={{ label: 'Create Verified Profile', href: '/register' }}
            />

            {/* ══════════════════════════════════════════════════════════════════
                VERIFICATION BADGE (Section 12)
            ══════════════════════════════════════════════════════════════════ */}
            <HomeFeatureShowcase
                eyebrow="Verified Members"
                title="Verification Badge"
                description="We award Verification Badges to members who complete face verification and more — so you can instantly spot genuine, trusted profiles."
                imageSrc="/images/home/verification-badge.svg"
                imageAlt="Verification badges on MatriConnect profiles"
                icon={BadgeCheck}
                bullets={[
                    'Face scan verification badge',
                    'Visible trust indicators on every profile',
                ]}
                cta={{ label: 'Get Verified', href: '/register' }}
            />

            <AnimateSection>
                <section className="py-16 md:py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-sm font-bold uppercase tracking-widest mb-3 text-[#1A1208]">
                                Platform Benefits
                            </p>
                            <h2 className="text-2xl md:text-4xl font-bold text-[#1A1208]">
                                Why Families Choose {settings.site_name}
                            </h2>
                            <p className="text-meta font-semibold mt-4 max-w-xl mx-auto text-base leading-relaxed">
                                We combine traditional values with modern technology — giving families a safe, private,
                                intelligent matchmaking platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger">
                            {features.map((f) => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.title}
                                         className="group relative overflow-hidden bg-white rounded-2xl p-8 border-2 border-[#FFCF00] shadow-md transition-all duration-250 animate-fade-in-up hover:shadow-xl"
                                         style={{boxShadow: '0 4px 16px rgba(255,207,0,0.12)'}}>
                                        <div
                                            className="h-14 w-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                                            style={{background: 'rgba(255,207,0,0.15)'}}>
                                            <Icon size={26} className="text-[#1A1208]" strokeWidth={2.25}/>
                                        </div>
                                        <h3 className="font-bold text-[#1A1208] mb-3 text-lg">{f.title}</h3>
                                        <p className="text-[#1A1208] font-medium text-base leading-relaxed">{f.desc}</p>
                                        <div
                                            className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                                            style={{background: '#FFCF00'}}/>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            <NewMembersPreview members={recentMembers}/>

            {/* ══════════════════════════════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-16 md:py-24" style={{background: 'linear-gradient(135deg,#0d1117,#161b27)'}}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-sm font-bold uppercase tracking-widest mb-3 text-[#FFCF00]">Simple Process</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-white">Your Journey to a Perfect Match</h2>
                            <p className="text-gray-300 font-medium mt-3 max-w-lg mx-auto text-base">
                                Four steps — from sign-up to finding the one — guided entirely by our secure, smart platform.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
                            {steps.map((s, i) => {
                                const Icon = s.icon;
                                return (
                                    <div key={s.step} className="relative animate-fade-in-up">
                                        {i < steps.length - 1 && (
                                            <div
                                                className="hidden lg:block absolute top-10 left-full w-full h-px z-0 pointer-events-none"
                                                style={{background: 'linear-gradient(to right,rgba(255,207,0,0.4),transparent)'}}/>
                                        )}
                                        <div className="step-card relative z-10 rounded-2xl p-6 h-full border"
                                             style={{
                                                 background: 'rgba(255,255,255,0.04)',
                                                 borderColor: 'rgba(255,207,0,0.15)'
                                             }}>
                                            <div
                                                className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 font-black text-[#1A1208] text-lg"
                                                style={{background: '#FFCF00'}}>
                                                {s.step}
                                            </div>
                                            <Icon size={22} className="text-[#FFCF00] mb-3" strokeWidth={2.25}/>
                                            <h3 className="font-bold text-white mb-2 text-base">{s.title}</h3>
                                            <p className="text-gray-300 font-medium text-sm leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-center mt-12">
                            <Link href="/register"
                                  className="btn-gold hover-shimmer inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-[#1A1208] text-base"
                                  style={{height: 'auto'}}>
                                Start for Free — It takes 2 minutes <ArrowRight size={16}/>
                            </Link>
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                TRUST & SAFETY
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="py-14 bg-white border-y border-gray-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10">
                            <p className="text-sm font-bold uppercase tracking-widest mb-2 text-[#1A1208]">
                                Safety First
                            </p>
                            <h2 className="text-xl md:text-2xl font-bold text-[#1A1208]">Your Safety is Our Priority</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
                            {trustItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className="text-center group animate-fade-in-up">
                                        <div
                                            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-3 ring-pulse transition-transform duration-300 group-hover:scale-110"
                                            style={{background: 'rgba(255,207,0,0.15)'}}>
                                            <Icon size={26} className="text-[#1A1208]" strokeWidth={2.25}/>
                                        </div>
                                        <p className="font-bold text-[#1A1208] text-base">{item.title}</p>
                                        <p className="text-meta font-medium text-sm mt-1">{item.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ══════════════════════════════════════════════════════════════════
                FINAL CTA BANNER
            ══════════════════════════════════════════════════════════════════ */}
            <AnimateSection>
                <section className="relative overflow-hidden py-24" style={{background: '#FFCF00'}}>
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                         style={{backgroundImage: 'radial-gradient(circle at 10% 50%,#fff 0%,transparent 55%),radial-gradient(circle at 90% 20%,#fff 0%,transparent 45%)'}}/>
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <div
                            className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float"
                            style={{background: 'rgba(26,18,8,0.12)'}}>
                            <Heart size={36} className="text-[#1A1208]" fill="#1A1208"/>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#1A1208] mb-4">Begin Your Journey Today</h2>
                        <p className="text-[#1A1208] font-semibold text-base mb-10 max-w-md mx-auto leading-relaxed">
                            Join {settings.site_name} — registration is completely free. Thousands of verified families
                            are waiting to find the right match.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Link href="/register"
                                  className="hover-shimmer inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold bg-[#1A1208] text-[#FFCF00] text-base transition-all hover:scale-[1.02]"
                                  style={{boxShadow: '0 6px 24px rgba(0,0,0,0.18)'}}>
                                <Sparkles size={17}/> Get Started — It&apos;s Free
                            </Link>
                            <Link href="/about"
                                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#1A1208] text-base border-2 border-[#1A1208]/30 hover:bg-[#1A1208]/10 transition-colors">
                                Learn More <ArrowRight size={16}/>
                            </Link>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-6 text-[#1A1208] font-semibold text-sm">
                            <span className="flex items-center gap-1.5"><CheckCircle size={14}/> Free Registration</span>
                            <span className="flex items-center gap-1.5"><Shield size={14}/> 100% Verified Profiles</span>
                            <span className="flex items-center gap-1.5"><Lock size={14}/> Secure & Private</span>
                            <span className="flex items-center gap-1.5"><HandHeart size={14}/> Family-Friendly</span>
                        </div>
                    </div>
                </section>
            </AnimateSection>
        </>
    );
}
