import Link from 'next/link';
import {
    ArrowRight,
    Check,
    Crown,
    Minus,
    Shield,
    Sparkles,
    Zap,
} from 'lucide-react';
import AnimateSection from '@/components/public/AnimateSection';
import {
    buildComparisonFeatureKeys,
    comparisonTableMinWidth,
    formatPlanDuration,
    getCardFeatures,
    getFeatureLabel,
    featureValueForPlan,
    pickPopularPlanId,
    planCardsGridClass,
} from '@/lib/subscription-features';
import { planLabel, resolvePlanTier, tierStyle } from '@/lib/plan-utils';
import type { SiteSettings } from '@/types/settings';
import type { FeatureDefinitions, SubscriptionPlan } from '@/types/subscription';

interface PricingPageContentProps {
    plans: SubscriptionPlan[];
    settings: SiteSettings;
    featureDefinitions: FeatureDefinitions;
}

function PlanCta({ plan }: { plan: SubscriptionPlan }) {
    const isFree = plan.price_bdt === 0;
    const href = isFree ? '/register' : '/login?redirect=/subscription';
    const label = isFree ? 'Get Started Free' : 'Subscribe Now';

    return (
        <Link
            href={href}
            className="group flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300"
        >
            {label}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
    );
}

export default function PricingPageContent({ plans, settings, featureDefinitions }: PricingPageContentProps) {
    const currency = settings.currency_symbol ?? '৳';
    const popularId = pickPopularPlanId(plans);
    const sortedPlans = [...plans].sort((a, b) => a.sort_order - b.sort_order || a.price_bdt - b.price_bdt);
    const comparisonKeys = buildComparisonFeatureKeys(sortedPlans, featureDefinitions);
    const manyPlans = sortedPlans.length > 3;

    return (
        <>
            {/* Hero — compact so plan cards are visible at a glance */}
            <section className="relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)',
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, rgba(255,207,0,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 10%, rgba(124,58,237,0.15) 0%, transparent 40%)',
                    }}
                />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-10 sm:pb-16 text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-amber-200/90 backdrop-blur-sm mb-4">
                        <Sparkles size={12} className="text-[#1A1208]" />
                        Membership plans
                    </div>

                    <h1
                        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight max-w-3xl mx-auto leading-tight"
                        style={{ fontFamily: 'var(--font-heading, serif)' }}
                    >
                        Choose the plan that fits your{' '}
                        <span
                            className="bg-clip-text text-transparent"
                            style={{ backgroundImage: 'linear-gradient(135deg, #FFE033, #FFCF00, #FFE033)' }}
                        >
                            journey to forever
                        </span>
                    </h1>

                    <p className="mt-3 text-sm text-[#ffffff] max-w-xl mx-auto">
                        Start free, upgrade anytime on {settings.site_name}.
                    </p>
                </div>
            </section>

            {/* Plan cards */}
            <section className="relative -mt-8 sm:-mt-10 pb-16 md:pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {sortedPlans.length === 0 ? (
                        <div className="rounded-3xl border border-gray-200 bg-white p-16 text-center text-meta shadow-xl">
                            No subscription plans are available right now. Please check back soon.
                        </div>
                    ) : manyPlans ? (
                        /* Horizontal scroll for 4+ plans on smaller screens */
                        <div className="-mx-4 sm:mx-0">
                            <div className="flex gap-5 overflow-x-auto px-4 sm:px-0 pb-4 snap-x snap-mandatory scrollbar-none lg:grid lg:gap-6 lg:overflow-visible lg:pb-0 lg:snap-none xl:gap-8 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {sortedPlans.map((plan) => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        currency={currency}
                                        isPopular={plan.id === popularId}
                                        featureDefinitions={featureDefinitions}
                                        comparisonKeys={comparisonKeys}
                                        className="min-w-[min(100%,280px)] sm:min-w-[300px] shrink-0 snap-center lg:min-w-0 lg:shrink"
                                    />
                                ))}
                            </div>
                            <p className="mt-3 text-center text-xs text-[#4A3F2E] lg:hidden">
                                Swipe to compare all {sortedPlans.length} plans →
                            </p>
                        </div>
                    ) : (
                        <div className={`grid gap-6 lg:gap-8 ${planCardsGridClass(sortedPlans.length)}`}>
                            {sortedPlans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    currency={currency}
                                    isPopular={plan.id === popularId}
                                    featureDefinitions={featureDefinitions}
                                    comparisonKeys={comparisonKeys}
                                />
                            ))}
                        </div>
                    )}

                    <p className="mt-10 text-center text-xs text-[#4A3F2E]">
                        Prices in {settings.currency ?? 'BDT'} · Secure checkout via SSLCommerz · Cancel anytime before renewal
                    </p>
                </div>
            </section>

            {/* Feature comparison — dynamic from API feature data */}
            {/*{sortedPlans.length > 1 && comparisonKeys.length > 0 && (*/}
            {/*    <AnimateSection>*/}
            {/*        <section className="py-20 md:py-28 bg-white border-y border-gray-100">*/}
            {/*            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">*/}
            {/*                <div className="text-center mb-14">*/}
            {/*                    <p className="text-xs font-bold uppercase tracking-widest text-[#FFCF00] mb-3">*/}
            {/*                        Compare plans*/}
            {/*                    </p>*/}
            {/*                    <h2*/}
            {/*                        className="text-3xl md:text-4xl font-bold text-gray-900"*/}
            {/*                        style={{ fontFamily: 'var(--font-heading, serif)' }}*/}
            {/*                    >*/}
            {/*                        Everything you need, side by side*/}
            {/*                    </h2>*/}
            {/*                    <p className="mt-3 text-meta max-w-xl mx-auto text-sm">*/}
            {/*                        Features loaded from your active plans — highest access shown first.*/}
            {/*                    </p>*/}
            {/*                </div>*/}

            {/*                /!* Desktop / tablet: scrollable table *!/*/}
            {/*                <div className="hidden sm:block overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">*/}
            {/*                    <table*/}
            {/*                        className="w-full text-sm"*/}
            {/*                        style={{ minWidth: comparisonTableMinWidth(sortedPlans.length) }}*/}
            {/*                    >*/}
            {/*                        <thead>*/}
            {/*                            <tr className="border-b border-gray-200 bg-gray-50/80">*/}
            {/*                                <th className="sticky left-0 z-20 bg-gray-50/95 backdrop-blur-sm text-left py-4 px-5 font-semibold text-meta min-w-[180px] sm:min-w-[220px]">*/}
            {/*                                    Feature*/}
            {/*                                </th>*/}
            {/*                                {sortedPlans.map((plan) => (*/}
            {/*                                    <th*/}
            {/*                                        key={plan.id}*/}
            {/*                                        className="py-4 px-3 text-center font-bold text-gray-900 min-w-[120px] whitespace-nowrap"*/}
            {/*                                    >*/}
            {/*                                        <span className="block truncate max-w-[140px] mx-auto" title={plan.name}>*/}
            {/*                                            {plan.name}*/}
            {/*                                        </span>*/}
            {/*                                    </th>*/}
            {/*                                ))}*/}
            {/*                            </tr>*/}
            {/*                        </thead>*/}
            {/*                        <tbody>*/}
            {/*                            {comparisonKeys.map((key, rowIdx) => (*/}
            {/*                                <tr*/}
            {/*                                    key={key}*/}
            {/*                                    className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}*/}
            {/*                                >*/}
            {/*                                    <td className="sticky left-0 z-10 bg-inherit py-3.5 px-5 text-gray-700 font-medium min-w-[180px] sm:min-w-[220px] border-r border-gray-100/80">*/}
            {/*                                        {getFeatureLabel(key, featureDefinitions)}*/}
            {/*                                    </td>*/}
            {/*                                    {sortedPlans.map((plan) => {*/}
            {/*                                        const val = featureValueForPlan(plan.features, key, featureDefinitions);*/}
            {/*                                        return (*/}
            {/*                                            <td key={plan.id} className="py-3.5 px-3 text-center min-w-[120px]">*/}
            {/*                                                {val === '—' ? (*/}
            {/*                                                    <Minus size={16} className="mx-auto text-gray-300" />*/}
            {/*                                                ) : val === '✓' ? (*/}
            {/*                                                    <Check*/}
            {/*                                                        size={18}*/}
            {/*                                                        className="mx-auto text-emerald-500"*/}
            {/*                                                        strokeWidth={2.5}*/}
            {/*                                                    />*/}
            {/*                                                ) : (*/}
            {/*                                                    <span className="font-semibold text-gray-800 text-xs sm:text-sm">*/}
            {/*                                                        {val}*/}
            {/*                                                    </span>*/}
            {/*                                                )}*/}
            {/*                                            </td>*/}
            {/*                                        );*/}
            {/*                                    })}*/}
            {/*                                </tr>*/}
            {/*                            ))}*/}
            {/*                        </tbody>*/}
            {/*                    </table>*/}
            {/*                </div>*/}

            {/*                /!* Mobile: stacked cards per feature *!/*/}
            {/*                <div className="sm:hidden space-y-3">*/}
            {/*                    {comparisonKeys.map((key) => (*/}
            {/*                        <div*/}
            {/*                            key={key}*/}
            {/*                            className="rounded-2xl border border-gray-200 bg-white overflow-hidden"*/}
            {/*                        >*/}
            {/*                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-semibold text-sm text-gray-800">*/}
            {/*                                {getFeatureLabel(key, featureDefinitions)}*/}
            {/*                            </div>*/}
            {/*                            <div className="divide-y divide-gray-100">*/}
            {/*                                {sortedPlans.map((plan) => {*/}
            {/*                                    const val = featureValueForPlan(plan.features, key, featureDefinitions);*/}
            {/*                                    return (*/}
            {/*                                        <div*/}
            {/*                                            key={plan.id}*/}
            {/*                                            className="flex items-center justify-between gap-3 px-4 py-2.5"*/}
            {/*                                        >*/}
            {/*                                            <span className="text-xs text-meta truncate flex-1">*/}
            {/*                                                {plan.name}*/}
            {/*                                            </span>*/}
            {/*                                            <span className="shrink-0 text-sm font-semibold text-gray-800">*/}
            {/*                                                {val === '—' ? (*/}
            {/*                                                    <Minus size={14} className="text-gray-300" />*/}
            {/*                                                ) : val === '✓' ? (*/}
            {/*                                                    <Check size={16} className="text-emerald-500" strokeWidth={2.5} />*/}
            {/*                                                ) : (*/}
            {/*                                                    val*/}
            {/*                                                )}*/}
            {/*                                            </span>*/}
            {/*                                        </div>*/}
            {/*                                    );*/}
            {/*                                })}*/}
            {/*                            </div>*/}
            {/*                        </div>*/}
            {/*                    ))}*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </section>*/}
            {/*    </AnimateSection>*/}
            {/*)}*/}

            {/* Value props */}
            <AnimateSection>
                <section className="py-5 md:py-5" style={{ background: '#F8F9FB' }}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Zap,
                                    title: 'Smarter matching',
                                    desc: 'AI-powered compatibility scoring surfaces profiles that align with your values, lifestyle, and preferences.',
                                },
                                {
                                    icon: Shield,
                                    title: 'Built for trust',
                                    desc: 'Verified profiles, privacy controls, and secure messaging keep your search safe and dignified.',
                                },
                                {
                                    icon: Crown,
                                    title: 'Premium when you need it',
                                    desc: 'Unlock contact views, unlimited interests, and voice & video calls only when you are ready to commit.',
                                },
                            ].map(({ icon: Icon, title, desc }) => (
                                <div
                                    key={title}
                                    className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div
                                        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                                        style={{ background: 'rgba(255,207,0,0.1)' }}
                                    >
                                        <Icon size={22} className="text-[#1A1208]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                                    <p className="text-sm text-meta leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </AnimateSection>

            {/* Bottom CTA */}
            <section
                className="py-16 md:py-20"
                style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
            >
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2
                        className="text-2xl md:text-3xl font-bold text-white mb-4"
                        style={{ fontFamily: 'var(--font-heading, serif)' }}
                    >
                        Ready to find your perfect match?
                    </h2>
                    <p className="text-[#FFFFFF] mb-8 text-sm md:text-base">
                        Join thousands of verified members on {settings.site_name}. Create your free profile in under 5 minutes.
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-[#1A1208] transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #FFCF00, #FFE033)',
                            boxShadow: '0 8px 32px rgba(255,207,0,0.35)',
                        }}
                    >
                        Create Free Profile
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </>
    );
}

function PlanCard({
    plan,
    currency,
    isPopular,
    featureDefinitions,
    comparisonKeys,
    className = '',
}: {
    plan: SubscriptionPlan;
    currency: string;
    isPopular: boolean;
    featureDefinitions: FeatureDefinitions;
    comparisonKeys: string[];
    className?: string;
}) {
    const tier = resolvePlanTier(plan);
    const { grad, badge, icon } = tierStyle(tier);
    const cardFeatures = getCardFeatures(plan.features ?? {}, featureDefinitions, comparisonKeys);
    const isFree = plan.price_bdt === 0;

    return (
        <div
            className={`relative flex flex-col rounded-3xl border bg-gradient-to-b p-6 sm:p-8 transition-all duration-300 h-full ${className} ${
                isPopular
                    ? 'border-[#FFCF00]/60 shadow-2xl shadow-amber-500/10 md:scale-[1.02] z-10 bg-white'
                    : `bg-white/95 shadow-xl hover:shadow-2xl md:hover:-translate-y-1 ${grad}`
            }`}
        >
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-[#1A1208] shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #FFCF00, #FFE033)' }}
                    >
                        <Crown size={12} />
                        Most Popular
                    </span>
                </div>
            )}

            <div className="mb-6 mt-2">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{icon}</span>
                    <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badge}`}
                    >
                        {plan.subscription_type?.name ?? planLabel(tier)}
                    </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{plan.name}</h2>
                {plan.description && (
                    <p className="mt-2 text-sm text-meta leading-relaxed line-clamp-3">{plan.description}</p>
                )}
            </div>

            <div className="mb-6 sm:mb-8">
                <div className="flex items-end gap-1">
                    {isFree ? (
                        <span className="text-4xl sm:text-5xl font-black text-emerald-600">Free</span>
                    ) : (
                        <>
                            <span className="text-base sm:text-lg font-semibold text-[#4A3F2E] mb-1 sm:mb-2">
                                {currency}
                            </span>
                            <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                                {plan.price_bdt.toLocaleString()}
                            </span>
                        </>
                    )}
                </div>
                <p className="mt-2 text-sm text-meta">
                    {isFree ? 'No credit card required' : `One-time for ${formatPlanDuration(plan)}`}
                </p>
            </div>

            <ul className="mb-6 sm:mb-8 flex-1 space-y-2.5 sm:space-y-3">
                {cardFeatures.length === 0 ? (
                    <li className="text-sm text-[#4A3F2E]">Core platform access included</li>
                ) : (
                    cardFeatures.map(({ key, label, extra }) => (
                        <li key={key} className="flex items-start gap-3 text-sm text-gray-700">
                            <span
                                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                style={{ background: 'rgba(255,207,0,0.12)' }}
                            >
                                <Check size={12} className="text-[#8A7000]" strokeWidth={3} />
                            </span>
                            <span>
                                {label}
                                {extra ? (
                                    <span className="ml-1 font-semibold text-gray-900">({extra})</span>
                                ) : null}
                            </span>
                        </li>
                    ))
                )}
            </ul>

            <div
                className={
                    isPopular
                        ? '[&>a]:bg-gradient-to-r [&>a]:from-[#FFCF00] [&>a]:to-[#FFE033] [&>a]:text-[#1A1208] [&>a]:shadow-lg [&>a]:shadow-amber-500/25 [&>a]:hover:shadow-xl [&>a]:hover:scale-[1.02]'
                        : isFree
                          ? '[&>a]:bg-emerald-600 [&>a]:text-white [&>a]:hover:bg-emerald-700'
                          : '[&>a]:bg-gray-900 [&>a]:text-white [&>a]:hover:bg-gray-800'
                }
            >
                <PlanCta plan={plan} />
            </div>
        </div>
    );
}
