import type {ProfileCard} from './profile';

export type InterestStatus = 'pending' | 'accepted' | 'declined' | 'ignored' | 'expired';

export interface Interest {
    id: number;
    status: InterestStatus;
    expires_at: string;
    created_at: string;
    can_message?: boolean;
    conversation_id?: number | null;
    sender: ProfileCard | null;
    receiver: ProfileCard | null;
    connected_user?: ProfileCard | null;
}

