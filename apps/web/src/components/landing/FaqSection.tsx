'use client';

import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f7f6fa 0%, #f0eef5 100%)',
      }}
    >
      <div className="container max-w-3xl">
        <SectionHeader
          eyebrow="سوالات متداول"
          title="پاسخ به سوالات رایج"
          align="center"
          className="!mb-12"
        />

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <ScrollReveal key={item.q} delay={i * 40}>
                <article className="faq-item rounded-xl border border-ink/8 bg-white overflow-hidden">
                  <button
                    type="button"
                    className="faq-item__trigger w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                  >
                    <span className="text-sm font-extrabold">{item.q}</span>
                    <span
                      className={`shrink-0 grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary-text text-sm font-black transition-transform duration-300 ${
                        isOpen ? 'rotate-45' : ''
                      }`}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`faq-item__panel overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="px-5 pb-4 text-sm leading-7 text-ink/60">{item.a}</p>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
