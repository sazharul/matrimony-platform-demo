export interface AdminDashboardStats {
    total_users: number;
    active_today: number;
    pending_photos: number;
    pending_reports: number;
    new_users_today: number;
    verified_users: number;
    banned_users: number;
    active_subscriptions: number;
}

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    gender: 'male' | 'female';
    role: 'user' | 'admin';
    is_active: boolean;
    is_banned: boolean;
    subscription_plan: string;
    email_verified_at: string | null;
    created_at: string;
    deleted_at: string | null;
    profile?: {
        profile_id: string;
        is_verified: boolean;
        profile_completion_percentage: number;
        last_seen_at: string | null;
    } | null;
    face_scan_session?: {
        id: number;
        status: 'pending' | 'submitted' | 'approved' | 'rejected';
        completed_at: string | null;
        reviewed_at: string | null;
        review_note: string | null;
        latest_capture?: {
            id: number;
            capture_key: string;
            image_path: string;
            metadata: Record<string, unknown> | null;
            captured_at: string | null;
        } | null;
    } | null;
}

export interface AdminPhoto {
    id: number;
    user_id: number;
    file_path: string;
    url?: string | null;
    is_primary: boolean;
    is_approved: boolean;
    moderation_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
        profile?: {
            profile_id: string;
        } | null;
    } | null;
}

export interface AdminReport {
    id: number;
    reporter_id: number;
    reported_id: number;
    reason: 'fake_profile' | 'inappropriate_photo' | 'abusive' | 'spam' | 'other';
    description: string | null;
    status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
    created_at: string;
    reporter?: {
        id: number;
        name: string;
        profile?: { profile_id: string } | null;
    } | null;
    reported?: {
        id: number;
        name: string;
        profile?: { profile_id: string } | null;
    } | null;
}

export interface SelectOption {
    id: number;
    group_key: string;
    parent_id: number | null;
    value: string;
    label: string;
    metadata: Record<string, unknown> | null;
    sort_order: number;
    is_active: boolean;
    children?: SelectOption[];
}

export interface AdminUserDetail {
    user: AdminUser & {
        deleted_at: string | null;
        email_verified_at: string | null;
        religious_detail?: Record<string, unknown> | null;
        family_detail?: Record<string, unknown> | null;
        education_career?: Record<string, unknown> | null;
        lifestyle?: Record<string, unknown> | null;
        horoscope_detail?: Record<string, unknown> | null;
        partner_preference?: Record<string, unknown> | null;
        photos?: Array<Record<string, unknown>>;
    };
    face_scan: {
        id: number;
        status: 'pending' | 'submitted' | 'approved' | 'rejected';
        completed_at: string | null;
        reviewed_at: string | null;
        review_note: string | null;
        reviewed_by: number | null;
        captures: Array<{
            id: number;
            capture_key: string;
            image_path: string;
            metadata: Record<string, unknown> | null;
            captured_at: string | null;
        }>;
    } | null;
}

