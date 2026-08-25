'use client';

import { cn } from '@/lib/utils';

type ThemeRecommendProgressProps = {
  current: number;
  total: number;
};

export function ThemeRecommendProgress({
  current,
  total,
}: ThemeRecommendProgressProps) {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`مرحله ${current} از ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const active = step <= current;
        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition',
                active
                  ? 'bg-[var(--brand-500)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-3)]',
              )}
            >
              {step}
            </span>
            {step < total ? (
              <span
                className={cn(
                  'hidden h-0.5 w-8 sm:block',
                  step < current
                    ? 'bg-[var(--brand-500)]'
                    : 'bg-[var(--line-1,#e5e7eb)]',
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
