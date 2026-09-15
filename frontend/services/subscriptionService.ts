import api from '@/lib/api';
import type { ApiResponse } from '@/types/user';
import type {
    InitiatePaymentResponse,
    PaymentHistoryItem,
    SubscribeFreeResponse,
    SubscriptionPlan,
    SubscriptionStatus,
    SwitchPlanResponse,
} from '@/types/subscription';

export const subscriptionService = {
    /** Get all active subscription plans */
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const res = await api.get<ApiResponse<SubscriptionPlan[]>>('/subscription/plans');
        return res.data.data;
    },

    /** Initiate a payment and get SSLCommerz redirect URL (paid plans only) */
    initiate: async (planId: number): Promise<InitiatePaymentResponse> => {
        const res = await api.post<ApiResponse<InitiatePaymentResponse>>('/subscription/initiate', {
            plan_id: planId,
        });
        return res.data.data;
    },

    /** Subscribe to a free plan (price = 0) directly — no payment needed */
    subscribeFree: async (planId: number): Promise<SubscribeFreeResponse> => {
        const res = await api.post<ApiResponse<SubscribeFreeResponse>>('/subscription/free', {
            plan_id: planId,
        });
        return res.data.data;
    },

    /** Get authenticated user's current subscription status */
    getStatus: async (): Promise<SubscriptionStatus> => {
        const res = await api.get<ApiResponse<SubscriptionStatus>>('/subscription/status');
        return res.data.data;
    },

    /** Get full payment history for the authenticated user */
    getHistory: async (): Promise<PaymentHistoryItem[]> => {
        const res = await api.get<ApiResponse<PaymentHistoryItem[]>>('/subscription/history');
        return res.data.data;
    },

    /** Switch the currently active plan to a different paid subscription */
    switchPlan: async (subscriptionId: number): Promise<SwitchPlanResponse> => {
        const res = await api.post<ApiResponse<SwitchPlanResponse>>(`/subscription/${subscriptionId}/switch`);
        return res.data.data;
    },

    /** Download PDF invoice for a subscription */
    downloadInvoice: async (subscriptionId: number): Promise<Blob> => {
        const res = await api.get(`/subscription/${subscriptionId}/invoice`, {
            responseType: 'blob',
        });

        if (res.data.type === 'application/json') {
            const text = await (res.data as Blob).text();
            const json = JSON.parse(text) as { message?: string };
            throw new Error(json.message || 'Failed to download invoice.');
        }

        return res.data;
    },
};
