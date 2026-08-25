'use client';

import { Check, Eye, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { THEME_CATEGORY_LABELS } from '../theme-gallery.utils';
import type { ThemeRecommendationRow } from './constants';
import type { ShopTheme } from '../theme-gallery.utils';

type ThemeRecommendResultsProps = {
  recommendations: ThemeRecommendationRow[];
  activeThemeId: string;
  savingThemeId: string | null;
  onPreview: (themeId: string) => void;
  onSelect: (theme: ShopTheme) => void | Promise<void>;
  onBrowseAll: () => void;
  onEditAnswers: () => void;
};

export function ThemeRecommendResults({
  recommendations,
  activeThemeId,
  savingThemeId,
  onPreview,
  onSelect,
  onBrowseAll,
  onEditAnswers,
}: ThemeRecommendResultsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-500)]/10 text-[var(--brand-500)]">
          <Sparkles className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold text-[var(--text-1)]">
          تم‌های مناسب شما
        </h2>
        <p className="mx-auto max-w-xl text-sm text-[var(--text-3)]">
          بر اساس پاسخ‌های شما، این تم‌ها بهترین تطبیق را با فروشگاهتان دارند.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {recommendations.map((row, index) => {
          const selected = activeThemeId === row.theme.id;
          const saving = savingThemeId === row.theme.id;
          const categoryLabel =
            THEME_CATEGORY_LABELS[row.theme.category] ?? row.theme.category;
          return (
            <article
              key={row.theme.id}
              className={`flex flex-col overflow-hidden rounded-xl border bg-[var(--surface-1)] ${
                index === 0
                  ? 'border-[var(--brand-500)] ring-2 ring-[var(--brand-500)]/20'
                  : 'border-[var(--line-1,#e5e7eb)]'
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-2)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.theme.previewImage}
                  alt={`پیش‌نمایش ${row.theme.name}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute start-3 top-3">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    #{index + 1} · {Math.round(row.score)}٪
                  </Badge>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                  <h3 className="font-semibold text-[var(--text-1)]">
                    {row.theme.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--brand-500)]">
                    ★ {row.matchLabel} — {Math.round(row.score)}٪
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{categoryLabel}</Badge>
                    {row.theme.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {row.reasons.length > 0 ? (
                  <div className="rounded-lg bg-[var(--surface-2)] p-3">
                    <p className="mb-2 text-xs font-medium text-[var(--text-2)]">
                      چرا پیشنهاد می‌کنیم
                    </p>
                    <ul className="space-y-1.5">
                      {row.reasons.map((reason) => (
                        <li
                          key={reason}
                          className="flex items-start gap-2 text-xs text-[var(--text-3)]"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--success)]"
                            aria-hidden
                          />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onPreview(row.theme.id)}
                  >
                    <Eye className="ms-1 h-4 w-4" aria-hidden />
                    پیش‌نمایش
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    disabled={selected || saving}
                    onClick={() => onSelect(row.theme as ShopTheme)}
                  >
                    {saving ? (
                      <>
                        <Loader2
                          className="ms-1 h-4 w-4 animate-spin"
                          aria-hidden
                        />
                        ذخیره…
                      </>
                    ) : selected ? (
                      'انتخاب شده'
                    ) : (
                      'استفاده از این تم'
                    )}
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" onClick={onEditAnswers}>
          ویرایش پاسخ‌ها
        </Button>
        <Button type="button" variant="outline" onClick={onBrowseAll}>
          مشاهده همه تم‌ها
        </Button>
      </div>
    </div>
  );
}
