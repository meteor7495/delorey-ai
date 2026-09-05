'use client';

import { useEffect, useRef, useState } from 'react';
import { HOW_IT_WORKS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f7f6fa 0%, #f0eef5 50%, #f7f6fa 100%)',
      }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="نحوه کار"
          title="چطور Seloma کار می‌کند"
          subtitle="از اتصال کسب‌وکار تا رشد — در چهار مرحله."
          align="center"
          className="!mb-14"
        />

        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {HOW_IT_WORKS.map((step, i) => (
              <button
                key={step.step}
                type="button"
                onClick={() => setActiveStep(i)}
                className={`shrink-0 rounded-xl border px-4 py-3 text-start transition-all lg:w-full ${
                  activeStep === i
                    ? 'border-primary bg-primary text-white shadow-md shadow-primary/15'
                    : 'border-ink/10 bg-white hover:border-primary/20'
                }`}
              >
                <span
                  className={`text-xs font-black ${activeStep === i ? 'text-white/70' : 'text-primary-text'}`}
                >
                  {step.step}
                </span>
                <p className="text-sm font-extrabold mt-1">{step.title}</p>
              </button>
            ))}
          </div>

          <ScrollReveal>
            <div className="rounded-[1.75rem] border border-ink/8 bg-white p-6 sm:p-8 min-h-[320px]">
              <p className="text-xs font-black text-primary-text mb-2">
                {HOW_IT_WORKS[activeStep]!.step}
              </p>
              <h3 className="text-2xl font-black mb-3">
                {HOW_IT_WORKS[activeStep]!.title}
              </h3>
              <p className="text-ink/65 leading-8 mb-6">
                {HOW_IT_WORKS[activeStep]!.body}
              </p>
              <div className="flex flex-wrap gap-2">
                {HOW_IT_WORKS[activeStep]!.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-text"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex gap-2">
                {HOW_IT_WORKS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      i <= activeStep ? 'bg-primary' : 'bg-ink/10'
                    }`}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
