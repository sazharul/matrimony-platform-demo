export type MessageType = 'text' | 'image' | 'document' | 'voice' | 'video' | 'audio';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface MediaItem {
    id?: number;
    file_path: string;
    file_name?: string | null;
    file_size?: number | null;
    file_mime_type?: string | null;
    sort_order?: number;
    /** blob: URL for optimistic preview */
    preview_url?: string;
}

export interface MessageSender {
    id: number;
    name: string;
    profile_id: string | null;
}

export interface ReplyToMessage {
    id: number;
    body: string | null;
    type: MessageType;
    sender_id: number;
}

export interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    type: MessageType;
    body: string | null;
    /** Optional caption/label for media messages */
    label?: string | null;
    file_path: string | null;
    file_name?: string | null;
    file_size?: number | null;
    file_mime_type?: string | null;
    duration_seconds?: number | null;
    thumbnail_path?: string | null;
    reactions?: Record<string, number>;
    reply_to_message_id?: number | null;
    reply_to?: ReplyToMessage | null;
    /** Multiple media items (images/docs) */
    media_items?: MediaItem[];
    is_deleted: boolean;
    delivered_at: string | null;
    read_at: string | null;
    created_at: string;
    /** Virtual: computed from delivered_at / read_at */
    status?: MessageStatus;
    sender?: MessageSender;
}

export interface ConversationParticipant {
    id: number;
    name: string;
    avatar: string | null;
    is_online: boolean;
    last_seen_at: string | null;
    profile_id: string | null;
    subscription_plan: 'free' | 'silver' | 'gold' | 'platinum';
}

export interface Conversation {
    id: number;
    /** The other participant (not the current user) */
    participant: ConversationParticipant;
    last_message: Message | null;
    last_message_at: string | null;
    unread_count: number;
    created_at: string;
}

export interface SendMessagePayload {
    conversation_id: number;
    type: MessageType;
    body?: string;
    label?: string;
    reply_to_message_id?: number;
    /** Single file (video/audio/voice) */
    file?: File;
    /** Multiple files (images max 10, documents max 2) */
    files?: File[];
}

/** Shape of the paginated messages response */
export interface MessagesResponse {
    data: Message[];
    pagination: {
        has_more: boolean;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/** Shape of the paginated conversations response */
export interface ConversationsResponse {
    data: Conversation[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}
