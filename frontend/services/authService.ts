import api from '@/lib/api';
import type {ApiResponse, AuthResponse} from '@/types/user';

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    gender: 'male' | 'female';
    profile_created_by: 'self' | 'parents' | 'siblings' | 'guardian' | 'relative_and_friends';
}

export interface LoginData {
    email: string;
    password: string;
}

export interface ResetPasswordData {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ChangePasswordData {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}

export const authService = {
    register: (data: RegisterData) =>
        api.post<AuthResponse>('/auth/register', data),

    login: (data: LoginData) =>
        api.post<AuthResponse>('/auth/login', data),

    logout: () =>
        api.post<ApiResponse<null>>('/auth/logout'),

    me: () =>
        api.get<ApiResponse<{ user: import('@/types/user').User }>>('/auth/me'),

    resendVerification: () =>
        api.post<ApiResponse<null>>('/auth/email/resend'),

    verifyEmailOtp: (code: string) =>
        api.post<ApiResponse<{ email_verified_at: string }>>('/auth/email/verify-otp', {code}),

    verifyEmail: (id: string, hash: string, expires: string, signature: string) =>
        api.get<ApiResponse<null>>(`/auth/email/verify/${id}/${hash}`, {
            params: {expires, signature},
        }),

    forgotPassword: (email: string) =>
        api.post<ApiResponse<null>>('/auth/password/forgot', {email}),

    resetPassword: (data: ResetPasswordData) =>
        api.post<ApiResponse<null>>('/auth/password/reset', data),

    changePassword: (data: ChangePasswordData) =>
        api.put<ApiResponse<null>>('/auth/change-password', data),
};

