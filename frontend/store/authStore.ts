'use client';

import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {resetSession} from '@/lib/resetSession';
import type {User} from '@/types/user';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    clearAuth: () => void;
    updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => {
                resetSession();
                localStorage.setItem('auth_token', token);
                set({user, token, isAuthenticated: true});
            },

            clearAuth: () => {
                localStorage.removeItem('auth_token');
                set({user: null, token: null, isAuthenticated: false});
                resetSession();
            },

            updateUser: (partialUser) =>
                set((state) => ({
                    user: state.user ? {...state.user, ...partialUser} : null,
                })),
        }),
        {
            name: 'MatriConnect-auth',
            partialize: (state) => ({user: state.user, token: state.token, isAuthenticated: state.isAuthenticated}),
        }
    )
);

