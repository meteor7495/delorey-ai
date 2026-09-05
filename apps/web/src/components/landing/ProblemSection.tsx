import { PROBLEMS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function ProblemSection() {
  return (
    <section id="problems" className="section-anchor py-20 sm:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="چالش‌ها"
          title="بدون تیم هوشمند، فروش آنلاین سخت‌تر می‌شود"
          subtitle="مشکلاتی که اکثر فروشگاه‌های آنلاین هر روز با آن روبرو هستند."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((problem, i) => (
            <ScrollReveal key={problem.title} delay={i * 70}>
              <article className="problem-card h-full">
                <span className="problem-card__icon" aria-hidden>
                  {problem.icon}
                </span>
                <h3 className="text-lg font-extrabold mb-2">{problem.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{problem.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
