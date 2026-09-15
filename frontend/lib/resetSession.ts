import {queryClient} from '@/lib/queryClient';
import {disconnectEcho} from '@/lib/echo';
import {useCallStore} from '@/store/callStore';

/** Clear all user-scoped client caches (React Query, notifications, calls, websockets). */
export function resetSession(): void {
    queryClient.clear();
    useCallStore.getState().endCall();
    disconnectEcho();

    // Lazy import avoids api -> authStore -> resetSession -> notificationStore -> api cycle.
    void import('@/store/notificationStore').then(({useNotificationStore}) => {
        useNotificationStore.setState({notifications: [], unreadCount: 0, isLoading: false});
    });
}
