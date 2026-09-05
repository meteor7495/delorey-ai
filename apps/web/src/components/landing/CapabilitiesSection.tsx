import { CAPABILITIES } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="section-anchor py-20 sm:py-28 bg-white">
      <div className="container">
        <SectionHeader
          eyebrow="قابلیت‌ها"
          title={CAPABILITIES.title}
          subtitle={CAPABILITIES.subtitle}
          align="center"
          className="!mb-14"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {CAPABILITIES.items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <article className="rounded-[1.25rem] border border-ink/8 bg-sand/40 p-6 h-full">
                <h3 className="text-lg font-extrabold mb-2">{item.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{item.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
