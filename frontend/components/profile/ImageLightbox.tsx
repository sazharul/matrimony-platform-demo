'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { GalleryImage } from '@/lib/profilePhotos';

interface ImageLightboxProps {
    images: GalleryImage[];
    startIndex: number;
    onClose: () => void;
}

export function ImageLightbox({ images, startIndex, onClose }: ImageLightboxProps) {
    const [index, setIndex] = useState(startIndex);
    const current = images[index];

    const showPrevious = useCallback(
        () => setIndex((i) => (i - 1 + images.length) % images.length),
        [images.length],
    );
    const showNext = useCallback(
        () => setIndex((i) => (i + 1) % images.length),
        [images.length],
    );

    useEffect(() => {
        setIndex(startIndex);
    }, [startIndex]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') showPrevious();
            else if (event.key === 'ArrowRight') showNext();
            else if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showPrevious, showNext, onClose]);

    if (!current) return null;

    return (
        <div
            className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white z-10 transition-colors"
                aria-label="Close preview"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full z-10">
                    {index + 1} / {images.length}
                </div>
            )}

            <div className="flex items-center justify-center w-full h-full px-16" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={current.src}
                    alt={current.alt}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                    draggable={false}
                />
            </div>

            {images.length > 1 && (
                <>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); showPrevious(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="Previous image"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); showNext(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors"
                        aria-label="Next image"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-sm p-1">
                        {images.map((image, i) => (
                            <button
                                key={`${image.src}-${i}`}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                                className={cn(
                                    'w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                                    i === index ? 'border-[#FFCF00]' : 'border-white/20 opacity-60 hover:opacity-100',
                                )}
                                aria-label={`View image ${i + 1}`}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image.src} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
