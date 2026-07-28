import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({ title, value, description, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="rounded-lg bg-[var(--surface)] border border-[var(--border-color)] p-5 shadow-[var(--sh-sm)] transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-4)]">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tnum tracking-tight text-[var(--text-1)]">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-[var(--text-3)]">{description}</p>
          )}
          {trend && (
            <p className={cn('mt-1 text-xs font-medium', trend.value >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBg ?? 'bg-[var(--brand-50)]')}>
          <Icon className={cn('h-5 w-5', iconColor ?? 'text-[var(--brand-500)]')} />
        </div>
      </div>
    </div>
  );
}
