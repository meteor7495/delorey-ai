'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Briefcase,
  CircuitBoard,
  Gem,
  Home,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  SunMedium,
  Utensils,
  Dumbbell,
  Users,
  Crown,
  Zap,
  Eye,
  LayoutGrid,
  Gauge,
  Star,
  Moon,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThemeOption } from './constants';

const OPTION_ICONS: Record<string, LucideIcon> = {
  fashion: Shirt,
  beauty: Sparkles,
  electronics: CircuitBoard,
  home: Home,
  jewelry: Gem,
  kids: Baby,
  food: Utensils,
  sports: Dumbbell,
  general: ShoppingBag,
  minimal: SunMedium,
  modern: Zap,
  luxury: Crown,
  bold: Palette,
  elegant: Star,
  colorful: Palette,
  professional: Briefcase,
  dark_premium: Moon,
  young_trend: Zap,
  families: Users,
  professionals: Briefcase,
  premium: Crown,
  businesses: Building2,
  products: ShoppingBag,
  visual_branding: Eye,
  promotions: Zap,
  categories: LayoutGrid,
  fast_shopping: Gauge,
  premium_experience: Crown,
  strong: Crown,
  somewhat: Star,
  none: Sparkles,
};

type ThemeOptionGridProps = {
  options: ThemeOption[];
  selected: string[];
  multi?: boolean;
  onToggle: (id: string) => void;
};

export function ThemeOptionGrid({
  options,
  selected,
  multi = true,
  onToggle,
}: ThemeOptionGridProps) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      role="group"
      aria-label="گزینه‌ها"
    >
      {options.map((option) => {
        const active = selected.includes(option.id);
        const Icon = OPTION_ICONS[option.id] ?? ShoppingBag;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            aria-pressed={active}
            className={cn(
              'flex min-h-[96px] flex-col items-start gap-3 rounded-xl border p-4 text-start transition',
              active
                ? 'border-[var(--brand-500)] bg-[var(--brand-500)]/5 ring-2 ring-[var(--brand-500)]/25'
                : 'border-[var(--line-1,#e5e7eb)] bg-[var(--surface-1)] hover:border-[var(--brand-400)]',
            )}
          >
            <span
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-lg',
                active
                  ? 'bg-[var(--brand-500)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)]',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-medium text-[var(--text-1)]">
              {option.label}
            </span>
            {option.hint ? (
              <span className="text-xs text-[var(--text-3)]">{option.hint}</span>
            ) : null}
            {!multi && active ? (
              <span className="text-xs text-[var(--brand-500)]">انتخاب شده</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
