'use client';

import { useEffect } from 'react';
import { useSettings } from '@/lib/useSettings';
import { cfImageUrl } from '@/lib/utils';

/** Syncs <link rel="icon"> in document head from site settings (client-side). */
export function DynamicFavicon() {
    const { settings } = useSettings();
    const faviconUrl = cfImageUrl(settings.site_favicon);

    useEffect(() => {
        if (!faviconUrl) return;

        let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconUrl;
    }, [faviconUrl]);

    return null;
}
