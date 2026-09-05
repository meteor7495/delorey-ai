import { ScrollReveal } from './ScrollReveal';
import { TRUST } from '@/lib/landing-content';

export function TrustSection() {
  return (
    <section className="border-b border-ink/8 bg-white py-10 sm:py-12">
      <div className="container">
        <ScrollReveal>
          <p className="text-center text-sm font-bold text-ink/45 mb-8">
            {TRUST.title}
          </p>
        </ScrollReveal>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {TRUST.items.map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 60} className="flex items-center gap-2">
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span className="text-sm font-bold text-ink/55">{item.label}</span>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={200}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-bold text-ink/40">کانال‌ها:</span>
            {TRUST.channels.map((ch) => (
              <span
                key={ch}
                className="rounded-lg border border-ink/8 bg-sand/80 px-3 py-1.5 text-xs font-bold text-ink/60"
              >
                {ch}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
