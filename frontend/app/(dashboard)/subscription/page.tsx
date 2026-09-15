'use client';

import {useState} from 'react';
import {useUserQuery} from '@/hooks/useUserQuery';
import {useQueryClient} from '@tanstack/react-query';
import {invalidateSubscriptionQueries, invalidateDashboardQueries} from '@/lib/cacheInvalidation';
import {subscriptionService} from '@/services/subscriptionService';
import {authService} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {tierStyle, planLabel} from '@/lib/plan-utils';
import {useSettings} from '@/lib/useSettings';
import type {
    PaymentHistoryItem,
    PlanFeatures,
    SubscriptionPlan,
    SubscriptionStatus,
    SwitchableSubscription,
} from '@/types/subscription';

// ---------------------------------------------------------------------------
// Feature label definitions (mirrors backend SubscriptionFeatureService)
// ---------------------------------------------------------------------------
const FEATURE_LABELS: Record<string, { label: string; type: 'bool' | 'qty' | 'enum'; period?: string }> = {
    daily_matches: {label: 'Daily Match Suggestions', type: 'qty', period: '/day'},
    profile_views_per_day: {label: 'Profile Views per Day', type: 'qty', period: '/day'},
    send_interest_per_day: {label: 'Interests Sent per Day', type: 'qty', period: '/day'},
    chat_access: {label: 'Chat Access', type: 'bool'},
    audio_call_access: {label: 'Audio Calls', type: 'bool'},
    video_call_access: {label: 'Video Calls', type: 'bool'},
    see_who_viewed_profile: {label: 'See Profile Visitors', type: 'bool'},
    max_photos_upload: {label: 'Max Photos Upload', type: 'qty'},
    email_digest_frequency: {label: 'Email Digest', type: 'enum'},
    push_notifications: {label: 'Push Notifications', type: 'bool'},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string | null | undefined) {
    if (!iso) return 'Forever ∞';
    return new Date(iso).toLocaleDateString('en-US', {day: 'numeric', month: 'short', year: 'numeric'});
}

function formatDuration(plan: SubscriptionPlan) {
    const qty = plan.duration_qty ?? (plan.duration_days ?? 30);
    const unit = plan.duration_unit ?? 'day';
    return `${qty} ${unit}${qty > 1 ? 's' : ''}`;
}

function statusColor(status: string) {
    return ({
        active: 'bg-green-100 text-green-700',
        pending: 'bg-yellow-100 text-yellow-700',
        expired: 'bg-gray-100 text-[#4A3F2E]',
        refunded: 'bg-red-100 text-red-600',
    } as Record<string, string>)[status] ?? 'bg-gray-100 text-meta';
}


function getEnabledFeatures(features: PlanFeatures | string[]) {
    // Handle legacy array-of-strings format (e.g., ["Full chat access", "Audio & video calling"])
    if (Array.isArray(features)) {
        return features.map((label, i) => ({key: `feature_${i}`, label, value: true as boolean | number | string}));
    }
    // Key-value object format
    // forPlanCard=true: only show features explicitly assigned (non-false/0/none) — superadmin-controlled
    // forPlanCard=false (current plan snapshot): show all enabled features
    return Object.entries(features ?? {})
        .filter(([, v]) => v !== false && v !== 0 && v !== 'none')
        .map(([key, value]) => ({key, label: FEATURE_LABELS[key]?.label ?? key, value}));
}

function renderFeatureExtra(key: string, value: boolean | number | string): string | null {
    const def = FEATURE_LABELS[key];
    if (!def || def.type === 'bool') return null;
    if (def.type === 'qty') {
        const n = Number(value);
        return n === -1 ? 'Unlimited' : `${n}${def.period ?? ''}`;
    }
    if (def.type === 'enum') return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    return null;
}

// ---------------------------------------------------------------------------
// Plan Card
// ---------------------------------------------------------------------------
function PlanCard({
                      plan,
                      isCurrent,
                      loadingId,
                      onBuy,
                      currencySymbol,
                  }: {
    plan: SubscriptionPlan;
    isCurrent: boolean;
    loadingId: number | null;
    onBuy: (p: SubscriptionPlan) => void;
    currencySymbol: string;
}) {
    const features = getEnabledFeatures(plan.features ?? {});
    const {grad, badge, icon} = tierStyle(plan.plan_type);

    return (
        <div
            className={`relative flex flex-col rounded-2xl border-2 bg-gradient-to-b p-6 transition-shadow hover:shadow-lg ${grad} ${isCurrent ? 'ring-2 ring-green-400' : ''}`}>
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-green-500 text-white shadow">
                        ✓ Current Plan
                    </span>
                </div>
            )}

            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{icon}</span>
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
                        {planLabel(plan.plan_type)}
                    </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                {plan.description && <p className="text-xs text-meta mt-0.5">{plan.description}</p>}
            </div>

            <div className="mb-4">
                <div className="text-3xl font-extrabold text-gray-900">
                    {plan.price_bdt === 0 ? (
                        <span className="text-green-600">Free</span>
                    ) : `${currencySymbol}${plan.price_bdt.toLocaleString()}`}
                </div>
                <div className="text-xs text-meta">
                    {plan.price_bdt === 0 ? 'Forever — no expiry' : `for ${formatDuration(plan)}`}
                </div>
            </div>

            <ul className="flex-1 space-y-1.5 mb-6">
                {features.length === 0 ? (
                    <li className="text-xs text-[#4A3F2E]">No special features</li>
                ) : features.map(({key, label, value}) => {
                    const extra = renderFeatureExtra(key, value);
                    return (
                        <li key={key} className="flex items-start gap-2 text-xs text-gray-700">
                            <svg className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" fill="none"
                                 stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                      d="M5 13l4 4L19 7"/>
                            </svg>
                            <span>{label}{extra ?
                                <span className="ml-1 font-semibold text-gray-900">({extra})</span> : null}</span>
                        </li>
                    );
                })}
            </ul>

            {isCurrent ? (
                <div
                    className="py-2 text-center rounded-xl border-2 border-green-400 bg-green-50 text-green-700 text-sm font-semibold">
                    ✓ Active Plan
                </div>
            ) : (
                <button
                    onClick={() => onBuy(plan)}
                    disabled={loadingId !== null}
                    className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        plan.price_bdt === 0
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-900 hover:bg-gray-700 text-white'
                    }`}
                >
                    {loadingId === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                        strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            {plan.price_bdt === 0 ? 'Activating…' : 'Redirecting…'}
                        </span>
                    ) : plan.price_bdt === 0 ? '🆓 Subscribe Free' : 'Buy / Upgrade'}
                </button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Switch Plan Banner  (shown when user has multiple active subscriptions)
// ---------------------------------------------------------------------------
function SwitchBanner({
                          switchable,
                          activeId,
                          onSwitch,
                          switching,
                      }: {
    switchable: SwitchableSubscription[];
    activeId: number | null;
    onSwitch: (id: number) => void;
    switching: number | null;
}) {
    if (switchable.length < 2) return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🔄</span>
                <span className="text-sm font-semibold text-blue-800">You have {switchable.length} active plans — switch anytime</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {switchable.map(sw => {
                    const isCurrent = sw.id === activeId;
                    const {badge, icon} = tierStyle(sw.plan);
                    return (
                        <div
                            key={sw.id}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                                isCurrent
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                            }`}
                        >
                            <span>{icon}</span>
                            <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{planLabel(sw.plan)}</span>
                            <span>{sw.subscription_plan?.name ?? planLabel(sw.plan)}</span>
                            <span className="text-[#4A3F2E]">· expires {formatDate(sw.expires_at)}</span>
                            {isCurrent ? (
                                <span className="ml-1 text-green-600 font-semibold">✓ Active</span>
                            ) : (
                                <button
                                    onClick={() => onSwitch(sw.id)}
                                    disabled={switching !== null}
                                    className="ml-1 px-2 py-0.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {switching === sw.id ? '…' : 'Switch'}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Current Plan Snapshot
// ---------------------------------------------------------------------------
function CurrentPlanSnapshot({status, currencySymbol}: {
    status: SubscriptionStatus | undefined;
    currencySymbol: string
}) {
    // A subscription is active when: is_active=true AND (expires_at is null = forever, OR expires_at is in the future)
    const isActive = !!(status?.is_active && (
        status.expires_at === null || (status.expires_at && new Date(status.expires_at) > new Date())
    ));
    const isFree = status?.subscription?.amount_bdt === 0 || status?.plan === 'free';
    const plan = status?.subscription?.subscription_plan as SubscriptionPlan | undefined;
    // status.features is always a proper key-value dict from SubscriptionFeatureService
    const features = getEnabledFeatures((status?.features ?? {}) as PlanFeatures);

    if (!isActive) {
        return (
            <div
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-meta">
                <div className="text-4xl mb-3">🆓</div>
                <div className="font-semibold text-gray-700 mb-1">No Active Subscription</div>
                <p className="text-xs text-[#4A3F2E] mb-2">You&apos;re currently on the <span
                    className="font-semibold text-[#3D3220]">Free (Basic)</span> tier.</p>
                <p className="text-sm">Upgrade to Silver, Gold, or Platinum to unlock premium features like chat, calls,
                    and more.</p>
            </div>
        );
    }

    const {icon, badge, grad} = tierStyle(status!.plan);

    return (
        <div className={`bg-gradient-to-br border-2 rounded-2xl p-5 ${grad}`}>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Active Subscription</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{icon}</span>
                        <h3 className="text-xl font-black text-gray-900">
                            {plan?.name ?? planLabel(status!.plan)}
                        </h3>
                        <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{planLabel(status!.plan)}</span>
                    </div>
                    {plan?.description && <p className="text-sm text-meta mt-0.5">{plan.description}</p>}
                </div>
                <div className="text-right shrink-0">
                    <div className="text-xs text-meta">{isFree ? 'Duration' : 'Expires'}</div>
                    <div className="text-base font-bold text-gray-900">
                        {isFree ? '∞ Forever' : formatDate(status!.expires_at)}
                    </div>
                    {plan && (
                        <div className="text-xs text-meta mt-0.5">
                            {plan.price_bdt === 0
                                ? 'Always Free'
                                : `${currencySymbol}${plan.price_bdt.toLocaleString()} / ${formatDuration(plan)}`}
                        </div>
                    )}
                </div>
            </div>

            {features.length > 0 && (
                <>
                    <div className="text-xs font-semibold text-[#3D3220] uppercase tracking-wide mb-2">Your Features
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                        {features.map(({key, label, value}) => {
                            const extra = renderFeatureExtra(key, value);
                            return (
                                <div key={key}
                                     className="bg-white/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs text-gray-700 shadow-sm">
                                    <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                              d="M5 13l4 4L19 7"/>
                                    </svg>
                                    <span>{label}{extra ? <strong className="ml-0.5">({extra})</strong> : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Invoice Modal
// ---------------------------------------------------------------------------
function InvoiceModal({item, onClose, currencySymbol}: {
    item: PaymentHistoryItem;
    onClose: () => void;
    currencySymbol: string
}) {
    const [printing, setPrinting] = useState(false);
    const [printError, setPrintError] = useState<string | null>(null);

    const handlePrint = async () => {
        setPrinting(true);
        setPrintError(null);

        try {
            const blob = await subscriptionService.downloadInvoice(item.id);
            const url = URL.createObjectURL(new Blob([blob], {type: 'application/pdf'}));

            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            iframe.src = url;
            document.body.appendChild(iframe);

            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 300);
            };
        } catch {
            setPrintError('Could not load invoice. Please try again.');
        } finally {
            setPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                 onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-base font-bold text-gray-900">Payment Invoice</h2>
                    <div className="flex gap-2">
                        <button onClick={handlePrint}
                                disabled={printing}
                                className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 disabled:opacity-60 flex items-center gap-1 transition-colors">
                            {printing ? 'Loading…' : '🖨️ Print'}
                        </button>
                        <button onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-meta transition-colors">✕
                        </button>
                    </div>
                </div>

                {printError && (
                    <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600">
                        {printError}
                    </div>
                )}

                <div className="px-6 py-5 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xl font-black text-[#1A1208]">💍 MatriConnect</div>
                            <div className="text-xs text-[#4A3F2E]">Matrimony Platform</div>
                        </div>
                        <div className="text-right text-xs text-meta">
                            <div className="font-semibold text-sm text-gray-900">Invoice</div>
                            <div className="font-mono">#{item.transaction_id}</div>
                            <div>{formatDate(item.created_at)}</div>
                        </div>
                    </div>
                    <hr/>
                    <table className="w-full text-sm">
                        <tbody>
                        {[
                            ['Plan', item.plan_name],
                            ['Tier', <span key="tier" className="capitalize">{item.plan_type}</span>],
                            item.subscription_plan ? ['Duration', formatDuration(item.subscription_plan)] : null,
                            ['Payment Method', item.payment_method],
                            ['Transaction ID',
                                <span key="txid" className="font-mono text-xs break-all">{item.transaction_id}</span>],
                            ['Status', <span key="status"
                                             className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor(item.status)}`}>{item.status}</span>],
                            item.starts_at ? ['Valid From', formatDate(item.starts_at)] : null,
                            item.expires_at ? ['Valid Until', formatDate(item.expires_at)] : null,
                        ].filter(Boolean).map((row, i) => (
                            <tr key={i} className="border-b last:border-0">
                                <td className="py-2 text-meta w-36 font-medium">{(row as [string, React.ReactNode])[0]}</td>
                                <td className="py-2 font-medium">{(row as [string, React.ReactNode])[1]}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <span className="text-sm text-[#3D3220] font-medium">Total Paid</span>
                        <span
                            className="text-2xl font-extrabold text-gray-900">{currencySymbol}{item.amount_bdt.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-[#4A3F2E] text-center">Thank you for subscribing to MatriConnect Premium!
                        💍</p>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
type Tab = 'plans' | 'history';

export default function SubscriptionPage() {
    const queryClient = useQueryClient();
    const updateUser = useAuthStore((s) => s.updateUser);
    const {settings} = useSettings();
    const currencySymbol = settings.currency_symbol || '৳';

    const [tab, setTab] = useState<Tab>('plans');
    const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);
    const [switching, setSwitching] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [switchSuccess, setSwitchSuccess] = useState<string | null>(null);
    const [invoiceItem, setInvoiceItem] = useState<PaymentHistoryItem | null>(null);
    const [durationFilter, setDurationFilter] = useState<string>('all');

    // ── Queries ──────────────────────────────────────────────────────────────
    const {data: plans = [], isLoading: plansLoading} = useUserQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => subscriptionService.getPlans(),
    });

    const {data: status, isLoading: statusLoading} = useUserQuery<SubscriptionStatus>({
        queryKey: ['subscription-status'],
        queryFn: () => subscriptionService.getStatus(),
    });

    const {data: history = [], isLoading: historyLoading} = useUserQuery({
        queryKey: ['subscription-history'],
        queryFn: () => subscriptionService.getHistory(),
        enabled: tab === 'history',
    });

    // ── Derived state ────────────────────────────────────────────────────────
    // The "current" plan is identified by active_subscription_id → subscription_plan_id
    // This is precise even when multiple plans share the same plan_type string.
    const activeSubPlanId = status?.subscription?.subscription_plan_id ?? null;
    const activeSubId = status?.active_subscription_id ?? null;
    // Active when: is_active=true AND (expires_at is null=forever OR expires_at is future)
    const isActive = !!(status?.is_active && (
        status.expires_at === null || (status.expires_at && new Date(status.expires_at) > new Date())
    ));

    // ── Handlers ─────────────────────────────────────────────────────────────
    const refreshAuthUser = async () => {
        try {
            const res = await authService.me();
            const user = res.data?.data?.user;
            if (user) updateUser(user);
        } catch {
            /* silent */
        }
    };

    const handleBuy = async (plan: SubscriptionPlan) => {
        setError(null);
        setLoadingPlanId(plan.id);
        try {
            if (plan.price_bdt === 0) {
                // Free plan — direct activation, no payment gateway
                await subscriptionService.subscribeFree(plan.id);
                setSwitchSuccess(`Successfully subscribed to ${plan.name} (Free)! ✓`);
                await invalidateSubscriptionQueries(queryClient);
                await invalidateDashboardQueries(queryClient);
                await refreshAuthUser();
            } else {
                const result = await subscriptionService.initiate(plan.id);
                window.location.href = result.payment_url;
            }
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message ?? e.message ?? 'Failed to process subscription.');
        } finally {
            setLoadingPlanId(null);
        }
    };

    const handleSwitch = async (subscriptionId: number) => {
        setError(null);
        setSwitchSuccess(null);
        setSwitching(subscriptionId);
        try {
            const result = await subscriptionService.switchPlan(subscriptionId);
            setSwitchSuccess(
                `Switched to ${result.subscription_plan?.name ?? result.plan} successfully! ✓`
            );
            await invalidateSubscriptionQueries(queryClient);
            await invalidateDashboardQueries(queryClient);
            await refreshAuthUser();
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; message?: string };
            setError(e.response?.data?.message ?? e.message ?? 'Failed to switch plan.');
        } finally {
            setSwitching(null);
        }
    };

    // Build unique duration options from plan data (dynamic)
    const durationOptions = Array.from(
        new Map(
            plans
                .filter(p => p.price_bdt !== 0) // exclude free/forever plans from filter
                .map(p => {
                    const key = formatDuration(p);
                    return [key, key];
                })
        ).entries()
    ).map(([key]) => key);

    const filteredPlans = durationFilter === 'all'
        ? plans
        : plans.filter(p => p.price_bdt === 0 || formatDuration(p) === durationFilter);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            {invoiceItem &&
                <InvoiceModal item={invoiceItem} onClose={() => setInvoiceItem(null)} currencySymbol={currencySymbol}/>}

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
                    <p className="text-sm text-meta mt-1">Manage your plan, switch between purchased plans, and view
                        invoices.</p>
                </div>

                {/* Alerts */}
                {switchSuccess && (
                    <div
                        className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                        ✅ {switchSuccess}
                        <button onClick={() => setSwitchSuccess(null)}
                                className="ml-auto text-green-500 hover:text-green-700">✕
                        </button>
                    </div>
                )}
                {error && (
                    <div
                        className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                        ⚠️ {error}
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕
                        </button>
                    </div>
                )}

                {/* Current plan snapshot */}
                <div className="mb-5">
                    {statusLoading ? (
                        <div className="h-36 bg-gray-100 rounded-2xl animate-pulse"/>
                    ) : (
                        <CurrentPlanSnapshot status={status} currencySymbol={currencySymbol}/>
                    )}
                </div>

                {/* Switch banner — shown when user has 2+ active subscriptions */}
                {(status?.switchable?.length ?? 0) >= 2 && (
                    <SwitchBanner
                        switchable={status!.switchable}
                        activeId={activeSubId}
                        onSwitch={handleSwitch}
                        switching={switching}
                    />
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
                    {(['plans', 'history'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                tab === t ? 'bg-white text-gray-900 shadow' : 'text-meta hover:text-gray-700'
                            }`}
                        >
                            {t === 'plans' ? '📋 Plans' : '📜 History'}
                        </button>
                    ))}
                </div>

                {/* ═══ PLANS TAB ═══ */}
                {tab === 'plans' && (
                    <>
                        {/* Duration filter */}
                        {!plansLoading && durationOptions.length > 1 && (
                            <div className="mb-4 flex items-center gap-3">
                                <label className="text-sm font-medium text-[#3D3220] shrink-0">Filter by duration:</label>
                                <select
                                    value={durationFilter}
                                    onChange={e => setDurationFilter(e.target.value)}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
                                >
                                    <option value="all">All Plans</option>
                                    {durationOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {plansLoading ? (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[1, 2, 3].map(i => <div key={i}
                                                         className="bg-gray-100 rounded-2xl h-96 animate-pulse"/>)}
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="text-center py-16 text-[#4A3F2E]">No plans available.</div>
                        ) : (
                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                                {filteredPlans.map(plan => (
                                    <PlanCard
                                        key={plan.id}
                                        plan={plan}
                                        isCurrent={isActive && plan.id === activeSubPlanId}
                                        loadingId={loadingPlanId}
                                        onBuy={handleBuy}
                                        currencySymbol={currencySymbol}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-[#4A3F2E]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                            </svg>
                            Secure payment via SSLCommerz — all major cards and mobile banking accepted.
                        </div>
                    </>
                )}

                {/* ═══ HISTORY TAB ═══ */}
                {tab === 'history' && (
                    <div>
                        {historyLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i}
                                                         className="h-16 bg-gray-100 rounded-xl animate-pulse"/>)}
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-16 text-[#4A3F2E]">
                                <div className="text-4xl mb-3">📭</div>
                                <div>No payment history yet.</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="bg-gray-50 border-b text-xs text-meta uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Plan</th>
                                        <th className="px-4 py-3 text-left">Amount</th>
                                        <th className="px-4 py-3 text-left hidden sm:table-cell">Method</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Purchased</th>
                                        <th className="px-4 py-3 text-left hidden md:table-cell">Expires</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                    {history.map(item => (
                                        <tr key={item.id}
                                            className={`hover:bg-gray-50 transition-colors ${item.is_current ? 'bg-green-50/50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div>
                                                        <div
                                                            className="font-semibold text-gray-900 flex items-center gap-1.5">
                                                            {item.plan_name}
                                                            {item.is_current && (
                                                                <span
                                                                    className="px-1.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 font-semibold">Active</span>
                                                            )}
                                                        </div>
                                                        <span
                                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${tierStyle(item.plan_type).badge}`}>
                                                                <span
                                                                    aria-hidden>{tierStyle(item.plan_type).icon}</span>
                                                            {planLabel(item.plan_type)}
                                                            </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {item.amount_bdt === 0
                                                    ? <span className="text-green-600 font-semibold">Free</span>
                                                    : `${currencySymbol}${item.amount_bdt.toLocaleString()}`}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-meta capitalize text-xs">
                                                {item.payment_method}
                                            </td>
                                            <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-meta text-xs">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="px-4 py-3 hidden md:table-cell text-meta text-xs">
                                                {formatDate(item.expires_at)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Switch button — only for switchable non-current active subs */}
                                                    {item.is_switchable && (
                                                        <button
                                                            onClick={() => handleSwitch(item.id)}
                                                            disabled={switching !== null}
                                                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {switching === item.id ? '…' : '⇄ Switch'}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setInvoiceItem(item)}
                                                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors"
                                                    >
                                                        🧾 Invoice
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer note */}
                {tab === 'history' && (
                    <p className="text-xs text-[#4A3F2E] text-center mt-4">
                        💡 Click <strong>⇄ Switch</strong> on any valid past plan to re-activate it for the remainder of
                        its subscription period.
                    </p>
                )}
            </main>
        </>
    );
}

