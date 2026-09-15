import type { QueryClient } from '@tanstack/react-query';
import { getErrorMessage, showErrorToast, showInfoToast } from '@/lib/toast';
import { invalidateInterestQueries } from '@/lib/cacheInvalidation';

const PENDING_INTEREST_EXISTS_PATTERN = /pending interest already exists/i;

export function isPendingInterestExistsError(error: unknown): boolean {
    return PENDING_INTEREST_EXISTS_PATTERN.test(getErrorMessage(error));
}

interface HandleSendInterestErrorOptions {
    onAlreadySent?: () => void;
    queryClient?: QueryClient;
    /** Query key roots to invalidate (matches any key containing the root). */
    invalidateQueryRoots?: string[];
}

/**
 * When interest was already sent, sync UI to pending/sent state instead of showing an error.
 */
export function handleSendInterestError(
    error: unknown,
    { onAlreadySent, queryClient, invalidateQueryRoots }: HandleSendInterestErrorOptions = {},
): void {
    if (isPendingInterestExistsError(error)) {
        onAlreadySent?.();
        if (queryClient) {
            invalidateInterestQueries(queryClient);
            invalidateQueryRoots?.forEach((root) => {
                queryClient.invalidateQueries({
                    predicate: (query) => query.queryKey.includes(root),
                });
            });
        }
        showInfoToast('Interest already sent');
        return;
    }

    showErrorToast(getErrorMessage(error));
}
