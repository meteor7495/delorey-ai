'use client';

import { useState } from 'react';
import { VALUE_PROP } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function ValuePropositionSection() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="value"
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f0eef5 0%, #f7f6fa 42%, #f7f6fa 100%)',
      }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="راه‌حل"
          title={VALUE_PROP.headline}
          subtitle={VALUE_PROP.body}
          align="center"
          className="!mb-14"
        />

        <ScrollReveal>
          <div className="mx-auto max-w-2xl">
            <div className="ecosystem-hub rounded-[1.75rem] border border-primary/15 bg-gradient-to-b from-white to-primary-soft/30 p-6 sm:p-8 text-center shadow-[0_24px_60px_rgba(108,77,255,0.08)]">
              <p className="text-xs font-black tracking-[0.2em] text-primary-text mb-1">
                سِلوما
              </p>
              <p className="text-sm font-bold text-ink/50 mb-6">تجارت هوشمند</p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {VALUE_PROP.employees.map((emp, i) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setActive(i)}
                    className={`ecosystem-node rounded-xl border px-3 py-3 text-start transition-all duration-300 ${
                      active === i
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-ink/8 bg-white hover:border-primary/25'
                    }`}
                  >
                    <p className="text-[11px] font-black opacity-80">{emp.label}</p>
                    <p
                      className={`text-xs font-bold mt-0.5 ${
                        active === i ? 'text-white/80' : 'text-ink/50'
                      }`}
                    >
                      {emp.role}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
