import {
  AI_EMPLOYEE_PLANS,
  SITE_BUILDER_PLANS,
} from '@/lib/api';
import { PlanCard } from './PlanCard';
import { SectionHeader } from './SectionHeader';

export function PricingSection() {
  return (
    <section id="pricing" className="section-anchor py-20 sm:py-28">
      <div className="container">
        <SectionHeader
          eyebrow="تعرفه‌ها"
          title="پلن مناسب کسب‌وکار خود را انتخاب کنید"
          subtitle="سایت‌ساز با تعرفه سالیانه شفاف. دستیار هوشمند با هماهنگی متناسب با نیاز شما."
        />

        <div id="pricing-site" className="section-anchor mb-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-wide text-primary-text mb-2">
                ۰۱ — سایت‌ساز و فروشگاه
              </p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                تعرفه سالیانه ویترین فروشگاهی
              </h3>
              <p className="mt-2 text-ink/55 leading-7 max-w-xl">
                هزینه شفاف برای راه‌اندازی و نگهداری فروشگاه آنلاین — آماده برای دستیار هوشمند.
              </p>
            </div>
            <span className="rounded-xl bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-text">
              پرداخت سالیانه
            </span>
          </div>
          <div className="grid gap-5 items-stretch lg:grid-cols-3">
            {SITE_BUILDER_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>

        <div
          id="pricing-ai"
          className="section-anchor rounded-[1.75rem] border border-ink/8 bg-sand/70 p-6 sm:p-10"
        >
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-wide text-primary-text mb-2">
                ۰۲ — دستیارهای هوشمند
              </p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                تعرفه با هماهنگی
              </h3>
              <p className="mt-2 text-ink/55 leading-7 max-w-xl">
                قیمت نهایی بر اساس نیاز فروشگاه، کانال‌ها و حجم گفتگو تعیین می‌شود.
              </p>
            </div>
            <span className="rounded-xl bg-ink/8 px-3 py-1.5 text-xs font-bold text-ink/70">
              قیمت توافقی
            </span>
          </div>
          <div className="grid gap-5 items-stretch md:grid-cols-2">
            {AI_EMPLOYEE_PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
