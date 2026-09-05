'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CTAS, HERO } from '@/lib/landing-content';

const EMPLOYEES = [
  { name: 'دستیار فروش', status: 'پاسخ به مشتری', active: true },
  { name: 'دستیار پشتیبانی', status: '۴۳ گفتگو', active: true },
  { name: 'مشاور محصول', status: '۱۸ پیشنهاد', active: true },
  { name: 'دستیار بازاریابی', status: '۳ سرنخ', active: false },
  { name: 'دستیار تجارت', status: '۲ سفارش', active: true },
];

const ACTIVITY = [
  { type: 'customer', text: 'این محصول برای پوست خشک مناسبه؟' },
  { type: 'ai', text: 'بله! کرم آبرسان X پیشنهاد می‌کنم — موجود است.' },
  { type: 'action', text: 'افزودن به سبد · ارسال لینک سفارش' },
];

export function HeroSection() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, []);

  const activeEmployee = tick % EMPLOYEES.length;

  return (
    <section className="relative min-h-[100dvh] overflow-hidden text-white">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 620px at 85% 0%, rgba(108,77,255,0.38), transparent 55%), radial-gradient(720px 520px at 0% 100%, rgba(59,108,181,0.22), transparent 50%), linear-gradient(168deg, #16111f 0%, #1a1625 46%, #2f4a73 125%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
        }}
        aria-hidden
      />
      <div
        className="absolute -start-28 top-16 h-[22rem] w-[22rem] rounded-full bg-primary/20 blur-3xl animate-drift"
        aria-hidden
      />

      <div className="relative container grid min-h-[100dvh] items-center gap-12 pt-24 pb-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        <div className="max-w-2xl">
          <p
            className="animate-fadeUp eyebrow !text-white/70 mb-4"
            style={{ animationDelay: '0ms' }}
          >
            {HERO.eyebrow}
          </p>
          <h1
            className="animate-fadeUp text-[2rem] sm:text-5xl lg:text-[3.2rem] font-black leading-[1.18] tracking-tight"
            style={{ animationDelay: '80ms' }}
          >
            {HERO.headline}
          </h1>
          <p
            className="animate-fadeUp mt-5 max-w-lg text-base sm:text-lg text-white/68 leading-8"
            style={{ animationDelay: '160ms' }}
          >
            {HERO.subheadline}
          </p>
          <div
            className="animate-fadeUp mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link href={CTAS.primary.href} className="btn btn-primary">
              {CTAS.primary.label}
            </Link>
            <a href={CTAS.secondary.href} className="btn btn-outline-light">
              {CTAS.secondary.label}
            </a>
          </div>
        </div>

        <div
          className="animate-fadeUp relative mx-auto w-full max-w-lg lg:max-w-none"
          style={{ animationDelay: '280ms' }}
        >
          <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/14 bg-[#0b171c]/82 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-white/70">
                <span className="status-dot" />
                پنل سِلوما
              </div>
              <span className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-bold text-white/55">
                داده نمایشی
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 sm:p-4">
              {EMPLOYEES.map((emp, i) => (
                <div
                  key={emp.name}
                  className={`rounded-xl border px-2.5 py-2 transition-all duration-500 ${
                    i === activeEmployee
                      ? 'border-primary/60 bg-primary/15 shadow-lg shadow-primary/10'
                      : 'border-white/8 bg-white/5'
                  }`}
                >
                  <p className="text-[11px] font-black text-white/90">{emp.name}</p>
                  <p className="mt-0.5 text-[10px] text-white/45">{emp.status}</p>
                  {emp.active ? (
                    <span className="mt-1 inline-block h-1 w-1 rounded-full bg-emerald-400" />
                  ) : (
                    <span className="mt-1 inline-block h-1 w-1 rounded-full bg-white/20" />
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2.5 border-t border-white/10 p-4 sm:p-5">
              {ACTIVITY.map((item) => (
                <div
                  key={item.text}
                  className={
                    item.type === 'customer'
                      ? 'max-w-[88%] rounded-2xl rounded-se-md bg-white/10 px-3.5 py-2.5 text-sm leading-7 text-white/88'
                      : item.type === 'ai'
                        ? 'ms-auto max-w-[90%] rounded-2xl rounded-ss-md bg-gradient-to-l from-primary to-secondary px-3.5 py-2.5 text-sm leading-7 text-white shadow-lg shadow-primary/20'
                        : 'flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200/90'
                  }
                >
                  {item.type === 'action' ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {item.text}
                    </>
                  ) : (
                    item.text
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
