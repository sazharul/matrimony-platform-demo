'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import type { AdminPhoto } from '@/types/admin';
import { resolveProfilePhotoUrl } from '@/lib/utils';
import { InfiniteScrollFooter } from '@/components/ui/InfiniteScrollFooter';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { normalizeFlatPage } from '@/lib/pagination';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function AdminPhotosPage() {
    const queryClient = useQueryClient();
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const {
        items: photos,
        total,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useInfiniteList<AdminPhoto>({
        queryKey: ['admin-photos'],
        queryFn: (page) =>
            adminService.getPendingPhotos(page).then((r) => normalizeFlatPage(r.data.data, page)),
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => adminService.approvePhoto(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-photos'] }),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
            adminService.rejectPhoto(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-photos'] });
            setRejectId(null);
            setRejectReason('');
        },
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Photo Moderation</h1>
                <p className="text-sm text-meta mt-0.5">
                    Review and approve or reject pending profile photos
                    {total > 0 && ` — ${total} pending`}
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                            <div className="aspect-square bg-gray-100"/>
                            <div className="p-3 space-y-2">
                                <div className="h-3 bg-gray-100 rounded"/>
                                <div className="h-3 bg-gray-100 rounded w-2/3"/>
                            </div>
                        </div>
                    ))}
                </div>
            ) : photos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-[#3D3220] font-semibold">All caught up!</p>
                    <p className="text-sm text-[#4A3F2E] mt-1">No photos pending moderation</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="aspect-square overflow-hidden bg-gray-50">
                                    <img
                                        src={resolveProfilePhotoUrl(photo) ?? ''}
                                        alt="Pending photo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-900 truncate">{photo.user?.name}</p>
                                    {photo.user?.profile?.profile_id && (
                                        <p className="text-xs text-[#4A3F2E]">{photo.user.profile.profile_id}</p>
                                    )}
                                    <p className="text-xs text-[#4A3F2E] mt-0.5">
                                        {new Date(photo.created_at).toLocaleDateString()}
                                        {photo.is_primary && <span className="ml-1 text-amber-600">★ Primary</span>}
                                    </p>

                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => approveMutation.mutate(photo.id)}
                                            disabled={approveMutation.isPending}
                                            className="flex-1 py-1.5 text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectId(photo.id)}
                                            className="flex-1 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            ✕ Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <InfiniteScrollFooter
                        hasNextPage={!!hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={() => fetchNextPage()}
                        showEndMessage={photos.length > 0}
                        endMessage="No more photos to review"
                    />
                </>
            )}

            {rejectId !== null && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-semibold text-gray-900 mb-3">Reject Photo</h3>
                        <p className="text-sm text-meta mb-3">Optionally provide a reason for rejection:</p>
                        <Textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="e.g. Inappropriate content, not a clear face photo…"
                            rows={3}
                            className="border-gray-200 mb-4"
                        />
                        <div className="flex gap-3">
                            <Button
                                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason || undefined })}
                                disabled={rejectMutation.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {rejectMutation.isPending ? 'Rejecting…' : 'Reject Photo'}
                            </Button>
                            <Button variant="ghost" onClick={() => { setRejectId(null); setRejectReason(''); }}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
