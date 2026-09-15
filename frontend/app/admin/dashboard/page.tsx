'use client';

import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { AdminDashboardStats } from '@/types/admin';
import Link from 'next/link';

function StatCard({
    label, value, icon, href, color,
}: {
    label: string; value: number | string; icon: string; href: string; color: string;
}) {
    return (
        <Link href={href}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{icon}</span>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-meta mt-1">{label}</p>
            </div>
        </Link>
    );
}

export default function AdminDashboardPage() {
    const { data: res, isLoading } = useQuery({
        queryKey: ['admin-dashboard'],
        queryFn: () => adminService.getDashboardStats().then(r => r.data),
    });

    const stats: AdminDashboardStats | null = res?.data ?? null;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28"/>
                    ))}
                </div>
            </div>
        );
    }

    const cards = [
        { label: 'Total Users',          value: stats?.total_users ?? 0,          icon: '👥', href: '/admin/users',  color: 'text-blue-600' },
        { label: 'Active Today',          value: stats?.active_today ?? 0,          icon: '🟢', href: '/admin/users',  color: 'text-green-600' },
        { label: 'New Today',             value: stats?.new_users_today ?? 0,       icon: '✨', href: '/admin/users',  color: 'text-purple-600' },
        { label: 'Verified Users',        value: stats?.verified_users ?? 0,        icon: '✅', href: '/admin/users',  color: 'text-emerald-600' },
        { label: 'Pending Photos',        value: stats?.pending_photos ?? 0,        icon: '🖼️', href: '/admin/photos', color: 'text-amber-600' },
        { label: 'Pending Reports',       value: stats?.pending_reports ?? 0,       icon: '🚩', href: '/admin/reports',color: 'text-red-600' },
        { label: 'Banned Users',          value: stats?.banned_users ?? 0,          icon: '🚫', href: '/admin/users',  color: 'text-red-500' },
        { label: 'Active Subscriptions',  value: stats?.active_subscriptions ?? 0,  icon: '👑', href: '/admin/users',  color: 'text-yellow-600' },
    ];

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-meta mt-0.5">Platform overview and statistics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cards.map(card => (
                    <StatCard key={card.label} {...card}/>
                ))}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    <Link href="/admin/photos"
                        className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
                        📷 Review Pending Photos ({stats?.pending_photos ?? 0})
                    </Link>
                    <Link href="/admin/reports"
                        className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                        🚩 Manage Reports ({stats?.pending_reports ?? 0})
                    </Link>
                    <Link href="/admin/select-options"
                        className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
                        ⚙️ Manage Select Options
                    </Link>
                    <Link href="/admin/users"
                        className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                        👥 Manage Users
                    </Link>
                </div>
            </div>
        </div>
    );
}

