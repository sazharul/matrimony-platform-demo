'use client';

import {useMemo} from 'react';
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {adminService} from '@/services/adminService';
import type {AdminUserDetail} from '@/types/admin';
import { cfImageUrl } from '@/lib/utils';

function Badge({children, className}: {children: React.ReactNode; className: string}) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>;
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const id = Number(params.id);

  const {data, isLoading, isError} = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminService.getUser(id).then((r) => r.data),
    enabled: Number.isFinite(id),
  });

  const detail: AdminUserDetail | null = useMemo(() => (data?.data as AdminUserDetail) ?? null, [data]);

  const banMutation = useMutation({
    mutationFn: (is_banned: boolean) => adminService.banUser(id, is_banned),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['admin-user', id]}),
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: 'approved' | 'rejected' | 'ban') => adminService.reviewFaceScan(id, {decision}),
    onSuccess: () => queryClient.invalidateQueries({queryKey: ['admin-user', id]}),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-meta">Loading user details…</div>;
  }

  if (isError || !detail?.user) {
    return <div className="p-8 text-center text-red-500">Unable to load user details.</div>;
  }

  const {user, face_scan} = detail;
  const faceApproved = face_scan?.status === 'approved';
  const faceRejected = face_scan?.status === 'rejected';
  const facePending = !face_scan || face_scan.status === 'pending' || face_scan.status === 'submitted';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/admin/users" className="text-sm text-meta hover:text-gray-700">← Back to users</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{user.name}</h1>
          <p className="text-sm text-meta">Full review view for user and face captures</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => banMutation.mutate(!user.is_banned)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${user.is_banned ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            {user.is_banned ? 'Unban User' : 'Ban User'}
          </button>
          <button
            onClick={() => reviewMutation.mutate('approved')}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700"
            disabled={faceApproved}
          >
            Approve Face
          </button>
          <button
            onClick={() => reviewMutation.mutate('rejected')}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-700"
            disabled={faceRejected}
          >
            Reject Face
          </button>
          <button
            onClick={() => reviewMutation.mutate('ban')}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-800"
          >
            Ban from Face Review
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className={user.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{user.is_banned ? 'Banned' : 'Active'}</Badge>
              <Badge className={facePending ? 'bg-amber-100 text-amber-700' : faceApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {face_scan ? face_scan.status : 'No Face Scan'}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-meta">Email:</span> <span className="font-medium">{user.email}</span></div>
              <div><span className="text-meta">Gender:</span> <span className="font-medium capitalize">{user.gender}</span></div>
              <div><span className="text-meta">Profile ID:</span> <span className="font-medium">{user.profile?.profile_id ?? '—'}</span></div>
              <div><span className="text-meta">Plan:</span> <span className="font-medium capitalize">{user.subscription_plan}</span></div>
              <div><span className="text-meta">Email verified:</span> <span className="font-medium">{user.email_verified_at ?? 'No'}</span></div>
              <div><span className="text-meta">Joined:</span> <span className="font-medium">{user.created_at}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Face scan captures</h2>
            {face_scan?.captures?.length ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {face_scan.captures.map((capture) => (
                  <div key={capture.id} className="rounded-2xl border border-gray-100 overflow-hidden">
                    <img src={cfImageUrl(capture.image_path) ?? ''} alt={capture.capture_key} className="w-full aspect-3/4 object-cover" />
                    <div className="p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium capitalize">{capture.capture_key.replace('-', ' ')}</span>
                        <span className="text-[#4A3F2E] text-xs">{capture.captured_at ?? ''}</span>
                      </div>
                      <pre className="text-[11px] text-meta whitespace-pre-wrap wrap-break-word">{JSON.stringify(capture.metadata ?? {}, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-meta">No face captures available.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Face review summary</h2>
            <div className="space-y-2 text-sm text-[#3D3220]">
              <div><span className="text-meta">Status:</span> {face_scan?.status ?? 'Not started'}</div>
              <div><span className="text-meta">Completed:</span> {face_scan?.completed_at ?? '—'}</div>
              <div><span className="text-meta">Reviewed:</span> {face_scan?.reviewed_at ?? '—'}</div>
              <div><span className="text-meta">Reviewer:</span> {face_scan?.reviewed_by ?? '—'}</div>
            </div>
            {face_scan?.review_note && <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm text-gray-700">{face_scan.review_note}</div>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">Relations</h2>
            <pre className="text-[11px] text-[#3D3220] whitespace-pre-wrap wrap-break-word">{JSON.stringify({
              profile: user.profile,
              religious_detail: user.religious_detail,
              family_detail: user.family_detail,
              education_career: user.education_career,
              lifestyle: user.lifestyle,
              horoscope_detail: user.horoscope_detail,
              partner_preference: user.partner_preference,
              photos_count: user.photos?.length ?? 0,
            }, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

