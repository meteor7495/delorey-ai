import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 border-0 px-2 py-0.5 text-[11px] font-semibold leading-none transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[var(--brand-50)] text-[var(--color-primary-text)] rounded-full',
        secondary: 'bg-[var(--surface-3)] text-[var(--text-3)] rounded-full',
        destructive:'bg-[var(--danger-bg)] text-[var(--danger)] rounded-full',
        outline:   'border border-[var(--border-color)] text-[var(--text-3)] bg-transparent rounded-full',
        success:   'bg-[var(--success-bg)] text-[var(--success)] rounded-full',
        warning:   'bg-[var(--warning-bg)] text-[var(--warning)] rounded-full',
        info:      'bg-[var(--info-bg)] text-[var(--info)] rounded-full',
        ai:        'bg-[var(--brand-50)] text-[var(--color-primary-text)] border border-[var(--color-border-ai)] rounded-full',
        neutral:   'bg-[var(--neutral-status-bg)] text-[var(--neutral-status)] rounded-full',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
