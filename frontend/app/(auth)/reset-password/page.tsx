'use client';

import {useState, Suspense} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {getApiErrorMessage} from '@/lib/apiErrors';
import {useSettings} from '@/lib/useSettings';

const schema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        password_confirmation: z.string(),
    })
    .refine((d) => d.password === d.password_confirmation, {
        message: 'Passwords do not match',
        path: ['password_confirmation'],
    });

type FormData = z.infer<typeof schema>;

// Inner component reads query params (requires Suspense boundary)
function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const [serverError, setServerError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    // Guard: if no token/email in URL, show an error
    if (!token || !email) {
        return (
            <div
                className="rounded-xl bg-red-50 border border-red-200 px-4 py-4 text-sm text-red-700 text-center space-y-2">
                <p className="font-medium flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Invalid or missing reset link. Please request a new one.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1 mt-2 text-[#1A1208] font-medium hover:underline"
                >
                    Request new link
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="space-y-4 text-center">
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <p className="font-semibold text-base">
                        {successMessage ?? 'Password reset successfully!'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        You can now login with your new password.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/login')}
                    className="btn-gold w-full"
                    style={{height:'2.75rem', borderRadius:'0.875rem'}}
                >
                    Go to Login
                </button>
            </div>
        );
    }

    const onSubmit = async (data: FormData) => {
        setServerError(null);
        try {
            const res = await authService.resetPassword({
                token,
                email,
                password: data.password,
                password_confirmation: data.password_confirmation,
            });
            setSuccessMessage(res.data.message || null);
            setSuccess(true);
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { message?: string; errors?: Record<string, string | string[]> } };
            };
            setServerError(
                getApiErrorMessage(
                    axiosErr.response?.data,
                    'Password reset failed. The link may be expired or invalid.',
                    'token',
                ),
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {serverError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                    {serverError}
                    {serverError.toLowerCase().includes('invalid') ||
                    serverError.toLowerCase().includes('expired') ? (
                        <span>
              {' '}
                            <Link href="/forgot-password" className="underline font-medium">
                Request a new link
              </Link>
              .
            </span>
                    ) : null}
                </div>
            )}

            <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[var(--secondary-foreground)] font-medium text-sm">New password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                    {...register('password')}
                />
                {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password_confirmation" className="text-[var(--secondary-foreground)] font-medium text-sm">Confirm new password</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Repeat new password"
                    className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                    {...register('password_confirmation')}
                />
                {errors.password_confirmation && (
                    <p className="text-xs text-red-500">
                        {errors.password_confirmation.message}
                    </p>
                )}
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
                        Resetting…
                    </span>
                ) : 'Reset Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    const {settings} = useSettings();

    return (
        <div className="bg-card rounded-2xl overflow-hidden animate-fade-in-up"
             style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
            <div className="h-1.5 w-full" style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}/>

            <div className="p-8">
                <div className="text-center mb-7">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                         style={{background: 'var(--gradient-gold-btn)', boxShadow: 'var(--shadow-btn)'}}>
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground" style={{fontFamily: 'var(--font-heading)'}}>
                        Set new password
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter a strong password for your {settings.site_name} account
                    </p>
                </div>

                <Suspense
                    fallback={
                        <div className="text-center text-sm text-muted-foreground py-8">
                            Loading…
                        </div>
                    }
                >
                    <ResetPasswordForm/>
                </Suspense>

                <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
                    <p className="text-sm text-muted-foreground">
                        Remembered your password?{' '}
                        <Link href="/login" className="text-[var(--primary)] font-semibold hover:text-[var(--gold-600)] transition-colors">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

