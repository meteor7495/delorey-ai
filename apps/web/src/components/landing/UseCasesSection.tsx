import { USE_CASES } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function UseCasesSection() {
  return (
    <section id="use-cases" className="section-anchor py-20 sm:py-28 bg-white">
      <div className="container">
        <SectionHeader
          eyebrow="راه‌حل‌ها"
          title="برای هر نوع کسب‌وکار آنلاین"
          subtitle="هر صنعت سناریوی مخصوص خود را دارد — دستیار هوشمند برای همان کاربرد آموزش می‌بیند."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {USE_CASES.map((item, i) => (
            <ScrollReveal key={item.industry} delay={i * 50}>
              <article className="use-case-card h-full">
                <span className="text-2xl mb-3 block" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="text-base font-extrabold mb-2">{item.industry}</h3>
                <p className="text-xs leading-6 text-ink/55">{item.useCase}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
