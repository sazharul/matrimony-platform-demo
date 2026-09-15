'use client';

import {useEffect, useRef, useState, Suspense} from 'react';
import {useSearchParams, useRouter} from 'next/navigation';
import Link from 'next/link';
import {authService} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {getPostAuthRedirect} from '@/lib/authRedirect';
import {useSettings} from '@/lib/useSettings';

// ── Mode A: Verification callback (user clicked the email link) ─────────────
function VerifyCallback({vUrl}: { vUrl: string }) {
    const router = useRouter();
    const updateUser = useAuthStore((s) => s.updateUser);
    const user = useAuthStore((s) => s.user);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const {settings} = useSettings();
    const otpExpiryMinutes = settings.email_otp_expiry_minutes ?? '15';
    const [status, setStatus] = useState<'loading' | 'success' | 'already' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const run = async () => {
            try {
                const decoded = decodeURIComponent(vUrl);
                const parsed = new URL(decoded);
                const parts = parsed.pathname.split('/').filter(Boolean);
                const id = parts[parts.length - 2];
                const hash = parts[parts.length - 1];
                const expires = parsed.searchParams.get('expires') ?? '';
                const signature = parsed.searchParams.get('signature') ?? '';

                const res = await authService.verifyEmail(id, hash, expires, signature);

                if (isAuthenticated) {
                    updateUser({email_verified_at: new Date().toISOString()});
                }

                const msg = res.data?.message ?? '';
                setStatus(msg.toLowerCase().includes('already') ? 'already' : 'success');
            } catch (err: unknown) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setErrorMsg(
                    axiosErr.response?.data?.message ??
                    'Verification failed. The link may be expired or invalid.'
                );
                setStatus('error');
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vUrl]);

    useEffect(() => {
        if ((status === 'success' || status === 'already') && isAuthenticated && user) {
            const timer = setTimeout(() => {
                router.replace(getPostAuthRedirect({...user, email_verified_at: user.email_verified_at ?? new Date().toISOString()}));
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [status, isAuthenticated, user, router]);

    if (status === 'loading') {
        return (
            <div className="p-8 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse"
                     style={{background: 'var(--gradient-gold-btn)'}}>
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Verifying your email…</h2>
                <p className="text-sm text-muted-foreground mt-2">Please wait a moment.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-green-700" style={{fontFamily:'var(--font-heading)'}}>Email Verified!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Your email has been verified successfully.
                    {isAuthenticated ? ' Redirecting you to the next step…' : ' You can now login to continue.'}
                </p>
                {!isAuthenticated && (
                    <Link href="/login">
                        <button className="btn-gold w-full flex items-center justify-center gap-1.5"
                                style={{height:'2.75rem', borderRadius:'0.875rem'}}>
                            Login to Continue
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </Link>
                )}
            </div>
        );
    }

    if (status === 'already') {
        return (
            <div className="p-8 text-center space-y-4">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                    <svg className="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Already Verified</h2>
                <p className="text-muted-foreground text-sm">Your email address is already verified.</p>
                {!isAuthenticated ? (
                    <Link href="/login">
                        <button className="btn-gold w-full flex items-center justify-center gap-1.5"
                                style={{height:'2.75rem', borderRadius:'0.875rem'}}>
                            Go to Login
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </Link>
                ) : (
                    <p className="text-sm text-muted-foreground">Redirecting…</p>
                )}
            </div>
        );
    }

    return (
        <div className="p-8 text-center space-y-4">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-destructive" style={{fontFamily:'var(--font-heading)'}}>Verification Failed</h2>
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                {errorMsg}
            </div>
            <p className="text-xs text-muted-foreground">
                Verification codes expire after {otpExpiryMinutes} minutes. Enter the 6-digit code from your email or request a new one below.
            </p>
            <Link href="/verify-email">
                <button className="btn-gold w-full"
                        style={{height:'2.75rem', borderRadius:'0.875rem'}}>
                    Enter Verification Code
                </button>
            </Link>
        </div>
    );
}

// ── Mode B: 6-digit OTP entry ───────────────────────────────────────────────
function OtpVerification() {
    const router = useRouter();
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const {settings} = useSettings();
    const otpExpiryMinutes = settings.email_otp_expiry_minutes ?? '15';
    const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const code = digits.join('');

    const handleDigitChange = (index: number, value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = cleaned;
        setDigits(next);
        setError(null);

        if (cleaned && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, key: string) => {
        if (key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
        setDigits(next);
        setError(null);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleVerify = async () => {
        if (code.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await authService.verifyEmailOtp(code);
            const verifiedAt = res.data.data.email_verified_at ?? new Date().toISOString();
            updateUser({email_verified_at: verifiedAt});

            const updatedUser = user ? {...user, email_verified_at: verifiedAt} : null;
            router.replace(updatedUser ? getPostAuthRedirect(updatedUser) : '/dashboard');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message ?? 'Invalid or expired verification code.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            await authService.resendVerification();
            setResent(true);
            setDigits(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch {
            setError('Failed to resend. Please try again shortly.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="p-8 space-y-5">
            <div className="text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
                     style={{background: 'var(--gradient-gold-btn)', boxShadow: 'var(--shadow-btn)'}}>
                    <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground" style={{fontFamily:'var(--font-heading)'}}>Verify your email</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-foreground">{user?.email ?? 'your email'}</span>.
                    Enter it below to continue. The code expires in {otpExpiryMinutes} minutes.
                </p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e.key)}
                        className="w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 border-[var(--border)] bg-[var(--input)] text-center text-xl font-bold text-foreground focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                        autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    />
                ))}
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 text-center">
                    {error}
                </div>
            )}

            {resent && (
                <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-600 text-center flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    A new verification code has been sent.
                </div>
            )}

            <button
                onClick={handleVerify}
                disabled={submitting || code.length !== 6}
                className="btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed"
                style={{height:'2.75rem', borderRadius:'0.875rem'}}
            >
                {submitting ? 'Verifying…' : 'Verify Email'}
            </button>

            <p className="text-xs text-muted-foreground text-center">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#1A1208] hover:text-[#8A7000] font-medium transition-colors disabled:opacity-60"
                >
                    {resending ? 'sending…' : 'resend code'}
                </button>
            </p>
        </div>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const vUrl = searchParams.get('v_url');
    return vUrl ? <VerifyCallback vUrl={vUrl}/> : <OtpVerification/>;
}

export default function VerifyEmailPage() {
    return (
        <div className="bg-card rounded-2xl overflow-hidden animate-fade-in-up"
             style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
            <div className="h-1.5 w-full" style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}/>
            <Suspense
                fallback={
                    <div className="p-8 text-center text-sm text-muted-foreground">
                        Loading…
                    </div>
                }
            >
                <VerifyEmailContent/>
            </Suspense>
        </div>
    );
}
