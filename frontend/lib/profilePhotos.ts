import { resolvePhotoUrl, resolveProfilePhotoUrl } from '@/lib/utils';
import type { ProfilePhoto } from '@/types/profile';

export interface GalleryImage {
    src: string;
    alt: string;
}

/** Approved, viewer-visible photos from the API payload. */
export function getApprovedPhotos(photos: ProfilePhoto[] | null | undefined): ProfilePhoto[] {
    return (photos ?? []).filter((photo) => photo.is_approved);
}

/** Primary photo from API, falling back to the first approved photo. */
export function getPrimaryPhoto(photos: ProfilePhoto[] | null | undefined): ProfilePhoto | null {
    const approved = getApprovedPhotos(photos);
    return approved.find((photo) => photo.is_primary) ?? approved[0] ?? null;
}

/** Resolve the hero image URL — prefers API `primary_photo`, then photo objects. */
export function resolvePrimaryPhotoUrl(
    primaryPhoto: string | null | undefined,
    photos: ProfilePhoto[] | null | undefined,
): string | null {
    return resolvePhotoUrl(primaryPhoto) ?? resolveProfilePhotoUrl(getPrimaryPhoto(photos));
}

/** Map approved photos to lightbox-ready gallery items. */
export function toGalleryImages(
    photos: ProfilePhoto[] | null | undefined,
    subjectName?: string,
): GalleryImage[] {
    return getApprovedPhotos(photos).flatMap((photo, index) => {
        const src = resolveProfilePhotoUrl(photo);
        if (!src) return [];

        return [{
            src,
            alt: subjectName ? `${subjectName} — Photo ${index + 1}` : `Photo ${index + 1}`,
        }];
    });
}
