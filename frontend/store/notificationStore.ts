'use client';

import {create} from 'zustand';
import type {AppNotification} from '@/types/notification';
import {notificationService} from '@/services/notificationService';

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    /** Fetch notifications from service and sync state */
    fetchNotifications: () => Promise<void>;
    /** Mark one notification as read */
    markRead: (id: string) => Promise<void>;
    /** Mark all as read */
    markAllRead: () => Promise<void>;
    /** Remove a notification */
    remove: (id: string) => Promise<void>;
    /** Push a new real-time notification (from WebSocket) */
    addNotification: (notification: AppNotification) => void;
}

let fetchNotificationsPromise: Promise<void> | null = null;

export const useNotificationStore = create<NotificationState>()((set) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        if (fetchNotificationsPromise) return fetchNotificationsPromise;

        fetchNotificationsPromise = (async () => {
            set({isLoading: true});
            try {
                const {notifications, unreadCount} = await notificationService.getBellSnapshot();
                set({
                    notifications,
                    unreadCount,
                    isLoading: false,
                });
            } catch {
                set({isLoading: false});
            } finally {
                fetchNotificationsPromise = null;
            }
        })();

        return fetchNotificationsPromise;
    },

    markRead: async (id) => {
        await notificationService.markRead(id);
        set((state) => {
            const updated = state.notifications.map((n) =>
                n.id === id ? {...n, is_read: true, read_at: new Date().toISOString()} : n
            );
            return {
                notifications: updated,
                unreadCount: updated.filter((n) => !n.is_read).length,
            };
        });
    },

    markAllRead: async () => {
        await notificationService.markAllRead();
        const now = new Date().toISOString();
        set((state) => ({
            notifications: state.notifications.map((n) => ({...n, is_read: true, read_at: now})),
            unreadCount: 0,
        }));
    },

    remove: async (id) => {
        await notificationService.destroy(id);
        set((state) => {
            const updated = state.notifications.filter((n) => n.id !== id);
            return {
                notifications: updated,
                unreadCount: updated.filter((n) => !n.is_read).length,
            };
        });
    },

    addNotification: (notification) => {
        set((state) => {
            // Deduplicate — ignore if this id already exists
            if (state.notifications.some((n) => n.id === notification.id)) return state;
            return {
                notifications: [notification, ...state.notifications],
                unreadCount: state.unreadCount + (notification.is_read ? 0 : 1),
            };
        });
    },
}));

