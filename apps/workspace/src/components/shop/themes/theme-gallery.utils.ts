export type ShopTheme = {
  id: string;
  name: string;
  description: string;
  layout: string;
  category: string;
  tags: string[];
  previewImage: string;
  mobilePreviewImage?: string;
  capabilities: { desktop: boolean; mobile: boolean };
  sortOrder: number;
  defaults: { primaryColor: string; secondaryColor: string };
  swatches: { bg: string; fg: string; accent: string };
};

export type ThemeCategoryFilter = ShopTheme['category'] | 'all';
export type ThemeSort = 'recommended' | 'newest' | 'name';

export function filterThemes(
  themes: ShopTheme[],
  options: {
    query?: string;
    category?: ThemeCategoryFilter;
    sort?: ThemeSort;
  } = {},
): ShopTheme[] {
  const q = options.query?.trim().toLowerCase() ?? '';
  const category = options.category ?? 'all';
  const sort = options.sort ?? 'recommended';

  let result = themes.filter((theme) => {
    if (category !== 'all' && theme.category !== category) return false;
    if (!q) return true;
    const haystack = [
      theme.name,
      theme.description,
      theme.category,
      theme.layout,
      ...theme.tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  result = [...result].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'fa');
    if (sort === 'newest') return b.sortOrder - a.sortOrder;
    return a.sortOrder - b.sortOrder;
  });

  return result;
}

export function buildStorefrontPreviewUrl(
  storefrontUrl: string,
  themeId: string,
): string {
  const url = new URL(storefrontUrl);
  url.searchParams.set('preview', '1');
  url.searchParams.set('theme', themeId);
  return url.toString();
}

export function deriveStorefrontBaseFromUrl(storefrontUrl: string): string {
  const url = new URL(storefrontUrl);
  return `${url.protocol}//${url.host}`;
}

export const THEME_CATEGORY_LABELS: Record<string, string> = {
  all: 'همه',
  fashion: 'مد و پوشاک',
  electronics: 'الکترونیک',
  minimal: 'مینیمال',
  luxury: 'لوکس',
  modern: 'مدرن',
  classic: 'کلاسیک',
  marketplace: 'بازار',
  general: 'عمومی',
};

export const THEME_SORT_LABELS: Record<ThemeSort, string> = {
  recommended: 'پیشنهادی',
  newest: 'جدیدترین',
  name: 'نام',
};
