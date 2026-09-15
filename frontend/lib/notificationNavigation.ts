import type {BackendNotification, NotificationType} from '@/types/notification';

const KNOWN_TYPES: Record<NotificationType, 1> = {
    interest_received: 1,
    interest_accepted: 1,
    interest_expired: 1,
    profile_viewed: 1,
    new_message: 1,
    match_suggestion: 1,
    match_digest: 1,
    subscription_expiring: 1,
    subscription_expiry: 1,
    subscription_activated: 1,
    photo_approved: 1,
    photo_rejected: 1,
    face_scan_approved: 1,
    face_scan_rejected: 1,
    account_disable_request_submitted: 1,
    account_disable_request_disabled: 1,
    account_disable_request_banned: 1,
    account_disable_request_dismissed: 1,
    account_disable_request_reactivated: 1,
    admin_account_disabled: 1,
    admin_account_banned: 1,
    admin_account_reactivated: 1,
    system: 1,
    broadcast_message: 1,
};

/** Normalize backend type string (handles Laravel class names for match digest). */
export function normalizeNotificationType(n: BackendNotification): NotificationType {
    if (n.data?.type === 'match_digest' || n.type.includes('MatchDigest')) {
        return 'match_digest';
    }
    return n.type in KNOWN_TYPES ? (n.type as NotificationType) : 'system';
}

/** Map notification type + payload to the destination route. */
export function resolveActionUrl(type: NotificationType, data: BackendNotification['data'] = {}): string | null {
    switch (type) {
        case 'interest_received':
            return '/interests?tab=received';
        case 'interest_accepted':
            return '/interests?tab=contacts';
        case 'interest_expired':
            return '/interests?tab=received';
        case 'profile_viewed':
            return '/profile-views';
        case 'new_message':
            return data.conversation_id ? `/chat/${data.conversation_id}` : '/chat';
        case 'match_digest':
        case 'match_suggestion':
            return '/matches';
        case 'subscription_expiry':
        case 'subscription_expiring':
        case 'subscription_activated':
            return '/subscription';
        case 'photo_approved':
        case 'photo_rejected':
        case 'face_scan_approved':
        case 'face_scan_rejected':
            return '/profile/edit';
        case 'account_disable_request_submitted':
        case 'account_disable_request_dismissed':
            return '/account-disable-request';
        case 'account_disable_request_reactivated':
        case 'admin_account_reactivated':
            return '/login';
        default:
            return null;
    }
}

/** Short label for the detail-page action button. */
export function getActionButtonLabel(type: NotificationType): string {
    switch (type) {
        case 'new_message':
            return 'Open conversation';
        case 'interest_received':
        case 'interest_accepted':
        case 'interest_expired':
            return 'View interests';
        case 'profile_viewed':
            return 'View profile viewers';
        case 'match_digest':
        case 'match_suggestion':
            return 'View matches';
        case 'photo_approved':
        case 'photo_rejected':
        case 'face_scan_approved':
        case 'face_scan_rejected':
            return 'Edit profile';
        case 'subscription_expiry':
        case 'subscription_expiring':
        case 'subscription_activated':
            return 'View subscription';
        default:
            return 'Details';
    }
}
