'use client';

import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@/lib/queryClient';
import {DynamicFavicon} from '@/components/DynamicFavicon';

export function QueryProvider({children}: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <DynamicFavicon/>
            {children}
        </QueryClientProvider>
    );
}

