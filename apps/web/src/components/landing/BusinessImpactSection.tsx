import { BUSINESS_IMPACT } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function BusinessImpactSection() {
  return (
    <section
      id="impact"
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f0eef5 0%, #f7f6fa 100%)',
      }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="تأثیر"
          title="نتایجی که Seloma هدف می‌گیرد"
          subtitle="بدون عدد ساختگی — این‌ها اهداف واقعی پلتفرم هستند."
          align="center"
          className="!mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BUSINESS_IMPACT.map((item, i) => (
            <ScrollReveal key={item.label} delay={i * 70}>
              <article className="impact-card text-center">
                <p className="text-xl font-black text-primary-text mb-2">{item.label}</p>
                <p className="text-sm leading-7 text-ink/55">{item.desc}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
