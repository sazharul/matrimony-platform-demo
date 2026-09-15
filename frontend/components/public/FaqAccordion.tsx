'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) {
    return (
      <p className="text-meta text-center py-8">No FAQ items available.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border overflow-hidden transition-all duration-200"
          style={{ borderColor: openIndex === i ? '#FFCF00' : '#e5e7eb' }}
        >
          <button
            className="w-full flex items-center justify-between px-6 py-4 text-left gap-4"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span className="font-semibold text-gray-800 text-sm md:text-base">{item.question}</span>
            <ChevronDown
              size={18}
              className="shrink-0 transition-transform duration-200"
              style={{
                color: '#FFCF00',
                transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </button>
          {openIndex === i && (
            <div className="px-6 pb-5">
              <div
                className="prose prose-sm max-w-none text-[#3D3220] border-t pt-4"
                style={{ borderColor: '#f3f4f6' }}
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

