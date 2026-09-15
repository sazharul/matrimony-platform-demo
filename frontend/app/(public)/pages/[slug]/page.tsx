import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPage } from '@/services/publicService';
import { pageSlugToHref } from '@/lib/publicNav';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const page = await getPage(slug);
    return {
      title: page.meta_title ?? page.title,
      description: page.meta_description ?? undefined,
    };
  } catch {
    return { title: 'Page Not Found' };
  }
}

export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params;

  const fixedHref = pageSlugToHref(slug);
  if (fixedHref !== `/pages/${slug}`) {
    redirect(fixedHref);
  }

  let page;
  try {
    page = await getPage(slug);
  } catch {
    notFound();
  }

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
            <p className="text-[#4A3F2E] mt-3">{page.meta_description}</p>
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
