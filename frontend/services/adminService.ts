import api from '@/lib/api';

// ── Dashboard ─────────────────────────────────────────────────────────────
export const adminService = {
    // Dashboard stats
    getDashboardStats: () => api.get('/admin/dashboard'),

    // Users
    getUsers: (params?: { search?: string; page?: number; role?: string; is_banned?: boolean }) =>
        api.get('/admin/users', { params }),
    getUser: (id: number) =>
        api.get(`/admin/users/${id}`),
    banUser: (id: number, is_banned: boolean) =>
        api.put(`/admin/users/${id}/ban`, { is_banned }),
    verifyUser: (id: number) =>
        api.put(`/admin/users/${id}/verify`),
    reviewFaceScan: (id: number, data: { decision: 'approved' | 'rejected' | 'ban'; review_note?: string }) =>
        api.put(`/admin/users/${id}/face-scan`, data),

    // Photo moderation
    getPendingPhotos: (page = 1) =>
        api.get('/admin/photos/pending', { params: { page } }),
    approvePhoto: (id: number) =>
        api.put(`/admin/photos/${id}/approve`),
    rejectPhoto: (id: number, reason?: string) =>
        api.put(`/admin/photos/${id}/reject`, { reason }),

    // Reports
    getReports: (params?: { status?: string; page?: number }) =>
        api.get('/admin/reports', { params }),
    takeReportAction: (id: number, status: string) =>
        api.put(`/admin/reports/${id}/action`, { status }),

    // Select options
    getSelectOptions: (params?: { group_key?: string; page?: number }) =>
        api.get('/admin/select-options', { params }),
    getSelectOptionGroups: () =>
        api.get('/admin/select-options/groups'),
    createSelectOption: (data: {
        group_key: string;
        parent_id?: number | null;
        value: string;
        label: string;
        sort_order?: number;
        is_active?: boolean;
        metadata?: Record<string, unknown>;
    }) => api.post('/admin/select-options', data),
    updateSelectOption: (id: number, data: Partial<{
        group_key: string;
        parent_id?: number | null;
        value: string;
        label: string;
        sort_order?: number;
        is_active?: boolean;
    }>) => api.put(`/admin/select-options/${id}`, data),
    deleteSelectOption: (id: number) =>
        api.delete(`/admin/select-options/${id}`),
    toggleSelectOption: (id: number) =>
        api.put(`/admin/select-options/${id}/toggle`),

    // Subscriptions
    getSubscriptions: (params?: { page?: number }) =>
        api.get('/admin/subscriptions', { params }),
    getSubscriptionStats: () =>
        api.get('/admin/subscriptions/stats'),
    getSubscriptionPlans: () =>
        api.get('/admin/subscription-plans'),

    // Notifications broadcast
    broadcastNotification: (data: { title: string; message: string }) =>
        api.post('/admin/notifications/broadcast', data),
};

