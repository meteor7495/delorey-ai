import { INTEGRATION } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';

export function IntegrationSection() {
  return (
    <section
      id="integration"
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f7f6fa 0%, #f0eef5 100%)',
      }}
    >
      <div className="container">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl text-center mb-12">
            <p className="eyebrow mb-4 justify-center">یکپارچگی</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              {INTEGRATION.headline}
            </h2>
            <p className="text-4xl sm:text-5xl font-black text-primary mb-4">
              {INTEGRATION.answer}
            </p>
            <p className="text-ink/60 leading-8 text-base sm:text-lg">
              {INTEGRATION.body}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div className="mx-auto max-w-md">
            <div className="flex flex-col items-center gap-3">
              {INTEGRATION.layers.map((layer) => (
                <div
                  key={layer.label}
                  className={`integration-layer w-full rounded-xl border px-5 py-4 text-center ${
                    'highlight' in layer && layer.highlight
                      ? 'border-primary bg-gradient-to-b from-primary to-secondary text-white shadow-xl shadow-primary/20 font-black'
                      : 'border-ink/10 bg-white font-extrabold text-ink/75'
                  }`}
                >
                  <span className="me-2" aria-hidden>
                    {layer.icon}
                  </span>
                  {layer.label}
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-lg font-black text-primary-text">
              = {INTEGRATION.result}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
