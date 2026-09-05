'use client';

import Link from 'next/link';
import { CTAS, PRODUCT_SHOWCASE } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function ProductShowcaseSection() {
  return (
    <section id="product" className="section-anchor py-20 sm:py-28 bg-[#16131e] text-white overflow-hidden">
      <div className="container">
        <SectionHeader
          eyebrow="محصول"
          title={PRODUCT_SHOWCASE.title}
          subtitle={PRODUCT_SHOWCASE.subtitle}
          align="center"
          className="!text-white [&_p:last-child]:!text-white/60"
        />

        <ScrollReveal>
          <div className="relative mx-auto max-w-4xl">
            {PRODUCT_SHOWCASE.floatingCards.map((card, i) => (
              <div
                key={card.text}
                className={`floating-card floating-card--${card.type} absolute z-10 hidden sm:block`}
                style={{
                  top: i % 2 === 0 ? `${12 + i * 8}%` : 'auto',
                  bottom: i % 2 === 1 ? `${8 + i * 6}%` : 'auto',
                  insetInlineStart: i % 2 === 0 ? '-8%' : 'auto',
                  insetInlineEnd: i % 2 === 1 ? '-6%' : 'auto',
                  animationDelay: `${i * 400}ms`,
                }}
              >
                {card.text}
              </div>
            ))}

            <div className="relative rounded-[1.75rem] border border-white/12 bg-[#1a1625] shadow-[0_40px_100px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-xs font-black">
                    S
                  </span>
                  <span className="text-sm font-bold">پنل سِلوما</span>
                </div>
                <span className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-bold text-white/50">
                  {PRODUCT_SHOWCASE.demoLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-px bg-white/5 sm:grid-cols-4">
                {PRODUCT_SHOWCASE.stats.map((stat) => (
                  <div key={stat.label} className="bg-[#1a1625] px-4 py-4 text-center">
                    <p className="text-2xl font-black text-white">{stat.value}</p>
                    <p className="text-[11px] font-bold text-white/45 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-px bg-white/5 sm:grid-cols-3">
                <div className="bg-[#1a1625] p-4 sm:col-span-2">
                  <p className="text-xs font-black text-white/40 mb-3">گفتگوهای فعال</p>
                  <div className="space-y-2">
                    {['وب — سایز M موجوده؟', 'تلگرام — ارسال چقدر طول می‌کشه؟', 'بله — لینک سفارش'].map(
                      (msg) => (
                        <div
                          key={msg}
                          className="rounded-lg bg-white/5 px-3 py-2 text-xs text-white/70"
                        >
                          {msg}
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div className="bg-[#1a1625] p-4">
                  <p className="text-xs font-black text-white/40 mb-3">دستیارهای هوشمند</p>
                  <div className="space-y-2">
                    {['دستیار فروش · فعال', 'دستیار پشتیبانی · فعال', 'مشاور محصول · فعال'].map((e) => (
                      <div key={e} className="flex items-center gap-2 text-xs text-white/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 p-4 grid sm:grid-cols-3 gap-2">
                {['سفارشات', 'محصولات', 'خودکارسازی'].map((tab, i) => (
                  <div
                    key={tab}
                    className={`rounded-lg px-3 py-2 text-xs font-bold text-center ${
                      i === 0 ? 'bg-primary/20 text-white' : 'bg-white/5 text-white/50'
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150} className="mt-12 text-center">
          <Link href={CTAS.primary.href} className="btn btn-primary">
            {CTAS.primary.label}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
