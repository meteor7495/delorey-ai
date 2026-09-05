import { CHANNELS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function OmnichannelSection() {
  return (
    <section
      id="channels"
      className="section-anchor py-20 sm:py-28"
      style={{
        background:
          'linear-gradient(180deg, #f0eef5 0%, #f7f6fa 100%)',
      }}
    >
      <div className="container">
        <SectionHeader
          eyebrow="کانال‌ها"
          title={CHANNELS.title}
          subtitle={CHANNELS.subtitle}
          align="center"
          className="!mb-14"
        />

        <ScrollReveal>
          <div className="mx-auto max-w-lg">
            <div className="flex flex-col items-center gap-0">
              {CHANNELS.channels.map((ch, i) => (
                <div key={ch.name} className="flex flex-col items-center w-full">
                  <div className="channel-node w-full max-w-xs rounded-xl border border-ink/10 bg-white px-5 py-3 text-center shadow-sm">
                    <p className="text-sm font-extrabold">{ch.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-0.5">فعال</p>
                  </div>
                  {i < CHANNELS.channels.length - 1 ? (
                    <div className="channel-arrow my-1 text-primary/40 text-lg" aria-hidden>
                      ↓
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="channel-hub w-full max-w-sm rounded-2xl border-2 border-primary bg-gradient-to-b from-primary to-secondary px-6 py-5 text-center text-white shadow-xl shadow-primary/25 my-2">
                <p className="text-xs font-black tracking-widest opacity-80">مرکز</p>
                <p className="text-xl font-black mt-1">{CHANNELS.hub}</p>
              </div>

              <div className="channel-arrow my-2 text-primary/40 text-lg" aria-hidden>
                ↓
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {CHANNELS.outputs.map((out) => (
                  <span
                    key={out}
                    className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink/70 shadow-sm"
                  >
                    {out}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
