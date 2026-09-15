import type { Metadata } from 'next';
import { getPage } from '@/services/publicService';
import FaqAccordion from '@/components/public/FaqAccordion';

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('faq');
  return {
    title: page.meta_title ?? 'FAQ',
    description: page.meta_description ?? 'Frequently asked questions about MatriConnect.',
    openGraph: {
      title: page.meta_title ?? 'FAQ — MatriConnect',
      description: page.meta_description ?? '',
      type: 'website',
    },
  };
}

/**
 * Parse FAQ HTML content into structured {question, answer} pairs.
 * Expects the backend to structure FAQ content with
 * <div class="faq-item"><h3>Question</h3><p>Answer</p></div>
 */
function parseFaqItems(html: string): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];

  // Simple regex parser — works for the structured content from the backend seeder
  const itemRegex = /<div[^>]*class="faq-item"[^>]*>([\s\S]*?)<\/div>/gi;
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/i;
  const answerRegex = /<h3[^>]*>[\s\S]*?<\/h3>([\s\S]*)/i;

  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[1];
    const questionMatch = h3Regex.exec(block);
    const answerMatch = answerRegex.exec(block);

    if (questionMatch) {
      items.push({
        question: questionMatch[1].replace(/<[^>]+>/g, '').trim(),
        answer: answerMatch ? answerMatch[1].trim() : '',
      });
    }
  }

  // Fallback: if no structured items found, return the whole content as one item
  if (items.length === 0 && html.trim()) {
    return [{ question: 'General Information', answer: html }];
  }

  return items;
}

export default async function FaqPage() {
  const page = await getPage('faq');
  const faqItems = parseFaqItems(page.content ?? '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer.replace(/<[^>]+>/g, ''),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Header */}
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <FaqAccordion items={faqItems} />
      </div>
    </>
  );
}

