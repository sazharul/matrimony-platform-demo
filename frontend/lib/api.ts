import axios from 'axios';
import {useAuthStore} from '@/store/authStore';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Request interceptor — attach Bearer token
// Falls back to the Zustand persisted store when the standalone auth_token key is
// missing (e.g. after a partial clear or a previous 401 that only removed auth_token).
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        let token = localStorage.getItem('auth_token');

        if (!token) {
            // Try to recover from the Zustand persist store ('MatriConnect-auth')
            try {
                const persisted = localStorage.getItem('MatriConnect-auth');
                if (persisted) {
                    const state = JSON.parse(persisted)?.state;
                    if (state?.token) {
                        token = state.token as string;
                        // Re-sync the standalone key so future requests don't need to fall back
                        localStorage.setItem('auth_token', token as string);
                    }
                }
            } catch { /* ignore parse errors */
            }
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Auth endpoints that legitimately return 401 (invalid credentials, etc.) — the page
// must handle these errors instead of redirecting (which would reload and hide them).
const AUTH_ENDPOINTS_401_OK = /\/auth\/(login|register|password\/forgot|password\/reset)(\/|$|\?)/;

// Response interceptor — handle 401 for expired sessions only
// Clears BOTH auth_token and the Zustand persisted store so the dashboard layout
// correctly detects the logged-out state on the next render and redirects to /login
// without triggering an infinite 401 → redirect loop.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            const requestUrl = error.config?.url ?? '';
            const onLoginPage = window.location.pathname === '/login';
            const isPublicAuthRequest = AUTH_ENDPOINTS_401_OK.test(requestUrl);

            // Let login/register pages show their own error messages — do not reload.
            if (onLoginPage || isPublicAuthRequest) {
                return Promise.reject(error);
            }

            // Clear auth state and all user-scoped client caches
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

