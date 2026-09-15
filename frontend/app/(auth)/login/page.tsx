'use client';

import {useState, useEffect, Suspense} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {getPostAuthRedirect} from '@/lib/authRedirect';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {showErrorToast} from '@/lib/toast';
import {useSettings} from '@/lib/useSettings';

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [serverError, setServerError] = useState<string | null>(null);
    const [banInfo, setBanInfo] = useState<{ reason: string } | null>(null);
    const [inactiveInfo, setInactiveInfo] = useState<{ reason: string } | null>(null);
    const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
    const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<LoginForm>({resolver: zodResolver(loginSchema)});

    const {settings} = useSettings();

    useEffect(() => {
        if (searchParams.get('account_disabled') === '1') {
            setRedirectNotice('Your account has been disabled following review of your disable request.');
        } else if (searchParams.get('account_banned') === '1') {
            setRedirectNotice('Your account has been suspended following review of your disable request.');
        } else if (searchParams.get('face_scan_rejected') === '1') {
            setRedirectNotice('Your face verification was rejected. Please login again to resubmit.');
        }
    }, [searchParams]);

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        setBanInfo(null);
        setInactiveInfo(null);
        try {
            const res = await authService.login(data);
            const {user, token} = res.data.data;
            setAuth(user, token);
            //window.location.href = getPostAuthRedirect(user);
            router.push(getPostAuthRedirect(user));
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: {
                    data?: {
                        message?: string;
                        data?: { status?: string; ban_reason?: string; disable_reason?: string };
                    };
                };
            };
            const payload = axiosErr.response?.data?.data;
            if (payload?.status === 'banned') {
                setBanInfo({
                    reason: payload.ban_reason ?? 'No reason provided. Please contact support.',
                });
                return;
            }

            if (payload?.status === 'unverified') {
                showErrorToast('Please verify your email before logging in.');
                router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
                return;
            }

            if (payload?.status === 'inactive') {
                setInactiveInfo({
                    reason: payload.disable_reason ?? 'Your account has been disabled. Please contact support.',
                });
                return;
            }

            setServerError(axiosErr.response?.data?.message ?? 'Login failed. Please try again.');
        }
    };

    return (
        <div className="bg-white rounded-2xl overflow-hidden"
             style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
            {/* Header accent */}
            <div className="h-1.5 w-full" style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}/>

            <div className="p-8">
                <div className="mb-7">
                    <h2 className="text-2xl font-bold text-[#1A1208]" style={{fontFamily: 'var(--font-heading)'}}>
                        Welcome back
                    </h2>
                    <p className="text-sm text-[#8A7A62] mt-1">Login to your {settings.site_name} account</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                    {redirectNotice && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                            {redirectNotice}
                        </div>
                    )}

                    {inactiveInfo && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 text-sm text-amber-900 space-y-2">
                            <div className="flex items-center gap-2 font-semibold">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                Account status: Disabled
                            </div>
                            <p className="leading-relaxed">
                                <span className="font-medium">Reason:</span> {inactiveInfo.reason}
                            </p>
                        </div>
                    )}

                    {banInfo && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700 space-y-2">
                            <div className="flex items-center gap-2 font-semibold">
                                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                Account status: Banned
                            </div>
                            <p className="leading-relaxed">
                                <span className="font-medium">Reason:</span> {banInfo.reason}
                            </p>
                        </div>
                    )}

                    {serverError && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {serverError}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[#5A4A2A] font-medium text-sm">Email address</Label>
                        <Input
                            id="email" type="email" autoComplete="email"
                            placeholder="you@example.com"
                            className="h-11 rounded-xl border-[#E8DFCC] bg-[#FEFCF8] focus-visible:ring-[#FFCF00] focus-visible:border-[#FFCF00]"
                            {...register('email')}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-[#5A4A2A] font-medium text-sm">Password</Label>
                            <Link href="/forgot-password" className="text-xs text-[#1A1208] hover:text-[#8A7000] font-medium transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password" type="password" autoComplete="current-password"
                            placeholder="••••••••"
                            className="h-11 rounded-xl border-[#E8DFCC] bg-[#FEFCF8] focus-visible:ring-[#FFCF00] focus-visible:border-[#FFCF00]"
                            {...register('password')}
                        />
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        style={{height: '2.75rem', borderRadius: '0.875rem'}}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                                    <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                </svg>
                                Logging in…
                            </span>
                        ) : 'Login'}
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#F0EAD9] text-center">
                    <p className="text-sm text-[#8A7A62]">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-[#1A1208] font-semibold hover:text-[#8A7000] transition-colors">
                            Create one free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="bg-white rounded-2xl overflow-hidden p-8 text-center text-sm text-[#8A7A62]"
                     style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
                    Loading…
                </div>
            }
        >
            <LoginForm/>
        </Suspense>
    );
}
