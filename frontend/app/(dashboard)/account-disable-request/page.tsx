'use client';

import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {useMutation} from '@tanstack/react-query';
import {
    accountDisableRequestService,
    ACCOUNT_DISABLE_REQUEST_TYPES,
    type AccountDisableRequestType,
} from '@/services/accountDisableRequestService';
import {showErrorToast, showSuccessToast, getErrorMessage} from '@/lib/toast';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';

const schema = z.object({
    request_type: z
        .enum(['personal_reason', 'got_married_through_platform'])
        .refine((val) => val !== undefined, {
            message: 'Please select a request type.',
        }),
    message: z
        .string()
        .min(10, 'Please provide at least 10 characters explaining your reason.')
        .max(2000, 'Message must be at most 2000 characters.'),
});

type FormValues = {
    request_type: AccountDisableRequestType;
    message: string;
};

const btnStyle = {minWidth: '140px'};

export default function AccountDisableRequestPage() {
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            request_type: 'personal_reason',
            message: '',
        },
    });

    const mutation = useMutation({
        mutationFn: accountDisableRequestService.submit,
        onSuccess: () => {
            setSubmitted(true);
            form.reset({request_type: 'personal_reason', message: ''});
            showSuccessToast('Your request has been submitted. Our team will review it shortly.');
        },
        onError: (error) => showErrorToast(getErrorMessage(error)),
    });

    const onSubmit = (values: FormValues) => {
        mutation.mutate(values);
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="page-title mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Account Disable Request</h1>
                </div>
                <div className="card-premium p-8 text-center space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Request Submitted</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        We have received your account disable request. Our admin team will review it and take appropriate action. You will be notified once the review is complete.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-2"
                        onClick={() => setSubmitted(false)}
                    >
                        Submit another request
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="page-title mb-6">
                <h1 className="text-2xl font-bold text-foreground">Account Disable Request</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Request to disable your account. Our team will review your request before taking any action.
                </p>
            </div>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="card-premium p-6 space-y-5"
            >
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Submitting this form does not immediately disable your account. An administrator will review your request and contact you if needed.
                </div>

                <div className="space-y-2">
                    <Label htmlFor="request_type">Request Type</Label>
                    <select
                        id="request_type"
                        className="w-full rounded-xl border border-border bg-input px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        {...form.register('request_type')}
                    >
                        {ACCOUNT_DISABLE_REQUEST_TYPES.map(({value, label}) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    {form.formState.errors.request_type && (
                        <p className="text-xs text-red-500">{form.formState.errors.request_type.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                        id="message"
                        rows={5}
                        placeholder="Please explain why you would like to disable your account…"
                        className="border-border bg-input focus-visible:ring-ring resize-none"
                        {...form.register('message')}
                    />
                    {form.formState.errors.message && (
                        <p className="text-xs text-red-500">{form.formState.errors.message.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Minimum 10 characters. This message will be visible to our admin team.
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="btn-gold"
                    style={btnStyle}
                >
                    {mutation.isPending ? 'Submitting…' : 'Submit Request'}
                </Button>
            </form>
        </div>
    );
}
