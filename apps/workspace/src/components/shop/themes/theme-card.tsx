'use client';

import { Check, Eye, Loader2, Monitor, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { THEME_CATEGORY_LABELS } from './theme-gallery.utils';
import type { ShopTheme } from './theme-gallery.utils';

type ThemeCardProps = {
  theme: ShopTheme;
  selected: boolean;
  saving: boolean;
  onPreview: (themeId: string) => void;
  onSelect: (theme: ShopTheme) => void;
};

export function ThemeCard({
  theme,
  selected,
  saving,
  onPreview,
  onSelect,
}: ThemeCardProps) {
  const categoryLabel =
    THEME_CATEGORY_LABELS[theme.category] ?? theme.category;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-xl border bg-[var(--surface-1)] transition hover:shadow-md ${
        selected
          ? 'border-[var(--brand-500)] ring-2 ring-[var(--brand-500)]/30'
          : 'border-[var(--line-1,#e5e7eb)] hover:border-[var(--brand-400)]'
      }`}
      aria-current={selected ? 'true' : undefined}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={theme.previewImage}
          alt={`پیش‌نمایش ${theme.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        {selected ? (
          <div className="absolute start-3 top-3">
            <Badge variant="success" className="gap-1 shadow-sm">
              <Check className="h-3 w-3" aria-hidden />
              تم فعلی
            </Badge>
          </div>
        ) : null}
        <div className="absolute bottom-3 end-3 flex gap-1">
          {theme.capabilities.desktop ? (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
              title="پشتیبانی دسکتاپ"
            >
              <Monitor className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">دسکتاپ</span>
            </span>
          ) : null}
          {theme.capabilities.mobile ? (
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
              title="پشتیبانی موبایل"
            >
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">موبایل</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-semibold text-[var(--text-1)]">{theme.name}</h3>
          <p className="mt-1 text-xs text-[var(--text-3)]">{theme.description}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{categoryLabel}</Badge>
            {theme.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreview(theme.id)}
            aria-label={`پیش‌نمایش ${theme.name}`}
          >
            <Eye className="ms-1 h-4 w-4" aria-hidden />
            پیش‌نمایش
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            disabled={selected || saving}
            onClick={() => onSelect(theme)}
            aria-label={
              selected ? `${theme.name} تم فعلی است` : `انتخاب ${theme.name}`
            }
          >
            {saving ? (
              <>
                <Loader2 className="ms-1 h-4 w-4 animate-spin" aria-hidden />
                در حال ذخیره…
              </>
            ) : selected ? (
              'انتخاب شده'
            ) : (
              'انتخاب'
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
