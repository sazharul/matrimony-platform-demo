'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const schema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);
    const [serverMessage, setServerMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    const onSubmit = async (data: FormData) => {
        setServerMessage(null);
        try {
            const res = await authService.forgotPassword(data.email);
            setServerMessage(res.data.message);
            setSubmitted(true);
        } catch (err: unknown) {
            // Backend always returns success to prevent enumeration, but handle network errors
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setServerMessage(
                axiosErr.response?.data?.message ??
                'Something went wrong. Please try again.'
            );
        }
    };

    return (
        <div className="bg-card rounded-2xl overflow-hidden animate-fade-in-up"
             style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
            <div className="h-1.5 w-full" style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}/>

            <div className="p-8">
                <div className="text-center mb-7">
                    <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                         style={{background: 'var(--gradient-gold-btn)', boxShadow: 'var(--shadow-btn)'}}>
                        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground" style={{fontFamily: 'var(--font-heading)'}}>
                        Forgot password?
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enter your email and we&apos;ll send you a reset link
                    </p>
                </div>

                {submitted && serverMessage ? (
                    <div className="space-y-4">
                        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-700 text-center">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                                <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            </div>
                            {serverMessage}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Didn&apos;t receive it? Check your spam folder or{' '}
                            <button
                                onClick={() => setSubmitted(false)}
                                className="text-[#1A1208] hover:text-[#8A7000] font-medium transition-colors"
                            >
                                try again
                            </button>
                            .
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                        {serverMessage && !submitted && (
                            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                                {serverMessage}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[var(--secondary-foreground)] font-medium text-sm">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email.message}</p>
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
                                    Sending…
                                </span>
                            ) : 'Send Reset Link'}
                        </button>
                    </form>
                )}

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

