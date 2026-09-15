'use client';

import {useState, useRef, useEffect, useCallback} from 'react';
import {cn} from '@/lib/utils';
import type {Message, MediaItem} from '@/types/message';

// ── Resolve file URLs ─────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    return `${API_URL}/storage/${path.replace(/^\//, '')}`;
}

interface MessageBubbleProps {
    message: Message;
    isMine: boolean;
    senderName?: string;
    showAvatar?: boolean;
    onMediaLoad?: () => void;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

function formatSize(bytes: number | null | undefined): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({status}: { status: Message['status'] }) {
    if (!status) return null;
    if (status === 'sending') return (
        <svg className="w-3 h-3 text-gray-300 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70"/>
        </svg>
    );
    if (status === 'sent') return (
        <svg className="w-3.5 h-3.5 text-[#4A3F2E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );
    if (status === 'delivered') return (
        <svg className="w-4 h-3.5 text-[#4A3F2E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 6 7 16 3 12"/>
            <polyline points="22 6 13 15"/>
        </svg>
    );
    // read
    return (
        <svg className="w-4 h-3.5 text-[#1A1208]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="17 6 7 16 3 12"/>
            <polyline points="22 6 13 15"/>
        </svg>
    );
}

// ── Fancy Lightbox ────────────────────────────────────────────────────────
interface LightboxProps {
    images: { src: string; name?: string | null }[];
    startIndex: number;
    onClose: () => void;
}

function Lightbox({images, startIndex, onClose}: LightboxProps) {
    const [idx, setIdx] = useState(startIndex);

    const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            else if (e.key === 'ArrowRight') next();
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [prev, next, onClose]);

    return (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center" onClick={onClose}>
            <button onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white z-10 transition-colors"
                    aria-label="Close">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            {images.length > 1 && (
                <div
                    className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full z-10">
                    {idx + 1} / {images.length}
                </div>
            )}
            <div className="flex items-center justify-center w-full h-full px-16" onClick={(e) => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={images[idx].src} alt={images[idx].name ?? 'Image'}
                     className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                     draggable={false}/>
            </div>
            {images[idx].name && (
                <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/40 px-3 py-1 rounded-full truncate max-w-xs">
                    {images[idx].name}
                </p>
            )}
            {images.length > 1 && (
                <>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        prev();
                    }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        next();
                    }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition-colors">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 overflow-x-auto max-w-sm p-1">
                        {images.map((img, i) => (
                            <button key={i} onClick={(e) => {
                                e.stopPropagation();
                                setIdx(i);
                            }}
                                    className={cn('w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all', i === idx ? 'border-[#FFCF00]' : 'border-white/20 opacity-60 hover:opacity-100')}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.src} alt="" className="w-full h-full object-cover"/>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Image Grid ────────────────────────────────────────────────────────────
function ImageGrid({items, isMine, onMediaLoad}: { items: { src: string; name?: string | null }[]; isMine: boolean; onMediaLoad?: () => void }) {
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
    const count = items.length;


    let grid: React.ReactNode;

    if (count === 1) {
        grid = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={items[0].src}
                alt={items[0].name ?? 'Image'}
                onClick={() => setLightboxIdx(0)}
                onLoad={onMediaLoad}
                className={cn('rounded-xl max-w-full max-h-72 object-cover cursor-zoom-in', isMine ? 'border-2 border-white/20' : '')}
                draggable={false}
            />
        );
    } else if (count === 2) {
        grid = (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{maxWidth: 280}}>
                {[0, 1].map((i) => <div key={i} className="aspect-square overflow-hidden cursor-zoom-in"
                                        onClick={() => setLightboxIdx(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={items[i].src} alt="" className="w-full h-full object-cover" draggable={false} onLoad={onMediaLoad}/>
                </div>)}
            </div>
        );
    } else if (count === 3) {
        grid = (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{maxWidth: 280}}>
                <div className="overflow-hidden cursor-zoom-in row-span-2" onClick={() => setLightboxIdx(0)}
                     style={{height: 196}}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={items[0].src} alt="" className="w-full h-full object-cover" draggable={false} onLoad={onMediaLoad}/>
                </div>
                {[1, 2].map((i) => <div key={i} className="overflow-hidden cursor-zoom-in" style={{height: 96}}
                                        onClick={() => setLightboxIdx(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={items[i].src} alt="" className="w-full h-full object-cover" draggable={false} onLoad={onMediaLoad}/>
                </div>)}
            </div>
        );
    } else {
        // 4+: show first 4 in 2×2 grid, last cell shows +extra overlay
        const extra = count - 4;
        grid = (
            <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{maxWidth: 280}}>
                {[0, 1, 2, 3].map((i) => {
                    const isLast = i === 3 && extra > 0;
                    return (
                        <div key={i} className="relative overflow-hidden cursor-zoom-in" style={{height: 96}}
                             onClick={() => setLightboxIdx(i)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={items[i].src} alt="" className="w-full h-full object-cover" draggable={false} onLoad={onMediaLoad}/>
                            {isLast && (
                                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">+{extra}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            {grid}
            {lightboxIdx !== null && (
                <Lightbox images={items} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)}/>
            )}
        </>
    );
}

/** Inline audio player */
function AudioPlayer({src, isMine}: { src: string; isMine: boolean }) {
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const toggle = () => {
        const el = audioRef.current;
        if (!el) return;
        if (playing) {
            el.pause();
            setPlaying(false);
        } else {
            el.play();
            setPlaying(true);
        }
    };

    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    return (
        <div className="flex items-center gap-2 min-w-[180px]">
            <audio ref={audioRef} src={src} onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
                   onDurationChange={(e) => setDuration(e.currentTarget.duration)} onEnded={() => {
                setPlaying(false);
                setProgress(0);
            }}/>
            <button onClick={toggle}
                    className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors', isMine ? 'bg-white/20 hover:bg-white/30' : 'bg-[#FFCF00]/10 hover:bg-[#FFCF00]/20')}>
                {playing ? (
                    <svg className={cn('w-4 h-4', isMine ? 'text-[#1A1208]' : 'text-[#1A1208]')} fill="currentColor"
                         viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"/>
                    </svg>
                ) : (
                    <svg className={cn('w-4 h-4', isMine ? 'text-[#1A1208]' : 'text-[#1A1208]')} fill="currentColor"
                         viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                              clipRule="evenodd"/>
                    </svg>
                )}
            </button>
            <div className="flex-1">
                <div className={cn('h-1 rounded-full overflow-hidden', isMine ? 'bg-white/20' : 'bg-gray-200')}
                     onClick={(e) => {
                         const el = audioRef.current;
                         if (!el || !duration) return;
                         const r = e.currentTarget.getBoundingClientRect();
                         el.currentTime = ((e.clientX - r.left) / r.width) * duration;
                     }} style={{cursor: 'pointer'}}>
                    <div className={cn('h-full rounded-full transition-all', isMine ? 'bg-white' : 'bg-[#FFCF00]')}
                         style={{width: duration ? `${(progress / duration) * 100}%` : '0%'}}/>
                </div>
                <span
                    className={cn('text-[10px] mt-0.5 block', isMine ? 'text-meta' : 'text-meta')}>{fmt(progress)} / {duration ? fmt(duration) : '0:00'}</span>
            </div>
        </div>
    );
}

function VideoMessage({src}: { src: string }) {
    return <video src={src} controls preload="metadata" className="rounded-xl max-w-full max-h-60 object-cover"/>;
}

function DocumentMessage({src, name, size, mime, isMine}: {
    src: string;
    name: string | null | undefined;
    size: number | null | undefined;
    mime: string | null | undefined;
    isMine: boolean
}) {
    if (mime?.startsWith('video/')) return <VideoMessage src={src}/>;
    if (mime?.startsWith('audio/')) return <AudioPlayer src={src} isMine={isMine}/>;
    const ext = (name?.split('.').pop() ?? 'file').toUpperCase();
    return (
        <a href={src} target="_blank" rel="noopener noreferrer" download={name ?? 'file'}
           className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 min-w-[180px] transition-colors', isMine ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-50 hover:bg-gray-100')}>
            <div
                className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0', isMine ? 'bg-[#1A1208]/15 text-[#1A1208]' : 'bg-[#FFCF00]/10 text-[#1A1208]')}>{ext.slice(0, 3)}</div>
            <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-semibold truncate', isMine ? 'text-[#1A1208]' : 'text-[#1F2937]')}>{name ?? 'Document'}</p>
                {size &&
                    <p className={cn('text-[10px]', isMine ? 'text-meta' : 'text-meta')}>{formatSize(size)}</p>}
            </div>
            <svg className={cn('w-4 h-4 flex-shrink-0', isMine ? 'text-meta' : 'text-[#4A3F2E]')} fill="none"
                 stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
        </a>
    );
}

// ── Main export ───────────────────────────────────────────────────────────

export function MessageBubble({message, isMine, senderName, showAvatar = true, onMediaLoad}: MessageBubbleProps) {
    if (message.is_deleted) {
        return (
            <div className={cn('flex items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
                {showAvatar && !isMine && <div
                    className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-[#4A3F2E] flex-shrink-0 profile-photo-border">{senderName?.charAt(0).toUpperCase() ?? '?'}</div>}
                <div className="italic text-xs text-[#4A3F2E] px-3 py-2">This message was deleted</div>
            </div>
        );
    }

    // Resolve media items (multiple uploads or legacy single file)
    const mediaItems: MediaItem[] = message.media_items && message.media_items.length > 0
        ? message.media_items
        : message.file_path
            ? [{
                file_path: message.file_path,
                file_name: message.file_name,
                file_size: message.file_size,
                file_mime_type: message.file_mime_type,
                sort_order: 0
            }]
            : [];

    const isMedia = message.type !== 'text';
    const hasImages = message.type === 'image' && mediaItems.length > 0;
    const hasVideo = message.type === 'video';
    const hasDocs = message.type === 'document' && mediaItems.length > 0;

    const imageList = hasImages
        ? mediaItems.map((m) => ({
            src: (m.preview_url && m.preview_url.startsWith('blob:')) ? m.preview_url : (resolveUrl(m.file_path) ?? ''),
            name: m.file_name
        }))
        : [];

    const docList = hasDocs
        ? mediaItems.map((m) => ({
            src: (m.preview_url && m.preview_url.startsWith('blob:')) ? m.preview_url : (resolveUrl(m.file_path) ?? ''),
            name: m.file_name,
            size: m.file_size,
            mime: m.file_mime_type
        }))
        : [];

    const label = message.label;

    return (
        <div className={cn('flex items-end gap-2 group', isMine ? 'flex-row-reverse' : 'flex-row')}>
            {showAvatar && !isMine ? (
                <div
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center text-xs font-bold text-[#1A1208] flex-shrink-0 self-end profile-photo-border">
                    {senderName?.charAt(0).toUpperCase() ?? '?'}
                </div>
            ) : (!isMine && <div className="w-7 flex-shrink-0"/>)}

            <div
                className={cn('max-w-[72%] md:max-w-[60%] rounded-2xl shadow-sm', isMedia ? 'overflow-hidden' : 'px-4 py-2.5', isMine ? 'bg-[#FFCF00] text-[#1A1208] rounded-br-sm' : 'bg-white border border-gray-100 text-[#1F2937] rounded-bl-sm')}>
                {/* Reply preview */}
                {message.reply_to && (
                    <div
                        className={cn('text-xs px-3 pt-2.5 pb-1.5 border-l-2 mb-1 rounded-t', isMine ? 'border-white/40 bg-black/10' : 'border-[#FFCF00] bg-gray-50')}>
                        <span className={cn('font-semibold', isMine ? 'text-meta' : 'text-[#1A1208]')}>Reply</span>
                        <p className={cn('truncate', isMine ? 'text-meta' : 'text-meta')}>{message.reply_to.body ?? '[media]'}</p>
                    </div>
                )}

                <div className={isMedia ? 'p-0' : undefined}>
                    {/* Text */}
                    {message.type === 'text' &&
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>}

                    {/* Image grid */}
                    {hasImages && imageList.length > 0 &&
                        <div className="p-1"><ImageGrid items={imageList} isMine={isMine} onMediaLoad={onMediaLoad}/></div>}

                    {/* Video */}
                    {hasVideo && message.file_path &&
                        <div className="p-1"><VideoMessage src={resolveUrl(message.file_path)!}/></div>}

                    {/* Voice / Audio */}
                    {(message.type === 'voice' || message.type === 'audio') && message.file_path && (
                        <div className="px-3 py-2.5"><AudioPlayer src={resolveUrl(message.file_path)!} isMine={isMine}/>
                        </div>
                    )}

                    {/* Documents */}
                    {hasDocs && docList.length > 0 && (
                        <div className="px-3 py-2.5 flex flex-col gap-2">
                            {docList.map((d, i) => <DocumentMessage key={i} src={d.src} name={d.name} size={d.size}
                                                                    mime={d.mime} isMine={isMine}/>)}
                        </div>
                    )}

                    {/* Label / caption */}
                    {label && <div
                        className={cn('px-3 pb-1.5 pt-1 text-xs', isMine ? 'text-[#1A1208]' : 'text-[#1F2937]')}>{label}</div>}

                    {/* Body alongside media */}
                    {message.body && message.type !== 'text' && (
                        <div
                            className={cn('px-3 pb-1 text-sm leading-relaxed whitespace-pre-wrap break-words', isMine ? 'text-[#1A1208]' : 'text-[#1F2937]')}>{message.body}</div>
                    )}
                </div>

                {/* Timestamp + status */}
                <div
                    className={cn('flex items-center justify-end gap-1 mt-1', isMedia ? 'px-3 pb-2' : '', isMine ? 'text-meta' : 'text-[#4A3F2E]')}>
                    <span className="text-[10px]">{formatTime(message.created_at)}</span>
                    {isMine && <span className="text-[10px]"><StatusIcon status={message.status}/></span>}
                </div>
            </div>
        </div>
    );
}
