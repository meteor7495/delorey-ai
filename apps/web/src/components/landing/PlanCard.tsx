import Link from 'next/link';
import type { Plan } from '@/lib/api';

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`plan-card ${plan.featured ? 'plan-card--featured lg:-mt-2 lg:mb-2' : ''}`}
    >
      {plan.featured ? (
        <span className="mb-4 inline-flex w-fit rounded-lg bg-primary px-2.5 py-1 text-[11px] font-black text-white">
          {plan.category === 'site'
            ? 'پیشنهادی برای اکثر فروشگاه‌ها'
            : 'پیشنهاد دستیار هوشمند'}
        </span>
      ) : (
        <span className="mb-4 inline-flex h-[26px]" aria-hidden />
      )}
      <h3 className="text-xl font-extrabold">{plan.name}</h3>
      <p
        className={`mt-1 text-sm leading-6 ${
          plan.featured ? 'text-white/65' : 'text-ink/55'
        }`}
      >
        {plan.blurb}
      </p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
        <span
          className={`text-sm ${plan.featured ? 'text-white/50' : 'text-ink/45'}`}
        >
          {plan.unit}
        </span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-black ${
                plan.featured
                  ? 'bg-white/15 text-white'
                  : 'bg-primary-soft text-primary-text'
              }`}
            >
              ✓
            </span>
            <span className={plan.featured ? 'text-white/85' : 'text-ink/70'}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={`/request?plan=${plan.id}`}
        className={`btn mt-8 w-full ${
          plan.featured ? 'btn-primary' : 'btn-soft'
        }`}
      >
        {plan.cta}
      </Link>
    </article>
  );
}
