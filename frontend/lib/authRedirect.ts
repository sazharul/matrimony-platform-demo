import type {User} from '@/types/user';

export const FACE_SCAN_COMPLETE_STATUSES = ['submitted', 'approved'] as const;

export function isFaceScanEnabled(settingsValue: string | null | undefined): boolean {
    if (settingsValue === null || settingsValue === undefined) return true;
    return ['1', 'true', 'yes', 'on'].includes(String(settingsValue).toLowerCase());
}

export function isFaceScanComplete(status: User['face_scan_status']): boolean {
    return FACE_SCAN_COMPLETE_STATUSES.includes(status as typeof FACE_SCAN_COMPLETE_STATUSES[number]);
}

export function needsFaceScan(user: User | null | undefined, faceScanEnabled = true): boolean {
    if (!user || !faceScanEnabled) return false;
    return !!user.face_scan_required && !isFaceScanComplete(user.face_scan_status);
}

/**
 * Determine the next onboarding step after login or registration.
 */
export function getPostAuthRedirect(user: User, faceScanEnabled = true): string {
    if (user.email_verification_required && !user.email_verified_at) {
        return '/verify-email';
    }

    if (needsFaceScan(user, faceScanEnabled)) {
        return '/face-scan';
    }

    return '/dashboard';
}

export function needsEmailVerification(user: User | null | undefined): boolean {
    return !!user?.email_verification_required && !user.email_verified_at;
}

/**
 * Merge fresh user data without downgrading optimistic face-scan status.
 */
export function mergeUserUpdate(current: User | null, fresh: User): User {
    if (!current) return fresh;

    const currentStatus = current.face_scan_status;
    const freshStatus = fresh.face_scan_status;

    // Server truth wins when face scan is no longer complete (e.g. after admin rejection)
    if (isFaceScanComplete(currentStatus) && !isFaceScanComplete(freshStatus)) {
        return fresh;
    }

    // Avoid stale pending overwriting optimistic submitted during same-session upload
    if (isFaceScanComplete(currentStatus) && freshStatus === 'pending') {
        return { ...fresh, face_scan_status: currentStatus };
    }

    return fresh;
}
