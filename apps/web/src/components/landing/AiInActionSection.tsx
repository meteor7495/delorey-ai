'use client';

import { useEffect, useState } from 'react';
import { AI_IN_ACTION } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function AiInActionSection() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % AI_IN_ACTION.steps.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="ai-action" className="section-anchor py-20 sm:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="در عمل"
          title={AI_IN_ACTION.title}
          subtitle={AI_IN_ACTION.subtitle}
        />

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14 items-start">
          <ScrollReveal>
            <div className="rounded-[1.75rem] border border-ink/8 bg-white p-5 sm:p-6 shadow-[0_20px_50px_rgba(26,22,37,0.06)]">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-ink/8">
                <span className="status-dot" />
                <span className="text-xs font-bold text-ink/50">گفتگوی نمایشی</span>
              </div>
              <div className="space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-se-md bg-sand px-4 py-3 text-sm leading-7">
                  {AI_IN_ACTION.customerQuestion}
                </div>
                <div className="ms-auto max-w-[88%] rounded-2xl rounded-ss-md bg-gradient-to-l from-primary to-secondary px-4 py-3 text-sm leading-7 text-white shadow-lg shadow-primary/15">
                  {AI_IN_ACTION.aiResponse}
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <ol className="space-y-3">
              {AI_IN_ACTION.steps.map((s, i) => (
                <li
                  key={s.label}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                    i <= step
                      ? 'border-primary/25 bg-primary-soft/50'
                      : 'border-ink/8 bg-white'
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black ${
                      i < step
                        ? 'bg-primary text-white'
                        : i === step
                          ? 'bg-primary/20 text-primary-text ring-2 ring-primary/30'
                          : 'bg-ink/5 text-ink/40'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      i <= step ? 'text-ink/85' : 'text-ink/45'
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
