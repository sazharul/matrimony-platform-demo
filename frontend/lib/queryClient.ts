import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // User data should refetch on navigation; public caches override this locally.
            staleTime: 0,
            retry: 1,
        },
    },
});
