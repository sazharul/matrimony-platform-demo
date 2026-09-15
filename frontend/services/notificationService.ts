/**
 * notificationService — wraps API calls for in-app notifications.
 * Connected to the Laravel backend API.
 *
 * API endpoints:
 *   GET    /api/v1/notifications
 *   GET    /api/v1/notifications/unread-count
 *   PUT    /api/v1/notifications/{id}/read
 *   PUT    /api/v1/notifications/read-all
 *   DELETE /api/v1/notifications/{id}
 */

import api from '@/lib/api';
import {normalizeNotificationType, resolveActionUrl} from '@/lib/notificationNavigation';
import type {AppNotification, BackendNotification} from '@/types/notification';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

export interface NotificationPagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedNotifications {
    items: AppNotification[];
    unreadCount: number;
    pagination: NotificationPagination;
}

interface NotificationsResponse {
    data: BackendNotification[];
    unread_count: number;
    pagination: NotificationPagination;
}

/** Append admin reason to notification body when stored separately */
function formatNotificationBody(n: BackendNotification): string {
    const message = n.data?.message ?? '';
    const reason = n.data?.admin_message;
    if (typeof reason === 'string' && reason && !message.includes(reason)) {
        return message + (message ? ' Reason: ' : 'Reason: ') + reason;
    }
    return message;
}

/** Transform a backend notification to the frontend AppNotification shape */
function transformNotification(n: BackendNotification): AppNotification {
    const type = normalizeNotificationType(n);

    return {
        id: n.id,
        type,
        title: n.data?.title ?? 'Notification',
        body: formatNotificationBody(n),
        action_url: resolveActionUrl(type, n.data ?? {}),
        avatar: null,
        is_read: n.is_read,
        read_at: n.read_at ?? null,
        created_at: n.created_at,
        meta: n.data,
    };
}

export const notificationService = {
    /** Fetch first page of notifications + unread count for the bell (single request). */
    async getBellSnapshot(): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
        const res = await api.get<ApiResponse<NotificationsResponse>>('/notifications');
        const body = res.data.data;
        return {
            notifications: body.data.map(transformNotification),
            unreadCount: body.unread_count,
        };
    },

    /** @deprecated Use getBellSnapshot — kept for callers that only need the list */
    async getAll(): Promise<AppNotification[]> {
        const {notifications} = await this.getBellSnapshot();
        return notifications;
    },

    /** Fetch a single notification by ID (auto-marks as read on the backend) */
    async getById(id: string): Promise<AppNotification | null> {
        try {
            const res = await api.get<ApiResponse<BackendNotification>>(`/notifications/${id}`);
            return transformNotification(res.data.data);
        } catch {
            return null;
        }
    },

    /** Fetch paginated notifications (for the history page) */
    async getPaginated(page = 1, perPage = 15, unreadOnly = false): Promise<PaginatedNotifications> {        const params: Record<string, string | number | boolean> = {page, per_page: perPage};
        if (unreadOnly) params.unread_only = true;
        const res = await api.get<ApiResponse<NotificationsResponse>>('/notifications', {params});
        const body = res.data.data;
        return {
            items: body.data.map(transformNotification),
            unreadCount: body.unread_count,
            pagination: body.pagination,
        };
    },

    /** Mark a single notification as read */
    async markRead(id: string): Promise<void> {
        await api.put(`/notifications/${id}/read`);
    },

    /** Mark all notifications as read */
    async markAllRead(): Promise<void> {
        await api.put('/notifications/read-all');
    },

    /** Delete a notification */
    async destroy(id: string): Promise<void> {
        await api.delete(`/notifications/${id}`);
    },

    /** Get unread count */
    async getUnreadCount(): Promise<number> {
        const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
        return res.data.data.count;
    },

    /** Transform a raw backend notification (e.g. from WebSocket) to AppNotification */
    transformNotification,

    // ── Admin ──────────────────────────────────────────────────────────────

    /** Broadcast a notification to users (admin only) */
    async adminBroadcast(
        title: string,
        message: string,
        target: 'all' | 'free' | 'silver' | 'gold' | 'platinum' = 'all',
        channel: 'application' | 'email' | 'both' = 'application',
    ): Promise<{ notified_count: number }> {
        const res = await api.post<ApiResponse<{ notified_count: number }>>('/admin/notifications/broadcast', {
            title, message, target, channel,
        });
        return res.data.data;
    },

    /** Fetch all notifications for admin (paginated, all users) */
    async adminGetAll(page = 1, perPage = 20): Promise<PaginatedNotifications> {
        const res = await api.get<ApiResponse<{ data: BackendNotification[]; pagination: NotificationPagination }>>('/admin/notifications', {
            params: { page, per_page: perPage },
        });
        const body = res.data.data;
        return {
            items: body.data.map(transformNotification),
            unreadCount: 0,
            pagination: body.pagination,
        };
    },
};
