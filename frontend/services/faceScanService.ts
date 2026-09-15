import api from '@/lib/api';
import type { ApiResponse } from '@/types/user';


export interface FaceScanCaptureUpload {
  capture: File;
  capture_key: string;
  capture_type?: string;
  has_glasses?: boolean;
  expression?: string;
  confidence?: number;
  face_turn?: string;
}

export interface FaceScanSessionResponse {
  id: number;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  completed_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  review_history?: Array<{
    decision: string;
    reason: string;
    reviewed_by: number;
    reviewed_at: string;
  }> | null;
  captures: Array<{
    id: number;
    capture_key: string;
    image_path: string;
    metadata: Record<string, unknown> | null;
    captured_at: string | null;
  }>;
  latest_capture: {
    id: number;
    capture_key: string;
    image_path: string;
    metadata: Record<string, unknown> | null;
    captured_at: string | null;
  } | null;
}

export const faceScanService = {
  getStatus: () => api.get<ApiResponse<{ face_scan_required: boolean; session: FaceScanSessionResponse | null }>>('/auth/face-scan/status'),
  uploadCapture: (data: FaceScanCaptureUpload) => {
    const formData = new FormData();
    // Append file with an explicit name so PHP $_FILES receives it as a valid upload
    formData.append('capture', data.capture, data.capture.name || 'capture.jpg');
    formData.append('capture_key', data.capture_key);

    if (data.capture_type) formData.append('capture_type', data.capture_type);
    if (typeof data.has_glasses === 'boolean') formData.append('has_glasses', data.has_glasses ? '1' : '0');
    if (data.expression) formData.append('expression', data.expression);
    if (typeof data.confidence === 'number') formData.append('confidence', String(data.confidence));
    if (data.face_turn) formData.append('face_turn', data.face_turn);

    // postForm() sets Content-Type: multipart/form-data with the correct boundary,
    // overriding the global application/json default that was causing the 422.
    return api.postForm<ApiResponse<{ session: FaceScanSessionResponse; required_capture_keys: string[] }>>(
      '/auth/face-scan/captures',
      formData,
    );
  },
};

