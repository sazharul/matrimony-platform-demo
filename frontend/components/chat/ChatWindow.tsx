'use client';

import {useState, useRef, useEffect, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {MessageBubble} from './MessageBubble';
import {CallLogBubble} from './CallLogBubble';
import {TypingIndicator} from './TypingIndicator';
import {chatService} from '@/services/chatService';
import {callService} from '@/services/callService';
import {CallButton} from '@/components/call/CallButton';
import type {Conversation, Message, MessageType, MediaItem} from '@/types/message';
import type {CallLog, CallParticipant} from '@/types/call';
import {cfImageUrl} from '@/lib/utils';
import {showErrorToast, getErrorMessage} from '@/lib/toast';
import {queryClient} from '@/lib/queryClient';
import {invalidateMessageUnreadQueries} from '@/lib/cacheInvalidation';

interface ChatWindowProps {
    conversationId: number;
    currentUserId: number;
}

const ACCEPT_IMAGE = 'image/jpeg,image/png,image/gif,image/webp';
const ACCEPT_FILE = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_IMAGES = 10;
const MAX_FILES = 2;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const DOC_EXTENSIONS = new Set(['pdf', 'doc', 'docx']);
const DOC_MIMES = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function isAllowedDoc(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return DOC_EXTENSIONS.has(ext) || DOC_MIMES.has(file.type);
}

function isMediaMessageType(type: MessageType): boolean {
    return type === 'image' || type === 'document' || type === 'video';
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatWindow({conversationId, currentUserId}: ChatWindowProps) {
    const router = useRouter();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [callLogs, setCallLogs] = useState<CallLog[]>([]);
    const [text, setText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [paginationEnabled, setPaginationEnabled] = useState(false);

    // ── Multi-media pending state ─────────────────────────────────────────
    type PendingKind = 'images' | 'docs' | null;
    const [pendingKind, setPendingKind] = useState<PendingKind>(null);
    const [pendingImages, setPendingImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [pendingDocs, setPendingDocs] = useState<File[]>([]);
    const [mediaLabel, setMediaLabel] = useState('');

    const hasPending = pendingKind !== null;

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentInnerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const imageRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialScrollDone = useRef(false);
    const isLoadingMoreRef = useRef(false);
    const stickToBottomUntilRef = useRef(0);
    const stickOnNextCallLogsRef = useRef(false);
    // Tracks blob URLs per optimistic message ID so we can revoke AFTER real message arrives
    const blobUrlsMap = useRef<Map<number, string[]>>(new Map());

    // ── clearPending — does NOT revoke blob URLs (caller manages that) ────
    const clearPendingState = useCallback(() => {
        setPendingKind(null);
        setPendingImages([]);
        setImagePreviews([]);
        setPendingDocs([]);
        setMediaLabel('');
    }, []);

    // For explicit cancel (user clicks Cancel), do revoke
    const clearPending = useCallback(() => {
        imagePreviews.forEach((u) => URL.revokeObjectURL(u));
        clearPendingState();
    }, [imagePreviews, clearPendingState]);

    // ── Initial load ──────────────────────────────────────────────────────
    useEffect(() => {
        let active = true;
        setMessages([]);
        setCallLogs([]);
        setHasMore(false);
        setPaginationEnabled(false);
        initialScrollDone.current = false;
        stickOnNextCallLogsRef.current = false;

        async function load() {
            setIsLoading(true);
            try {
                const conv = await chatService.getConversation(conversationId);
                if (!active) return;

                const [msgsResponse, callHistory] = await Promise.all([
                    chatService.getMessages(conversationId),
                    callService.getHistory(1, conv.participant.id).catch(() => ({data: [] as CallLog[]})),
                ]);
                if (!active) return;

                setConversation(conv);
                setMessages(msgsResponse.data);
                setHasMore(msgsResponse.pagination.has_more);
                setCallLogs(callHistory.data ?? []);

                await chatService.markAsRead(conversationId);
                invalidateMessageUnreadQueries(queryClient);
            } finally {
                if (active) setIsLoading(false);
            }
        }

        load();
        return () => {
            active = false;
        };
    }, [conversationId]);

    const scrollToBottom = useCallback((repeatForLayout = false) => {
        const doScroll = () => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
        };
        // Double RAF ensures the DOM has re-rendered before we measure + scroll
        requestAnimationFrame(() => {
            requestAnimationFrame(doScroll);
        });
        // Media messages change height as images load — retry until layout settles
        if (repeatForLayout) {
            [50, 150, 300, 500, 800, 1200].forEach((ms) => setTimeout(doScroll, ms));
        }
    }, []);

    const isNearBottom = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    }, []);

    const stickToBottomForLayout = useCallback(() => {
        stickToBottomUntilRef.current = Date.now() + 1500;
        scrollToBottom(true);
    }, [scrollToBottom]);

    // Keep pinned to bottom while media content grows (sender + receiver)
    useEffect(() => {
        const scrollEl = scrollRef.current;
        const contentEl = contentInnerRef.current;
        if (!scrollEl || !contentEl) return;

        let rafId = 0;
        const observer = new ResizeObserver(() => {
            if (Date.now() < stickToBottomUntilRef.current) {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    scrollEl.scrollTop = scrollEl.scrollHeight;
                });
            }
        });

        observer.observe(contentEl);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(rafId);
        };
    }, [conversationId]);

    // ── Scroll to bottom on first load ───────────────────────────────────
    useEffect(() => {
        if (!isLoading && !initialScrollDone.current) {
            initialScrollDone.current = true;
            stickToBottomUntilRef.current = Date.now() + 1500;
            scrollToBottom(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setPaginationEnabled(true));
            });
        }
    }, [isLoading, scrollToBottom]);

    // ── Scroll when call history updates (after a call ends) ─────────────
    useEffect(() => {
        if (!initialScrollDone.current || isLoading) return;
        if (!stickOnNextCallLogsRef.current) return;

        stickOnNextCallLogsRef.current = false;
        stickToBottomForLayout();
    }, [callLogs, isLoading, stickToBottomForLayout]);

    // ── Auto-scroll for new messages / call history ─────────────────────
    useEffect(() => {
        if (!initialScrollDone.current || isLoading) return;
        if (stickOnNextCallLogsRef.current) return;

        const forceStick = Date.now() < stickToBottomUntilRef.current;
        const lastMsg = messages[messages.length - 1];
        const ownSending = lastMsg?.sender_id === currentUserId && lastMsg?.status === 'sending';

        const latestCall = callLogs.reduce<CallLog | null>((acc, c) => {
            if (!acc || new Date(c.created_at) > new Date(acc.created_at)) return c;
            return acc;
        }, null);
        const latestMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
        const latestCallTime = latestCall ? new Date(latestCall.created_at).getTime() : 0;
        const lastIsCall = latestCallTime > latestMsgTime;
        const needsLayoutRetries = lastIsCall || (lastMsg ? isMediaMessageType(lastMsg.type) : false);

        // Stick to bottom after the user sends or while layout is settling
        if (forceStick || ownSending) {
            scrollToBottom(forceStick || needsLayoutRetries);
            return;
        }

        const el = scrollRef.current;
        if (!el) return;
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distFromBottom < 150) {
            if (needsLayoutRetries) stickToBottomUntilRef.current = Date.now() + 1500;
            scrollToBottom(needsLayoutRetries);
        }
    }, [messages, callLogs, isTyping, isLoading, scrollToBottom, currentUserId]);

    // ── Refresh call logs when a call ends (from CallScreen/CallProvider) ─
    useEffect(() => {
        if (!conversation) return;
        const participantId = conversation.participant.id;
        const handler = () => {
            if (isNearBottom()) stickOnNextCallLogsRef.current = true;
            callService.getHistory(1, participantId)
                .then((res) => setCallLogs(res.data ?? []))
                .catch(() => {
                    stickOnNextCallLogsRef.current = false;
                });
        };
        window.addEventListener('call:ended', handler);
        return () => window.removeEventListener('call:ended', handler);
    }, [conversation, isNearBottom]);

    // ── Real-time: subscribe to conversation channel ──────────────────────
    // Uses `cancelled` flag pattern — no race between echoRef + cleanup
    useEffect(() => {
        if (typeof window === 'undefined') return;
        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getPrivateChannel} = await import('@/lib/echo');
            channel = await getPrivateChannel(`conversation.${conversationId}`);
            if (cancelled || !channel) return;

            // Incoming messages
            channel.listen('.message.sent', (e: Message) => {
                if (cancelled) return;
                // Sender already has the message (optimistic) — skip own events
                if (e.sender_id === currentUserId) return;

                const nearBottom = isNearBottom();

                setMessages((prev) => {
                    if (prev.some((m) => m.id === e.id)) return prev;
                    return [...prev, e];
                });
                setIsTyping(false);

                if (nearBottom) {
                    if (isMediaMessageType(e.type)) {
                        stickToBottomForLayout();
                    } else {
                        scrollToBottom();
                    }
                }

                chatService.markAsRead(conversationId).catch(() => {
                });
                invalidateMessageUnreadQueries(queryClient);
            });

            // Typing indicator
            channel.listen('.user.typing', (e: { user_id: number; is_typing: boolean }) => {
                if (cancelled) return;
                if (e.user_id === currentUserId) return;
                setIsTyping(e.is_typing);
                if (e.is_typing) {
                    if (typingTimer.current) clearTimeout(typingTimer.current);
                    typingTimer.current = setTimeout(() => setIsTyping(false), 5000);
                } else {
                    if (typingTimer.current) clearTimeout(typingTimer.current);
                }
            });
        })();

        return () => {
            cancelled = true;
            if (typingTimer.current) clearTimeout(typingTimer.current);
            // Leave channel async
            (async () => {
                const {leavePrivateChannel} = await import('@/lib/echo');
                if (channel) {
                    channel.stopListening('.message.sent');
                    channel.stopListening('.user.typing');
                }
                leavePrivateChannel(`conversation.${conversationId}`);
            })();
        };
    }, [conversationId, currentUserId, scrollToBottom, isNearBottom, stickToBottomForLayout]);

    // ── Load more (pagination) ────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (isLoadingMoreRef.current || !hasMore || messages.length === 0) return;
        const oldestId = messages[0].id;
        const scrollEl = scrollRef.current;
        const prevScrollHeight = scrollEl?.scrollHeight ?? 0;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);
        try {
            const res = await chatService.getMessages(conversationId, oldestId);
            if (res.data.length === 0) {
                setHasMore(false);
                return;
            }
            setMessages((prev) => [...res.data, ...prev]);
            setHasMore(res.pagination.has_more);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight;
                });
            });
        } finally {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    }, [hasMore, messages, conversationId]);

    // Load older messages when scrolling to the top
    useEffect(() => {
        if (!paginationEnabled) return;

        const sentinel = topSentinelRef.current;
        const root = scrollRef.current;
        if (!sentinel || !root || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMore();
                }
            },
            {root, rootMargin: '120px', threshold: 0},
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadMore, paginationEnabled]);

    // ── File pick handlers ────────────────────────────────────────────────
    const handleImagesPick = useCallback((files: File[]) => {
        const allowed = files.filter((f) => f.type.startsWith('image/'));
        const tooLarge = allowed.filter((f) => f.size > MAX_FILE_SIZE);
        const valid = allowed.filter((f) => f.size <= MAX_FILE_SIZE);

        if (tooLarge.length > 0) {
            showErrorToast(`Each photo must be 2 MB or smaller. ${tooLarge.map((f) => f.name).join(', ')} exceeded the limit.`);
        }
        if (valid.length === 0) return;

        const remaining = MAX_IMAGES - pendingImages.length;
        const toAdd = valid.slice(0, remaining);
        const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
        setPendingKind('images');
        setPendingImages((prev) => [...prev, ...toAdd]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
    }, [pendingImages]);

    const removeImage = useCallback((idx: number) => {
        URL.revokeObjectURL(imagePreviews[idx]);
        const newImgs = pendingImages.filter((_, i) => i !== idx);
        const newPreviews = imagePreviews.filter((_, i) => i !== idx);
        setPendingImages(newImgs);
        setImagePreviews(newPreviews);
        if (newImgs.length === 0) {
            setPendingKind(null);
            setMediaLabel('');
        }
    }, [imagePreviews, pendingImages]);

    const handleDocsPick = useCallback((files: File[]) => {
        const rejected = files.filter((f) => !isAllowedDoc(f));
        const allowed = files.filter(isAllowedDoc);
        const tooLarge = allowed.filter((f) => f.size > MAX_FILE_SIZE);
        const valid = allowed.filter((f) => f.size <= MAX_FILE_SIZE);

        if (rejected.length > 0) {
            showErrorToast('Only PDF and Word documents (.pdf, .doc, .docx) are allowed.');
        }
        if (tooLarge.length > 0) {
            showErrorToast(`Each file must be 2 MB or smaller. ${tooLarge.map((f) => f.name).join(', ')} exceeded the limit.`);
        }

        const toAdd = valid.slice(0, MAX_FILES - pendingDocs.length);
        if (toAdd.length === 0) return;
        setPendingKind('docs');
        setPendingDocs((prev) => [...prev, ...toAdd]);
    }, [pendingDocs]);

    const removeDoc = useCallback((idx: number) => {
        const newDocs = pendingDocs.filter((_, i) => i !== idx);
        setPendingDocs(newDocs);
        if (newDocs.length === 0) {
            setPendingKind(null);
            setMediaLabel('');
        }
    }, [pendingDocs]);

    // ── Send ──────────────────────────────────────────────────────────────
    const handleSend = useCallback(async () => {
        const body = text.trim();
        const label = mediaLabel.trim() || undefined;
        if ((!body && !hasPending) || isSending) return;

        let type: MessageType = 'text';
        if (pendingKind === 'images') type = 'image';
        else if (pendingKind === 'docs') type = 'document';

        // Capture blob URLs BEFORE clearing state (they're still valid)
        const capturedImagePreviews = [...imagePreviews];

        // Build optimistic media items (blob URLs still valid at this point)
        const optimisticMediaItems: MediaItem[] = pendingKind === 'images'
            ? pendingImages.map((f, i) => ({
                file_path: capturedImagePreviews[i],
                preview_url: capturedImagePreviews[i],
                file_name: f.name,
                file_size: f.size,
                file_mime_type: f.type,
                sort_order: i,
            }))
            : pendingKind === 'docs'
                ? pendingDocs.map((f, i) => ({
                    file_path: '',
                    file_name: f.name,
                    file_size: f.size,
                    file_mime_type: f.type,
                    sort_order: i,
                }))
                : [];

        const optimisticId = Date.now();
        const optimistic: Message = {
            id: optimisticId,
            conversation_id: conversationId,
            sender_id: currentUserId,
            type,
            body: body || null,
            label: label ?? null,
            file_path: null,
            file_name: null,
            file_size: null,
            file_mime_type: null,
            media_items: optimisticMediaItems.length > 0 ? optimisticMediaItems : undefined,
            is_deleted: false,
            delivered_at: null,
            read_at: null,
            created_at: new Date().toISOString(),
            status: 'sending',
        };

        // Track blob URLs for this optimistic message — revoke AFTER real message arrives
        const blobsForThisMsg: string[] = [...capturedImagePreviews];
        if (blobsForThisMsg.length > 0) blobUrlsMap.current.set(optimisticId, blobsForThisMsg);

        setMessages((prev) => [...prev, optimistic]);
        setText('');

        // Snapshot files before clearing state (state reset doesn't affect File objects)
        const imgFiles = [...pendingImages];
        const docFiles = [...pendingDocs];
        const sendType = type;

        // Clear state WITHOUT revoking blob URLs (still used by optimistic message)
        clearPendingState();
        setIsSending(true);

        const isMediaSend = sendType !== 'text';
        if (isMediaSend) {
            stickToBottomUntilRef.current = Date.now() + 1500;
        }
        scrollToBottom(isMediaSend);

        try {
            const sent = await chatService.sendMessage({
                conversation_id: conversationId,
                type: sendType,
                body: body || undefined,
                label: label,
                files: sendType === 'image' ? imgFiles
                    : sendType === 'document' ? docFiles
                        : undefined,
            });
            // Replace optimistic with real message
            setMessages((prev) => prev.map((m) => (m.id === optimisticId ? sent : m)));
            if (isMediaSend) {
                stickToBottomUntilRef.current = Date.now() + 1500;
                scrollToBottom(true);
            }
            // NOW safe to revoke the blob URLs (real message has server URLs)
            const blobs = blobUrlsMap.current.get(optimisticId);
            if (blobs) {
                blobs.forEach(URL.revokeObjectURL);
                blobUrlsMap.current.delete(optimisticId);
            }
            chatService.sendTyping(conversationId, false).catch(() => {
            });
        } catch (err) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticId));

            if (sendType === 'text' && body) {
                setText(body);
            } else if (sendType === 'image') {
                setPendingKind('images');
                setPendingImages(imgFiles);
                setImagePreviews(capturedImagePreviews);
                if (label) setMediaLabel(label);
            } else if (sendType === 'document') {
                setPendingKind('docs');
                setPendingDocs(docFiles);
                if (label) setMediaLabel(label);
            }

            const blobs = blobUrlsMap.current.get(optimisticId);
            blobUrlsMap.current.delete(optimisticId);
            if (sendType !== 'image' && blobs) {
                blobs.forEach(URL.revokeObjectURL);
            }

            showErrorToast(getErrorMessage(err));
        } finally {
            setIsSending(false);
        }
    }, [text, isSending, mediaLabel, hasPending, pendingKind, pendingImages, imagePreviews,
        pendingDocs, conversationId, currentUserId,
        clearPendingState, scrollToBottom]);

    const handleTypingChange = useCallback((value: string) => {
        setText(value);
        chatService.sendTyping(conversationId, true).catch(() => {
        });
        if (typingTimer.current) clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => {
            chatService.sendTyping(conversationId, false).catch(() => {
            });
        }, 3000);
    }, [conversationId]);

    const handleMediaLoad = useCallback(() => {
        if (Date.now() < stickToBottomUntilRef.current || isNearBottom()) {
            scrollToBottom();
        }
    }, [isNearBottom, scrollToBottom]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Merge messages + call logs into a time-sorted timeline ───────────
    type TimelineItem =
        | { kind: 'message'; id: string; created_at: string; data: Message }
        | { kind: 'call';    id: string; created_at: string; data: CallLog };

    const timeline: TimelineItem[] = [
        ...messages.map((m) => ({kind: 'message' as const, id: `m-${m.id}`, created_at: m.created_at, data: m})),
        ...callLogs.map((c) => ({kind: 'call' as const, id: `c-${c.id}`, created_at: c.created_at, data: c})),
    ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // ── Group timeline items by date ──────────────────────────────────────
    const grouped: { date: string; items: TimelineItem[] }[] = [];
    for (const item of timeline) {
        const dateLabel = new Date(item.created_at).toLocaleDateString('en-BD', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
        const last = grouped[grouped.length - 1];
        if (last && last.date === dateLabel) last.items.push(item);
        else grouped.push({date: dateLabel, items: [item]});
    }

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col h-full">
                <div
                    className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-gray-100 bg-white animate-pulse shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200"/>
                    <div className="space-y-1.5 flex-1">
                        <div className="h-3.5 bg-gray-200 rounded w-32"/>
                        <div className="h-2.5 bg-gray-200 rounded w-20"/>
                    </div>
                </div>
                <div className="flex-1 bg-[#F8F9FB] p-3 sm:p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex ${i % 2 ? 'justify-start' : 'justify-end'}`}>
                            <div className="h-10 bg-gray-200 rounded-2xl animate-pulse"
                                 style={{width: `${120 + i * 30}px`}}/>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-[#4A3F2E] text-sm text-center">Conversation not found.</p>
            </div>
        );
    }

    const {participant} = conversation;
    const initials = participant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="flex flex-col h-full min-w-0">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2.5 border-b border-gray-100 bg-white shrink-0">
                <button
                    onClick={() => router.push('/chat')}
                    className="md:hidden text-meta hover:text-[#1F2937] mr-1 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                    aria-label="Back"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>

                <div className="relative shrink-0">
                    {participant.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cfImageUrl(participant.avatar) ?? ''} alt={participant.name}
                             className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover profile-photo-border"/>
                    ) : (
                        <div
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-br from-[#FFCF00] to-[#FFE033] flex items-center justify-center text-[#1A1208] font-bold text-sm profile-photo-border">
                            {initials}
                        </div>
                    )}
                    {participant.is_online && (
                        <span
                            className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400 border-2 border-white"/>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1F2937] truncate">{participant.name}</p>
                    <p className="text-xs text-[#4A3F2E] truncate">
                        {participant.is_online
                            ? <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
                                Online
                              </span>
                            : participant.last_seen_at
                                ? `Last seen ${new Date(participant.last_seen_at).toLocaleTimeString('en-BD', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}`
                                : 'Offline'}
                    </p>
                </div>

                <span
                    className="hidden sm:inline text-[10px] text-[#4A3F2E] bg-gray-100 px-2 py-1 rounded-full font-mono shrink-0">
          {participant.profile_id}
        </span>

                {/* ── Call buttons ──────────────────────────────────────── */}
                <div className="flex items-center gap-0.5 shrink-0" title={
                    !['gold', 'platinum'].includes(participant.subscription_plan)
                        ? 'Calls require Gold or Platinum plan'
                        : 'Call'
                }>
                    <CallButton
                        receiverId={participant.id}
                        receiver={{
                            id: participant.id,
                            name: participant.name,
                            avatar: participant.avatar,
                            profile_id: participant.profile_id,
                        } satisfies CallParticipant}
                        type="audio"
                    />
                    <CallButton
                        receiverId={participant.id}
                        receiver={{
                            id: participant.id,
                            name: participant.name,
                            avatar: participant.avatar,
                            profile_id: participant.profile_id,
                        } satisfies CallParticipant}
                        type="video"
                    />
                </div>
            </div>

            {/* ── Messages ────────────────────────────────────────────────── */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto bg-[#F8F9FB] px-2 sm:px-4 py-3 sm:py-4"
            >
                <div ref={contentInnerRef} className="space-y-3">
                <div ref={topSentinelRef} className="h-px shrink-0" aria-hidden="true"/>
                {isLoadingMore && (
                    <div className="flex justify-center py-2">
                        <span
                            className="w-5 h-5 border-2 border-[#FFCF00]/30 border-t-[#FFCF00] rounded-full animate-spin"/>
                    </div>
                )}
                {!hasMore && messages.length > 0 && (
                    <p className="text-center text-[11px] text-[#4A3F2E] py-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-300 mx-0.5 align-middle"/>
                        Beginning of conversation
                    </p>
                )}

                {grouped.map(({date, items: dayItems}) => (
                    <div key={date}>
                        <div className="flex items-center gap-2 sm:gap-3 my-3 sm:my-4">
                            <div className="flex-1 h-px bg-gray-200"/>
                            <span
                                className="text-[10px] sm:text-[11px] text-[#4A3F2E] font-medium px-2 whitespace-nowrap">{date}</span>
                            <div className="flex-1 h-px bg-gray-200"/>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                            {dayItems.map((item, idx) => {
                                if (item.kind === 'call') {
                                    return (
                                        <CallLogBubble
                                            key={item.id}
                                            callLog={item.data}
                                            currentUserId={currentUserId}
                                        />
                                    );
                                }
                                const msg = item.data;
                                const isMine = msg.sender_id === currentUserId;
                                const prevItem = dayItems[idx - 1];
                                const prevMsg = prevItem?.kind === 'message' ? prevItem.data : null;
                                const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                                return (
                                    <MessageBubble
                                        key={item.id}
                                        message={msg}
                                        isMine={isMine}
                                        senderName={participant.name}
                                        showAvatar={showAvatar}
                                        onMediaLoad={handleMediaLoad}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}

                {isTyping && <TypingIndicator name={participant.name}/>}
                <div ref={bottomRef}/>
                </div>
            </div>

            {/* ── Pending media preview bar ────────────────────────────────── */}
            {hasPending && (
                <div className="shrink-0 bg-white border-t border-gray-100 px-2 sm:px-3 py-2 max-h-48 overflow-y-auto">
                    {/* Image grid preview */}
                    {pendingKind === 'images' && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 flex-wrap">
                                {imagePreviews.map((url, i) => (
                                    <div key={i}
                                         className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="" className="w-full h-full object-cover"/>
                                        <button
                                            onClick={() => removeImage(i)}
                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white leading-none"
                                        >
                                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                        </button>
                                    </div>
                                ))}
                                {pendingImages.length < MAX_IMAGES && (
                                    <button
                                        onClick={() => imageRef.current?.click()}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-[#FFCF00]/40 flex items-center justify-center text-[#1A1208] hover:border-[#FFCF00] hover:bg-[#FFCF00]/5 transition-colors shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                             strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-[#4A3F2E]">{pendingImages.length}/{MAX_IMAGES} images · max 2 MB each</p>
                        </div>
                    )}

                    {/* Docs preview */}
                    {pendingKind === 'docs' && (
                        <div className="flex flex-col gap-1">
                            {pendingDocs.map((f, i) => (
                                <div key={i}
                                     className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 sm:px-3 py-1.5">
                                    <div
                                        className="w-7 h-7 rounded-lg bg-[#FFCF00]/10 flex items-center justify-center text-[#1A1208] shrink-0">
                                        <span
                                            className="text-[10px] font-bold">{(f.name.split('.').pop() ?? 'DOC').toUpperCase().slice(0, 3)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-[#1F2937] truncate">{f.name}</p>
                                        <p className="text-[10px] text-[#4A3F2E]">{formatFileSize(f.size)}</p>
                                    </div>
                                     <button onClick={() => removeDoc(i)}
                                             className="w-5 h-5 rounded-full hover:bg-red-100 text-[#4A3F2E] hover:text-red-500 flex items-center justify-center transition-colors">
                                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            ))}
                            {pendingDocs.length < MAX_FILES && (
                                <button onClick={() => fileRef.current?.click()}
                                        className="text-xs text-[#1A1208] hover:underline text-left pl-1">+ Add file
                                    (PDF/DOC, max {MAX_FILES}, 2 MB each)</button>
                            )}
                        </div>
                    )}

                    {/* Label / caption input */}
                    <div className="mt-1.5 flex items-center gap-1.5">
                        <input
                            type="text"
                            value={mediaLabel}
                            onChange={(e) => setMediaLabel(e.target.value)}
                            placeholder="Add a label / caption… (optional)"
                            maxLength={500}
                            className="flex-1 text-xs rounded-xl bg-[#F8F9FB] border border-gray-200 px-2.5 py-1.5 text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#FFCF00] focus:ring-1 focus:ring-[#FFCF00]/30 transition-all min-w-0"
                        />
                        <button onClick={clearPending}
                                className="text-xs text-[#4A3F2E] hover:text-red-500 transition-colors whitespace-nowrap px-1 shrink-0">Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Input bar ───────────────────────────────────────────────── */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-2 sm:px-3 py-2 sm:py-3">
                {/* hidden file inputs */}
                <input ref={imageRef} type="file" accept={ACCEPT_IMAGE} multiple className="hidden"
                       onChange={(e) => {
                           const files = Array.from(e.target.files ?? []);
                           if (pendingKind === null || pendingKind === 'images') handleImagesPick(files);
                           e.target.value = '';
                       }}/>
                <input ref={fileRef} type="file" accept={ACCEPT_FILE} multiple className="hidden"
                       onChange={(e) => {
                           const files = Array.from(e.target.files ?? []);
                           if (pendingKind === null || pendingKind === 'docs') handleDocsPick(files);
                           e.target.value = '';
                       }}/>

                <div className="flex items-end gap-1 sm:gap-2">
                    {/* Attachment buttons */}
                    <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 shrink-0">
                        <button
                            onClick={() => {
                                if (!pendingKind || pendingKind === 'images') imageRef.current?.click();
                            }}
                            disabled={!!pendingKind && pendingKind !== 'images'}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-meta hover:text-[#1A1208] hover:bg-[#FFCF00]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={`Send photos (max ${MAX_IMAGES}, 2 MB each)`}
                        >
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                        </button>
                        <button
                            onClick={() => {
                                if (!pendingKind || pendingKind === 'docs') fileRef.current?.click();
                            }}
                            disabled={!!pendingKind && pendingKind !== 'docs'}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-meta hover:text-[#1A1208] hover:bg-[#FFCF00]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title={`Send PDF/DOC files (max ${MAX_FILES}, 2 MB each)`}
                        >
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                            </svg>
                        </button>
                    </div>

                    <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => handleTypingChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={hasPending ? 'Add a caption…' : 'Type a message…'}
                        rows={1}
                        className="flex-1 min-w-0 resize-none rounded-2xl bg-[#F8F9FB] border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#FFCF00] focus:ring-2 focus:ring-[#FFCF00]/20 transition-all max-h-24 sm:max-h-28 overflow-y-auto"
                        style={{lineHeight: '1.5'}}
                    />

                    <button
                        onClick={handleSend}
                        disabled={(!text.trim() && !hasPending) || isSending}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-[#FFCF00] text-[#1A1208] hover:bg-[#E6BA00] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 self-end"
                        aria-label="Send"
                    >
                        {isSending ? (
                            <span
                                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                        ) : (
                            <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                            </svg>
                        )}
                    </button>
                </div>

                <p className="text-[9px] sm:text-[10px] text-[#4A3F2E] mt-1 text-center">
                    Photos &amp; files max 2 MB each · Documents: PDF, DOC, DOCX only · Chat available between mutually accepted interests
                </p>
            </div>
        </div>
    );
}

