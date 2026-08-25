'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeCard } from './theme-card';
import { ThemeFilters } from './theme-filters';
import {
  filterThemes,
  type ShopTheme,
  type ThemeCategoryFilter,
  type ThemeSort,
} from './theme-gallery.utils';

type ThemeGalleryProps = {
  themes: ShopTheme[];
  activeThemeId: string;
  savingThemeId: string | null;
  onSelectTheme: (theme: ShopTheme) => void | Promise<void>;
};

export function ThemeGallery({
  themes,
  activeThemeId,
  savingThemeId,
  onSelectTheme,
}: ThemeGalleryProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ThemeCategoryFilter>('all');
  const [sort, setSort] = useState<ThemeSort>('recommended');

  const filtered = useMemo(
    () => filterThemes(themes, { query, category, sort }),
    [themes, query, category, sort],
  );

  function openPreview(themeId: string) {
    router.push(`/shop/appearance/preview/${themeId}`);
  }

  return (
    <div className="space-y-4">
      <ThemeFilters
        query={query}
        category={category}
        sort={sort}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onSortChange={setSort}
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-[var(--text-3)]">
          تمی با این فیلتر پیدا نشد.
        </p>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          role="list"
          aria-label="گالری تم‌ها"
        >
          {filtered.map((theme) => (
            <div key={theme.id} role="listitem">
              <ThemeCard
                theme={theme}
                selected={activeThemeId === theme.id}
                saving={savingThemeId === theme.id}
                onPreview={openPreview}
                onSelect={onSelectTheme}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
