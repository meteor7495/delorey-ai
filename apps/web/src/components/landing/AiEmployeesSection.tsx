'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AI_EMPLOYEES, CTAS } from '@/lib/landing-content';
import { ScrollReveal } from './ScrollReveal';
import { SectionHeader } from './SectionHeader';

export function AiEmployeesSection() {
  const [activeId, setActiveId] = useState(AI_EMPLOYEES[0]!.id);
  const active = AI_EMPLOYEES.find((e) => e.id === activeId) ?? AI_EMPLOYEES[0]!;

  return (
    <section id="ai-employees" className="section-anchor py-20 sm:py-28 bg-white">
      <div className="container">
        <SectionHeader
          eyebrow="دستیارهای هوشمند"
          title="تیم هوشمند تخصصی برای هر بخش کسب‌وکار"
          subtitle="هر دستیار نقش مشخصی دارد — روی داده واقعی فروشگاه شما کار می‌کند."
        />

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {AI_EMPLOYEES.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => setActiveId(emp.id)}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                activeId === emp.id
                  ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                  : 'border-ink/10 bg-sand/50 text-ink/65 hover:border-primary/25'
              }`}
            >
              {emp.name}
            </button>
          ))}
        </div>

        <ScrollReveal>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <p
                className="text-xs font-black tracking-wide mb-2"
                style={{ color: active.color }}
              >
                {active.role}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black mb-4">{active.name}</h3>
              <p className="text-ink/65 leading-8 mb-6">{active.description}</p>

              <div className="rounded-xl border border-ink/8 bg-sand/60 p-4 mb-4">
                <p className="text-xs font-black text-ink/40 mb-2">نمونه تسک</p>
                <p className="text-sm font-bold text-ink/75">{active.task}</p>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-text text-[11px] font-black">
                  ↑
                </span>
                <p className="text-sm text-ink/60">
                  <span className="font-bold text-ink/80">تأثیر: </span>
                  {active.impact}
                </p>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-[1.75rem] border border-ink/8 p-6 sm:p-8 min-h-[280px]"
              style={{
                background: `linear-gradient(145deg, ${active.color}12 0%, #fff 60%)`,
              }}
            >
              <div className="absolute top-4 start-4 flex items-center gap-2">
                <span className="status-dot" />
                <span className="text-xs font-bold text-ink/50">فعال · داده نمایشی</span>
              </div>
              <div className="mt-10 space-y-3">
                <div className="max-w-[85%] rounded-2xl rounded-se-md bg-ink/5 px-4 py-3 text-sm leading-7">
                  {active.task.replace(/[«»]/g, '')}
                </div>
                <div
                  className="ms-auto max-w-[88%] rounded-2xl rounded-ss-md px-4 py-3 text-sm leading-7 text-white shadow-lg"
                  style={{ background: `linear-gradient(to left, ${active.color}, #3b6cb5)` }}
                >
                  {active.id === 'sales'
                    ? 'بله، موجود است. می‌خواهید لینک سفارش بفرستم؟'
                    : active.id === 'support'
                      ? 'ارسال به شهرستان ۳ تا ۵ روز کاری طول می‌کشد.'
                      : active.id === 'product'
                        ? 'کرم آبرسان X و سرم Y برای پوست خشک عالی‌اند.'
                        : active.id === 'commerce'
                          ? 'سفارش ثبت شد — پیام تأیید برای مشتری ارسال شد.'
                          : active.id === 'marketing'
                            ? 'پیشنهاد تخفیف ۱۰٪ برای ۳ مشتری آماده ارسال است.'
                            : 'موجودی کم — اطلاع به مدیر فروشگاه ارسال شد.'}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100} className="mt-12 text-center">
          <Link href={CTAS.primary.href} className="btn btn-primary">
            {CTAS.primary.label}
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
