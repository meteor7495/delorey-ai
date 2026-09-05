import { ScrollReveal } from './ScrollReveal';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  className = '',
}: SectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : '';

  return (
    <ScrollReveal className={`max-w-3xl mb-12 sm:mb-16 ${alignClass} ${className}`}>
      {eyebrow ? <p className="eyebrow mb-4">{eyebrow}</p> : null}
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-ink/60 leading-8 text-base sm:text-lg">{subtitle}</p>
      ) : null}
    </ScrollReveal>
  );
}
