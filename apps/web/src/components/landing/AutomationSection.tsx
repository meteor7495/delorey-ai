import { AUTOMATIONS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function AutomationSection() {
  return (
    <section id="automation" className="section-anchor py-20 sm:py-28 bg-white">
      <div className="container">
        <SectionHeader
          eyebrow="اتوماسیون"
          title="گردش کارهای هوشمند"
          subtitle="وقتی رویداد رخ می‌دهد، دستیار هوشمند اقدام بعدی را اجرا می‌کند."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATIONS.map((flow, i) => (
            <ScrollReveal key={flow.trigger} delay={i * 80}>
              <article className="workflow-card h-full">
                <div className="workflow-card__trigger">
                  <span className="text-[10px] font-black text-primary-text uppercase tracking-wide">
                    وقتی
                  </span>
                  <p className="text-sm font-extrabold mt-1">{flow.trigger}</p>
                </div>
                <div className="workflow-card__arrow" aria-hidden>
                  →
                </div>
                <div className="workflow-card__action">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">
                    سپس
                  </span>
                  <p className="text-sm font-bold text-ink/75 mt-1">{flow.action}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
