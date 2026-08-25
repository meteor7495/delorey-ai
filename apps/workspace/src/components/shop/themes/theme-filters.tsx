'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  THEME_CATEGORY_LABELS,
  THEME_SORT_LABELS,
  type ThemeCategoryFilter,
  type ThemeSort,
} from './theme-gallery.utils';

type ThemeFiltersProps = {
  query: string;
  category: ThemeCategoryFilter;
  sort: ThemeSort;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: ThemeCategoryFilter) => void;
  onSortChange: (value: ThemeSort) => void;
};

const CATEGORY_OPTIONS: ThemeCategoryFilter[] = [
  'all',
  'fashion',
  'electronics',
  'minimal',
  'modern',
  'marketplace',
  'general',
];

export function ThemeFilters({
  query,
  category,
  sort,
  onQueryChange,
  onCategoryChange,
  onSortChange,
}: ThemeFiltersProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="theme-search">جستجو</Label>
        <Input
          id="theme-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="نام، دسته یا برچسب تم…"
          aria-label="جستجوی تم"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="theme-category">دسته</Label>
        <select
          id="theme-category"
          value={category}
          onChange={(e) =>
            onCategoryChange(e.target.value as ThemeCategoryFilter)
          }
          className="flex h-10 w-full min-w-[160px] rounded-md border border-[var(--border-color)] bg-background px-3 text-sm"
          aria-label="فیلتر دسته تم"
        >
          {CATEGORY_OPTIONS.map((id) => (
            <option key={id} value={id}>
              {THEME_CATEGORY_LABELS[id] ?? id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="theme-sort">مرتب‌سازی</Label>
        <select
          id="theme-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ThemeSort)}
          className="flex h-10 w-full min-w-[140px] rounded-md border border-[var(--border-color)] bg-background px-3 text-sm"
          aria-label="مرتب‌سازی تم‌ها"
        >
          {(Object.keys(THEME_SORT_LABELS) as ThemeSort[]).map((key) => (
            <option key={key} value={key}>
              {THEME_SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
