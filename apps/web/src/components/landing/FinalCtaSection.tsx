import Link from 'next/link';
import { CTAS, FINAL_CTA } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';

export function FinalCtaSection() {
  return (
    <section className="pb-20 pt-4">
      <div className="container">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-[1.75rem] px-6 py-14 sm:px-12 text-white text-center"
            style={{
              background:
                'radial-gradient(600px 280px at 50% 0%, rgba(108,77,255,0.32), transparent 55%), linear-gradient(125deg, #6c4dff, #1a1625 64%)',
            }}
          >
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl sm:text-[2.15rem] font-black leading-snug">
                {FINAL_CTA.headline}
              </h2>
              <p className="mt-4 text-white/70 leading-8">{FINAL_CTA.body}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href={CTAS.primary.href} className="btn btn-primary">
                  {CTAS.primary.label}
                </Link>
                <Link href={CTAS.demo.href} className="btn btn-outline-light">
                  {CTAS.demo.label}
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
