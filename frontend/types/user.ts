export interface User {
    id: number;
    name: string;
    email: string;
    gender: 'male' | 'female';
    profile_created_by: 'self' | 'parents' | 'siblings' | 'guardian' | 'relative_and_friends';
    role: 'user' | 'admin';
    is_active: boolean;
    is_banned: boolean;
    subscription_plan: string;   // free-text tier: free | silver | gold | platinum | vip …
    subscription_expires_at: string | null;
    email_verified_at: string | null;
    email_verification_required?: boolean;
    face_scan_required?: boolean;
    face_scan_status?: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
    face_scan_completed_at?: string | null;
    face_scan_review_note?: string | null;
}

export interface AuthResponse {
    success: boolean;
    data: {
        token: string;
        token_type: string;
        user: User;
    };
    message: string;
    errors: Record<string, string[]> | null;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    errors: Record<string, string[]> | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

