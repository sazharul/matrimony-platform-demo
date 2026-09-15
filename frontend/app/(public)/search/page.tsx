import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getSettings } from '@/services/publicService';
import PublicSearchPageContent from '@/components/public/PublicSearchPageContent';

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSettings();
    return {
        title: `Search Profiles — ${settings.site_name}`,
        description: `Browse matrimony profiles on ${settings.site_name}. Filter by age, religion, location, and more.`,
        openGraph: {
            title: `Search Profiles — ${settings.site_name}`,
            description: `Find your perfect match on ${settings.site_name}.`,
            type: 'website',
        },
    };
}

function SearchLoading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card-premium profile-card overflow-hidden">
                        <div className="skeleton-gold profile-card-photo w-full" />
                        <div className="p-3 space-y-2">
                            <div className="skeleton-gold h-3.5 w-3/4 rounded" />
                            <div className="skeleton-gold h-3 w-1/2 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PublicSearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <PublicSearchPageContent />
        </Suspense>
    );
}
