'use client';

import {useEffect} from 'react';
import {useAuthStore} from '@/store/authStore';
import {useCallStore} from '@/store/callStore';
import {useNotificationStore} from '@/store/notificationStore';
import {queryClient} from '@/lib/queryClient';
import {
    invalidateConversationQueries,
    invalidateDashboardQueries,
    invalidateInterestQueries,
    invalidateMessageUnreadQueries,
    invalidateNotificationQueries,
} from '@/lib/cacheInvalidation';
import {dismissCallById, matchesCallId} from '@/lib/callDismiss';
import {notificationService} from '@/services/notificationService';
import {initSoundUnlock, playNotificationSound} from '@/lib/soundPlayer';
import {IncomingCallModal} from '@/components/call/IncomingCallModal';
import {CallScreen} from '@/components/call/CallScreen';
import type {IncomingCallPayload} from '@/types/call';
import type {BackendNotification} from '@/types/notification';

/**
 * CallProvider
 *
 * Mounted at the root layout — listens on the current user's private
 * Reverb channel for incoming call events and renders the call UI.
 */
export function CallProvider({children}: {children: React.ReactNode}) {
    const user = useAuthStore((s) => s.user);
    const activeCall = useCallStore((s) => s.activeCall);

    useEffect(() => {
        return initSoundUnlock();
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        useNotificationStore.getState().fetchNotifications();
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || typeof window === 'undefined') return;

        let cancelled = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let channel: any = null;

        (async () => {
            const {getPrivateChannel} = await import('@/lib/echo');
            channel = await getPrivateChannel(`user.${user.id}`);
            if (cancelled || !channel) return;

            // Receiver is ringing — caller shows "Ringing…" + ringback sound
            channel.listen('.call.ringing', (e: {call_id: number | string}) => {
                if (cancelled) return;
                const {activeCall: ac} = useCallStore.getState();
                if (
                    ac?.isCaller
                    && matchesCallId(ac.callId, e.call_id)
                    && ac.status === 'calling'
                ) {
                    useCallStore.getState().setCallStatus('ringing');
                }
            });

            channel.listen('.call.initiated', (e: IncomingCallPayload) => {
                if (cancelled) return;
                useCallStore.getState().setIncomingCall({
                    callId: Number(e.call_id),
                    callType: e.type,
                    caller: e.caller,
                });
            });

            // Caller cancelled — instant dismiss for receiver
            channel.listen('.call.cancelled', (e: {call_id: number | string}) => {
                if (cancelled) return;
                dismissCallById(e.call_id);
            });

            channel.listen('.call.ended', (e: {call_id: number | string}) => {
                if (cancelled) return;
                dismissCallById(e.call_id);
            });

            channel.listen('.call.declined', (e: {call_id: number | string}) => {
                if (cancelled) return;
                dismissCallById(e.call_id);
            });

            channel.listen('.notification.created', (e: BackendNotification) => {
                if (cancelled) return;

                if (e.type === 'face_scan_rejected') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?face_scan_rejected=1';
                    return;
                }
                if (e.type === 'account_disable_request_banned') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_banned=1';
                    return;
                }
                if (e.type === 'admin_account_disabled' || e.type === 'account_disable_request_disabled') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_disabled=1';
                    return;
                }
                if (e.type === 'admin_account_banned') {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login?account_banned=1';
                    return;
                }

                useNotificationStore.getState().addNotification(notificationService.transformNotification(e));

                const skipMessageSound =
                    e.type === 'new_message'
                    && e.data?.conversation_id
                    && window.location.pathname === `/chat/${e.data.conversation_id}`;
                if (!skipMessageSound) {
                    void playNotificationSound();
                }

                invalidateNotificationQueries(queryClient);
                if (e.type.startsWith('interest_')) {
                    invalidateInterestQueries(queryClient);
                    invalidateDashboardQueries(queryClient);
                }
                if (e.type === 'new_message') {
                    invalidateConversationQueries(queryClient);
                    const convId = e.data?.conversation_id;
                    const viewingConversation = convId
                        && (window.location.pathname === `/chat/${convId}`
                            || window.location.pathname.startsWith(`/chat/${convId}/`));
                    if (!viewingConversation) {
                        invalidateMessageUnreadQueries(queryClient);
                    }
                }
                if (e.type === 'profile_viewed') {
                    invalidateDashboardQueries(queryClient);
                }
            });
        })();

        return () => {
            cancelled = true;
            if (channel) {
                channel.stopListening('.call.initiated');
                channel.stopListening('.call.ringing');
                channel.stopListening('.call.cancelled');
                channel.stopListening('.call.ended');
                channel.stopListening('.call.declined');
                channel.stopListening('.notification.created');
            }
        };
    }, [user?.id]);

    return (
        <>
            {children}
            <IncomingCallModal/>
            {activeCall && <CallScreen currentUserId={user?.id ?? 0}/>}
        </>
    );
}
