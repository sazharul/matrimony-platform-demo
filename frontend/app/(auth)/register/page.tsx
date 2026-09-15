'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {authService, type RegisterData} from '@/services/authService';
import {useAuthStore} from '@/store/authStore';
import {getPostAuthRedirect} from '@/lib/authRedirect';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {SearchableSelect} from '@/components/ui/SearchableSelect';
import {useOptions} from '@/hooks/useSelectOptions';

// Step schemas
const step1Schema = z.object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
    gender: z.enum(['male', 'female'], {error: 'Please select your gender'}),
    profile_created_by: z.string().min(1, 'Please select who created this profile'),
}).refine((d) => d.password === d.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
});

type Step1Form = z.infer<typeof step1Schema>;

export default function RegisterPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [serverError, setServerError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
    const { data: profileCreatedByOptions = [] } = useOptions('profile_created_by');

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: {errors, isSubmitting},
    } = useForm<Step1Form>({resolver: zodResolver(step1Schema)});

    const onSubmitStep1 = async (data: Step1Form) => {
        setServerError(null);
        setFieldErrors({});
        try {
            const res = await authService.register({
                ...data,
                profile_created_by: data.profile_created_by as RegisterData['profile_created_by'],
            });
            const {user, token} = res.data.data;
            setAuth(user, token);
            router.push(getPostAuthRedirect(user));
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
            setServerError(axiosErr.response?.data?.message ?? 'Registration failed. Please try again.');
            setFieldErrors(axiosErr.response?.data?.errors ?? {});
        }
    };

    return (
        <div className="bg-card rounded-2xl overflow-hidden animate-fade-in-up"
             style={{boxShadow: '0 4px 40px rgba(255,207,0,0.12), 0 1px 8px rgba(0,0,0,0.06)'}}>
            {/* Header accent */}
            <div className="h-1.5 w-full" style={{background: 'linear-gradient(90deg, #FFCF00, #FFE033, #FFCF00)'}}/>

            <div className="p-8">
                <div className="mb-7">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-2xl font-bold text-foreground" style={{fontFamily: 'var(--font-heading)'}}>Create account</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Start your journey to finding your life partner</p>
                </div>

                <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4" noValidate>
                    {serverError && (
                        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {serverError}
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-[var(--secondary-foreground)] font-medium text-sm">Full name</Label>
                        <Input id="name" placeholder="Your full name"
                               className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                               {...register('name')} />
                        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-[var(--secondary-foreground)] font-medium text-sm">Email address</Label>
                        <Input id="email" type="email" placeholder="you@example.com"
                               className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                               {...register('email')} />
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>}
                    </div>

                    {/* Gender */}
                    <div className="space-y-1.5">
                        <Label className="text-[var(--secondary-foreground)] font-medium text-sm">I am a</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['male', 'female'] as const).map((g) => (
                                <label
                                    key={g}
                                    className={`border-2 rounded-xl p-3 text-center cursor-pointer transition-all capitalize ${
                                        watch('gender') === g
                                            ? 'border-[var(--primary)] bg-[var(--accent)] text-[#1A1208] font-semibold shadow-sm'
                                            : 'border-[var(--border)] text-muted-foreground hover:border-[var(--primary)]/50 hover:bg-[var(--accent)]/50'
                                    }`}
                                >
                                    <input type="radio" value={g} {...register('gender')} className="sr-only"/>
                                    {g === 'male' ? '👨 Groom' : '👩 Bride'}
                                </label>
                            ))}
                        </div>
                        {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                    </div>

                    {/* Profile created by */}
                    <div className="space-y-1.5">
                        <Label className="text-[var(--secondary-foreground)] font-medium text-sm">Profile created by</Label>
                        <Controller
                            name="profile_created_by"
                            control={control}
                            render={({ field }) => (
                                <SearchableSelect
                                    id="profile_created_by"
                                    options={profileCreatedByOptions}
                                    value={field.value}
                                    onChange={(v) => field.onChange(v ?? '')}
                                    placeholder="Select…"
                                />
                            )}
                        />
                        {errors.profile_created_by && <p className="text-xs text-red-500">{errors.profile_created_by.message}</p>}
                        {fieldErrors.profile_created_by && <p className="text-xs text-red-500">{fieldErrors.profile_created_by[0]}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-[var(--secondary-foreground)] font-medium text-sm">Password</Label>
                        <Input id="password" type="password" placeholder="Min. 8 characters"
                               className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                               {...register('password')} />
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-[var(--secondary-foreground)] font-medium text-sm">Confirm password</Label>
                        <Input id="password_confirmation" type="password" placeholder="Repeat password"
                               className="h-11 rounded-xl border-[var(--border)] bg-[var(--input)] focus-visible:ring-[var(--ring)] focus-visible:border-[var(--primary)]"
                               {...register('password_confirmation')} />
                        {errors.password_confirmation &&
                            <p className="text-xs text-red-500">{errors.password_confirmation.message}</p>}
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
                                Creating account…
                            </span>
                        ) : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--primary)] font-semibold hover:text-[var(--gold-600)] transition-colors">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

