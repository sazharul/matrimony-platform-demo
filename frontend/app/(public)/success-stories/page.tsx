import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/services/publicService';
import {
    Heart, MapPin, Star, ArrowRight, Quote, Sparkles,
    BadgeCheck, CheckCircle,
} from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    return {
        title: `Success Stories — ${settings.site_name}`,
        description: `Real couples who found their life partner on ${settings.site_name}. Read their matrimony success stories.`,
        openGraph: {
            title: `Success Stories — ${settings.site_name}`,
            description: 'Read real matrimony success stories from couples who found each other on MatriConnect.',
            type: 'website',
        },
    };
}

/* ─── Static Stories Data (fictional demo content) ───────────────────────── */

const stories = [
    {
        id: 1,
        names: 'Farhan & Nusrat',
        location: 'Dhaka',
        year: 'March 2024',
        initials: 'FN',
        occupation: 'Software Engineer & MBBS Doctor',
        religion: 'Muslim',
        text: `We both signed up on MatriConnect in early 2024, initially just to see what it was like. Within the first week, Nusrat's profile appeared in my daily suggestions with a compatibility score of 91%.

I sent an interest, she accepted, and we started chatting. The conversations felt natural and respectful from the very beginning. Our families connected after just three weeks, and after two months, Alhamdulillah, we got married.

The profile verification feature gave our families real confidence — knowing every profile has been manually verified was a big deal for us. We're now settled in Dhaka and couldn't be happier.`,
        featured: true,
        tags: ['NID Verified', 'Smart Match', 'Dhaka'],
    },
    {
        id: 2,
        names: 'Sabbir & Mitu',
        location: 'Chittagong',
        year: 'January 2024',
        initials: 'SM',
        occupation: 'Bank Manager & Primary School Teacher',
        religion: 'Muslim',
        text: `I had been registered on MatriConnect for about two months when Sabbir's profile caught my attention — he seemed serious, had a verified profile, and his family background matched what my parents were looking for.

He sent an interest. I accepted. We chatted for about four weeks before exchanging numbers through the platform's secure contact feature. Our families met in February and the wedding was in April.

The whole process was dignified and felt very safe. I never once felt pressured or uncomfortable. Highly recommend MatriConnect to anyone seriously looking.`,
        featured: true,
        tags: ['Silver Plan', 'Teacher', 'Chittagong'],
    },
    {
        id: 3,
        names: 'Rakib & Sumaiya',
        location: 'Sylhet',
        year: 'November 2023',
        initials: 'RS',
        occupation: 'Entrepreneur & Graphic Designer',
        religion: 'Muslim',
        text: `My family was hesitant about online matrimony at first. But when I showed them MatriConnect's NID verification system and how contact details are protected, they agreed to try.

Sumaiya's profile came up in my search — same district, similar values, both non-smokers with similar family types. I sent an interest and we matched within a day.

After 3 months of getting to know each other through the app and family meetings, we got married in November 2023. MatriConnect made the whole process feel safe and traditional at the same time.`,
        featured: false,
        tags: ['Advanced Search', 'Sylhet', 'Family Match'],
    },
    {
        id: 4,
        names: 'Karim & Rima',
        location: 'Rajshahi',
        year: 'August 2023',
        initials: 'KR',
        occupation: 'Government Officer & Nurse',
        religion: 'Muslim',
        text: `I found Rima through MatriConnect's location filter — I wanted someone from Rajshahi and she appeared in the top results. Her profile was verified and complete, which made the first message easy to send.

After two weeks of chatting, our parents spoke on the phone. A month later, we had our engagement ceremony. The Gold plan's voice call feature was genuinely helpful — we got to hear each other's voices before the family meeting which made things much more comfortable.`,
        featured: false,
        tags: ['Gold Plan', 'Voice Call', 'Rajshahi'],
    },
    {
        id: 5,
        names: 'Tanvir & Farhana',
        location: 'Khulna',
        year: 'May 2023',
        initials: 'TF',
        occupation: 'NRB UK (IT Manager) & Pharmacist',
        religion: 'Muslim',
        text: `I was based in the UK and needed a platform that had verified profiles back in Bangladesh. MatriConnect's NRB filter made it so easy. I found Farhana in Khulna through the "Abroad / NRB" search option.

The video call feature on the Gold plan was essential for us — we had several family calls over video before I flew back to Bangladesh for the wedding. Without MatriConnect, this would have taken years. Our nikah was in May 2023.`,
        featured: false,
        tags: ['NRB', 'Video Call', 'Gold Plan', 'UK'],
    },
    {
        id: 6,
        names: 'Hasan & Tania',
        location: 'Cumilla',
        year: 'February 2023',
        initials: 'HT',
        occupation: 'Civil Engineer & Lecturer',
        religion: 'Muslim',
        text: `We were both using the free plan, which was honestly more than enough to get started. I found Tania's profile through the Profession filter — I searched for women with a teaching background and she came up.

We chatted for 6 weeks before our families met. No pressure, no rushing. The platform felt very respectful and focused on serious relationships only. Alhamdulillah, we're now one year married with a baby on the way!`,
        featured: false,
        tags: ['Free Plan', 'Profession Search', 'Cumilla'],
    },
];

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'MatriConnect Success Stories',
    description: 'Real couples who found their life partner on MatriConnect matrimony platform.',
    itemListElement: stories.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.names,
        description: s.text.slice(0, 150),
    })),
};

export default async function SuccessStoriesPage() {
    const settings = await getSettings();

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* ── Page Header ── */}
            <div className="relative overflow-hidden py-20 md:py-28"
                style={{ background: 'linear-gradient(135deg,#0d1117 0%,#161b27 50%,#1a2744 100%)' }}>
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-10"
                        style={{ background: 'radial-gradient(circle,#FFCF00 0%,transparent 70%)' }} />
                    <div className="absolute top-10 right-0 h-64 w-64 rounded-full opacity-8"
                        style={{ background: 'radial-gradient(circle,#FFE033 0%,transparent 70%)' }} />
                </div>
                <div className="relative max-w-4xl mx-auto px-4 text-center">
                    <p className="mb-4 text-sm text-white/60">
                        Demo content only — these stories are fictional and not real user testimonials.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
                        style={{ background: 'rgba(255,207,0,0.12)', color: '#FFCF00', border: '1px solid rgba(255,207,0,0.3)' }}>
                        <Heart size={11} fill="currentColor" /> Real Stories · Real People
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight animate-fade-in-up"
                        style={{ fontFamily: 'var(--font-heading,serif)' }}>
                        3,500+ Couples Found Their
                        <span className="text-[#FFCF00]"> Perfect Match</span>
                    </h1>
                    <p className="text-[#4A3F2E] text-lg max-w-2xl mx-auto mt-4 leading-relaxed animate-fade-in-up"
                        style={{ animationDelay: '100ms' }}>
                        These are real stories from real families who trusted {settings.site_name} to guide them to their life partner.
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg mx-auto animate-fade-in-up"
                        style={{ animationDelay: '200ms' }}>
                        {[
                            { value: '3,500+', label: 'Success Stories' },
                            { value: '50,000+', label: 'Happy Members' },
                            { value: '64', label: 'Districts' },
                        ].map((s) => (
                            <div key={s.label} className="text-center">
                                <p className="text-xl md:text-2xl font-black" style={{ color: '#FFCF00' }}>{s.value}</p>
                                <p className="text-[#4A3F2E] text-xs">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Featured Stories ── */}
            <AnimateSection>
                <section className="py-16 md:py-20" style={{ background: '#F8F9FB' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-[#1A1208]">Featured</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Highlighted Stories</h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {stories.filter(s => s.featured).map((story) => (
                                <div key={story.id}
                                    className="bg-white rounded-2xl p-8 border border-gray-100 flex flex-col gap-5"
                                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.07)', borderLeft: '4px solid #FFCF00' }}>
                                    <div className="flex items-start gap-4">
                                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-[#1A1208] text-xl shrink-0"
                                            style={{ background: '#FFCF00' }}>
                                            {story.initials}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-900 text-lg">{story.names}</h3>
                                                <BadgeCheck size={16} className="text-[#1A1208]" />
                                            </div>
                                            <p className="text-meta text-sm">{story.occupation}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span className="flex items-center gap-1 text-xs text-[#4A3F2E]">
                                                    <MapPin size={10} /> {story.location}
                                                </span>
                                                <span className="text-xs text-[#4A3F2E]">· {story.year}</span>
                                                <span className="flex gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} size={11} fill="#FFCF00" style={{ color: '#FFCF00' }} />
                                                    ))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Quote size={22} style={{ color: '#1A1208', opacity: 0.35 }} />

                                    <p className="text-[#3D3220] text-sm leading-relaxed whitespace-pre-line">{story.text}</p>

                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                        {story.tags.map((tag) => (
                                            <span key={tag}
                                                className="px-2.5 py-1 rounded-full text-xs font-medium"
                                                style={{ background: 'rgba(255,207,0,0.15)', color: '#1A1208' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ── All Stories Grid ── */}
            <AnimateSection>
                <section className="py-16 md:py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-[#1A1208]">More Stories</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Every Story Matters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {stories.filter(s => !s.featured).map((story) => (
                                <div key={story.id}
                                    className="testimonial-card bg-white rounded-2xl p-6 border border-gray-100 flex flex-col gap-4"
                                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                                    <Quote size={24} style={{ color: '#1A1208', opacity: 0.35 }} />
                                    <p className="text-[#3D3220] text-sm leading-relaxed flex-1 line-clamp-5">
                                        {story.text}
                                    </p>
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <div className="h-11 w-11 rounded-full flex items-center justify-center font-bold text-[#1A1208] text-sm shrink-0"
                                            style={{ background: '#FFCF00' }}>
                                            {story.initials}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-800 text-sm">{story.names}</p>
                                            <p className="text-xs text-[#4A3F2E]">{story.occupation}</p>
                                            <p className="text-[#4A3F2E] text-xs flex items-center gap-1 mt-0.5">
                                                <MapPin size={9} /> {story.location} · {story.year}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star key={i} size={10} fill="#FFCF00" style={{ color: '#FFCF00' }} />
                                                ))}
                                            </div>
                                            <span className="text-xs text-[#4A3F2E]">Verified</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {story.tags.slice(0, 2).map((tag) => (
                                            <span key={tag}
                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{ background: 'rgba(255,207,0,0.12)', color: '#1A1208' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* ── CTA ── */}
            <AnimateSection>
                <section className="relative overflow-hidden py-20"
                    style={{ background: 'linear-gradient(135deg,#0d1117,#1a2744)' }}>
                    <div className="absolute inset-0 pointer-events-none opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%,#FFCF00 0%,transparent 60%)' }} />
                    <div className="relative max-w-3xl mx-auto px-4 text-center">
                        <Heart size={44} fill="#FFCF00" style={{ color: '#FFCF00' }} className="mx-auto mb-5 animate-float" />
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Write Your Own Success Story
                        </h2>
                        <p className="text-[#4A3F2E] text-base mb-8 max-w-md mx-auto leading-relaxed">
                            Thousands of couples have found love on {settings.site_name}. Your perfect match may just be one click away.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Link href="/register"
                                className="btn-gold hover-shimmer inline-flex items-center gap-2 px-9 py-4 rounded-xl font-bold text-[#1A1208] text-base"
                                style={{ height: 'auto' }}>
                                <Sparkles size={17} /> Create Free Profile
                            </Link>
                            <Link href="/search"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base border border-white/20 hover:bg-white/10 transition-colors">
                                Browse Profiles <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-[#4A3F2E] text-xs">
                            <span className="flex items-center gap-1.5"><CheckCircle size={12} style={{ color: '#FFCF00' }} /> Free to Join</span>
                            <span className="flex items-center gap-1.5"><BadgeCheck size={12} style={{ color: '#FFCF00' }} /> NID Verified Profiles</span>
                            <span className="flex items-center gap-1.5"><Heart size={12} style={{ color: '#FFCF00' }} /> 3,500+ Success Stories</span>
                        </div>
                    </div>
                </section>
            </AnimateSection>
        </>
    );
}

