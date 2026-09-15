'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { AdminReport } from '@/types/admin';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeFlatPage } from '@/lib/pagination';

const REASON_LABELS: Record<string, string> = {
    fake_profile: 'Fake Profile',
    inappropriate_photo: 'Inappropriate Photo',
    abusive: 'Abusive Behaviour',
    spam: 'Spam',
    other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
    pending:      'bg-amber-100 text-amber-700',
    reviewed:     'bg-blue-100 text-blue-700',
    action_taken: 'bg-green-100 text-green-700',
    dismissed:    'bg-gray-100 text-meta',
};

export default function AdminReportsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('');

    const {
        items: reports,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<AdminReport>({
        queryKey: ['admin-reports', statusFilter],
        queryFn: (page) =>
            adminService.getReports({ status: statusFilter || undefined, page }).then((r) => normalizeFlatPage(r.data.data, page)),
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            adminService.takeReportAction(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] }),
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-meta mt-0.5">
                    Review and take action on user reports{total > 0 ? ` · ${total} total` : ''}
                </p>
            </div>

            <div className="flex gap-2 flex-wrap">
                {['', 'pending', 'reviewed', 'action_taken', 'dismissed'].map(s => (
                    <button
                        key={s || 'all'}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                            statusFilter === s
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'border-gray-200 text-[#3D3220] hover:bg-gray-100'
                        }`}
                    >
                        {s === '' ? 'All' : s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-[#4A3F2E]">Loading…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Reporter</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Reported User</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Reason</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Description</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Date</th>
                                    <th className="text-left px-4 py-3 font-medium text-[#3D3220]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{report.reporter?.name ?? 'Unknown'}</div>
                                            {report.reporter?.profile?.profile_id && (
                                                <div className="text-xs text-[#4A3F2E]">{report.reporter.profile.profile_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-gray-900 font-medium">{report.reported?.name ?? 'Unknown'}</div>
                                            {report.reported?.profile?.profile_id && (
                                                <div className="text-xs text-[#4A3F2E]">{report.reported.profile.profile_id}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                                {REASON_LABELS[report.reason] ?? report.reason}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-meta max-w-xs truncate">
                                            {report.description ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] ?? ''}`}>
                                                {report.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#4A3F2E] text-xs">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {report.status === 'pending' && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'reviewed' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                                    >
                                                        Review
                                                    </button>
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'action_taken' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                                    >
                                                        Action
                                                    </button>
                                                    <button
                                                        onClick={() => actionMutation.mutate({ id: report.id, status: 'dismissed' })}
                                                        disabled={actionMutation.isPending}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-50 text-[#3D3220] hover:bg-gray-100 transition-colors"
                                                    >
                                                        Dismiss
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-[#4A3F2E]">
                                            No reports found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && reports.length > 0 && (
                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage
                        endMessage="No more reports"
                        className="border-t border-gray-100"
                    />
                )}
            </div>
        </div>
    );
}
