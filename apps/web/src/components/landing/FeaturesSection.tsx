import { FEATURES } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="section-anchor py-20 sm:py-28 bg-white"
    >
      <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeader
            eyebrow="امکانات"
            title="همه چیز برای تجارت هوشمند"
            subtitle="یک پلتفرم — نه چند ابزار جدا."
            className="!mb-0"
          />
        </div>

        <div className="rounded-[1.75rem] border border-ink/8 bg-sand/40 px-5 sm:px-7">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 50}>
              <article className="feature-row grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <h3 className="text-base font-extrabold pt-0.5">{f.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{f.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
