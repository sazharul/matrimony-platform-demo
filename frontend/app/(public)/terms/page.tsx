import type { Metadata } from 'next';
import { getPage } from '@/services/publicService';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('terms');
  return {
    title: page.meta_title ?? 'Terms & Conditions',
    description: page.meta_description ?? 'Terms and conditions for using MatriConnect.',
    openGraph: {
      title: page.meta_title ?? 'Terms & Conditions — MatriConnect',
      description: page.meta_description ?? '',
      type: 'website',
    },
  };
}

export default async function TermsPage() {
  const page = await getPage('terms');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.meta_title ?? page.title,
    description: page.meta_description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div
        className="py-14"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'var(--font-heading, serif)' }}
          >
            {page.title}
          </h1>
          {page.meta_description && (
            <p className="text-[#FFFFFF] mt-3">{page.meta_description}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <article
          className="prose prose-lg max-w-none bg-white rounded-2xl border border-gray-100 p-8 md:p-12"
          dangerouslySetInnerHTML={{ __html: page.content ?? '' }}
        />
      </div>
    </>
  );
}

