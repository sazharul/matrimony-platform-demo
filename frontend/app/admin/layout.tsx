'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { href: '/admin/dashboard',        label: 'Dashboard',       icon: '📊' },
    { href: '/admin/users',            label: 'Users',           icon: '👥' },
    { href: '/admin/photos',           label: 'Photo Moderation',icon: '🖼️' },
    { href: '/admin/reports',          label: 'Reports',         icon: '🚩' },
    { href: '/admin/select-options',   label: 'Select Options',  icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, clearAuth } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted) return;
        if (!isAuthenticated) {
            router.replace('/login');
        } else if (user?.role !== 'admin') {
            router.replace('/dashboard');
        }
    }, [mounted, isAuthenticated, user, router]);

    const handleLogout = () => {
        clearAuth();
        router.push('/login');
    };

    if (!mounted || !isAuthenticated || user?.role !== 'admin') return null;

    return (
        <div className="flex min-h-screen bg-[#F8F9FB]">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-60 border-r border-gray-200 bg-white px-3 py-6 fixed h-full z-10">
                {/* Logo */}
                <div className="mb-8 px-2">
                    <h1 className="text-xl font-bold text-[#1A1208]">Admin Panel</h1>
                    <p className="text-[10px] text-[#4A3F2E] tracking-widest uppercase mt-0.5">MatriConnect Matrimony</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const active = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                    active
                                        ? 'bg-amber-50 text-amber-700 border-l-2 border-amber-500 pl-2.5'
                                        : 'text-[#3D3220] hover:bg-gray-100 hover:text-gray-900'
                                )}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / logout */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-meta hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors mb-1"
                    >
                        ← User Dashboard
                    </Link>
                    <div className="px-3 py-2 text-xs text-[#4A3F2E] truncate">{user?.email}</div>
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 md:ml-60 min-w-0">
                {/* Mobile top bar */}
                <div className="md:hidden border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
                    <span className="font-bold text-amber-600">Admin Panel</span>
                    <div className="flex gap-3 text-sm overflow-x-auto">
                        {NAV_ITEMS.map(item => (
                            <Link key={item.href} href={item.href}
                                className={cn('whitespace-nowrap', pathname === item.href ? 'text-amber-600 font-semibold' : 'text-meta')}>
                                {item.icon}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="p-4 lg:p-6">{children}</div>
            </main>
        </div>
    );
}

