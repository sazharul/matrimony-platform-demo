export type NotificationType =
    | 'interest_received'
    | 'interest_accepted'
    | 'profile_viewed'
    | 'new_message'
    | 'match_suggestion'
    | 'match_digest'
    | 'subscription_expiring'
    | 'subscription_expiry'
    | 'subscription_activated'
    | 'photo_approved'
    | 'photo_rejected'
    | 'face_scan_approved'
    | 'face_scan_rejected'
    | 'account_disable_request_submitted'
    | 'account_disable_request_disabled'
    | 'account_disable_request_banned'
    | 'account_disable_request_dismissed'
    | 'account_disable_request_reactivated'
    | 'admin_account_disabled'
    | 'admin_account_banned'
    | 'admin_account_reactivated'
    | 'interest_expired'
    | 'system'
    | 'broadcast_message';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    /** Route to navigate to when notification is clicked */
    action_url: string | null;
    /** Small avatar / icon URL for the notification */
    avatar: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    /** Optional extra metadata from backend `data` field */
    meta?: Record<string, unknown>;
}

/** Raw notification shape as returned by the backend API or WebSocket event */
export interface BackendNotification {
    id: string;
    type: string;
    data: {
        title?: string;
        message?: string;
        sender_id?: number;
        sender_name?: string;
        conversation_id?: number;
        profile_id?: string;
        viewer_id?: number;
        viewer_name?: string;
        accepter_id?: number;
        accepter_name?: string;
        days_left?: number;
        reason?: string;
        [key: string]: unknown;
    };
    is_read: boolean;
    read_at: string | null | undefined;
    created_at: string;
}
