'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { toGalleryImages } from '@/lib/profilePhotos';
import { ImageLightbox } from '@/components/profile/ImageLightbox';
import { UserIcon } from '@/components/ui/icons';
import type { ProfilePhoto } from '@/types/profile';

interface ProfilePhotoGalleryProps {
    photos: ProfilePhoto[] | null | undefined;
    subjectName: string;
    className?: string;
}

export function ProfilePhotoGallery({ photos, subjectName, className }: ProfilePhotoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const galleryImages = useMemo(() => toGalleryImages(photos, subjectName), [photos, subjectName]);

    if (galleryImages.length === 0) {
        return (
            <div className={cn('rounded-2xl border border-[#e8d59a]/60 bg-white/80 p-12 text-center', className)}>
                <div className="w-20 h-20 rounded-full bg-[#FFCF00]/10 flex items-center justify-center mx-auto mb-4 profile-photo-border">
                    <UserIcon size={40} className="text-[#5C4F3A]" strokeWidth={1.2} />
                </div>
                <p className="text-meta text-sm" style={{ fontFamily: 'system-ui, sans-serif' }}>
                    No photos available yet.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3', className)}>
                {galleryImages.map((image, index) => (
                    <button
                        key={`${image.src}-${index}`}
                        type="button"
                        onClick={() => setLightboxIndex(index)}
                        className="group relative aspect-[3/4] rounded-xl overflow-hidden profile-photo-border bg-gray-100 shadow-sm hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFCF00]/50"
                        aria-label={`Open ${image.alt}`}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={image.src}
                            alt={image.alt}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <span className="absolute bottom-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            View
                        </span>
                    </button>
                ))}
            </div>

            {lightboxIndex !== null && (
                <ImageLightbox
                    images={galleryImages}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
        </>
    );
}
