export const STOREFRONT_THEME_IDS = [
  'zi-home',
  'regal',
  'customme',
  'icenter',
  'noir',
  'exclusive',
  'rivo',
] as const;

export type StorefrontThemeId = (typeof STOREFRONT_THEME_IDS)[number];

export type StorefrontThemeLayout =
  | 'classic'
  | 'editorial'
  | 'playful'
  | 'tech'
  | 'dark'
  | 'marketplace';

export type StorefrontThemeCategory =
  | 'general'
  | 'fashion'
  | 'electronics'
  | 'minimal'
  | 'luxury'
  | 'modern'
  | 'classic'
  | 'marketplace';

export type StorefrontThemeSort = 'recommended' | 'newest' | 'name';

export type StorefrontThemeMeta = {
  id: StorefrontThemeId;
  name: string;
  description: string;
  layout: StorefrontThemeLayout;
  category: StorefrontThemeCategory;
  tags: string[];
  previewImage: string;
  mobilePreviewImage?: string;
  capabilities: { desktop: boolean; mobile: boolean };
  sortOrder: number;
  defaults: { primaryColor: string; secondaryColor: string };
  swatches: { bg: string; fg: string; accent: string };
};

export const STOREFRONT_THEMES: StorefrontThemeMeta[] = [
  {
    id: 'zi-home',
    name: 'زی‌هوم',
    description: 'ویترین فعلی — بنر تمام‌عرض و پیشنهاد شگفت‌انگیز',
    layout: 'classic',
    category: 'general',
    tags: ['کلاسیک', 'عمومی', 'بنر'],
    previewImage: '/theme-previews/zi-home.svg',
    mobilePreviewImage: '/theme-previews/zi-home-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 0,
    defaults: { primaryColor: '#9b59b6', secondaryColor: '#292c2d' },
    swatches: { bg: '#ffffff', fg: '#292c2d', accent: '#9b59b6' },
  },
  {
    id: 'regal',
    name: 'ریگال',
    description: 'فروشگاه لباس زنانه — کرم، طلایی، چیدمان مجله‌ای',
    layout: 'editorial',
    category: 'fashion',
    tags: ['مد', 'لوکس', 'مجله‌ای'],
    previewImage: '/theme-previews/regal.svg',
    mobilePreviewImage: '/theme-previews/regal-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 1,
    defaults: { primaryColor: '#b0894d', secondaryColor: '#2c2118' },
    swatches: { bg: '#f7f3ee', fg: '#1c1410', accent: '#b0894d' },
  },
  {
    id: 'customme',
    name: 'کاستومی',
    description: 'آنلاین‌شاپ روشن با دکمهٔ فیروزه‌ای و قهرمان کلاژ',
    layout: 'playful',
    category: 'modern',
    tags: ['مدرن', 'روشن', 'پرانرژی'],
    previewImage: '/theme-previews/customme.svg',
    mobilePreviewImage: '/theme-previews/customme-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 2,
    defaults: { primaryColor: '#1aa6a0', secondaryColor: '#1a1a2e' },
    swatches: { bg: '#ffffff', fg: '#1a1a2e', accent: '#1aa6a0' },
  },
  {
    id: 'icenter',
    name: 'آی‌سنتر',
    description: 'فروشگاه تجهیزات — پس‌زمینه تیره و طلایی',
    layout: 'tech',
    category: 'electronics',
    tags: ['تکنولوژی', 'تیره', 'طلایی'],
    previewImage: '/theme-previews/icenter.svg',
    mobilePreviewImage: '/theme-previews/icenter-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 3,
    defaults: { primaryColor: '#f5c400', secondaryColor: '#0e1520' },
    swatches: { bg: '#0e1520', fg: '#e8edf5', accent: '#f5c400' },
  },
  {
    id: 'noir',
    name: 'نوآر',
    description: 'مد تیره — مشکی، سفید، فضای مینیمال',
    layout: 'dark',
    category: 'minimal',
    tags: ['مینیمال', 'تیره', 'مد'],
    previewImage: '/theme-previews/noir.svg',
    mobilePreviewImage: '/theme-previews/noir-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 4,
    defaults: { primaryColor: '#c9a227', secondaryColor: '#050505' },
    swatches: { bg: '#050505', fg: '#f5f5f5', accent: '#c9a227' },
  },
  {
    id: 'exclusive',
    name: 'اکسکلوسیو',
    description: 'بازار عمومی — نوار اعلان، دسته در کنار بنر',
    layout: 'marketplace',
    category: 'marketplace',
    tags: ['بازار', 'چنددسته', 'پرومو'],
    previewImage: '/theme-previews/exclusive.svg',
    mobilePreviewImage: '/theme-previews/exclusive-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 5,
    defaults: { primaryColor: '#db4444', secondaryColor: '#000000' },
    swatches: { bg: '#ffffff', fg: '#000000', accent: '#db4444' },
  },
  {
    id: 'rivo',
    name: 'ریوو',
    description: 'فشن سبز — قهرمان دوبخشی، کارت‌های پرتره و پیشنهاد اختصاصی',
    layout: 'editorial',
    category: 'fashion',
    tags: ['مد', 'فشن', 'سبز', 'مجله‌ای'],
    previewImage: '/theme-previews/rivo.svg',
    mobilePreviewImage: '/theme-previews/rivo-mobile.svg',
    capabilities: { desktop: true, mobile: true },
    sortOrder: 6,
    defaults: { primaryColor: '#224f34', secondaryColor: '#224f34' },
    swatches: { bg: '#ffffff', fg: '#224f34', accent: '#c2efd4' },
  },
];

export type FilterStorefrontThemesOptions = {
  query?: string;
  category?: StorefrontThemeCategory | 'all';
  sort?: StorefrontThemeSort;
};

export function isStorefrontThemeId(value: string): value is StorefrontThemeId {
  return (STOREFRONT_THEME_IDS as readonly string[]).includes(value);
}

export function resolveStorefrontThemeId(
  value?: string | null,
): StorefrontThemeId {
  if (value && isStorefrontThemeId(value)) return value;
  return 'zi-home';
}

export function getStorefrontTheme(id?: string | null): StorefrontThemeMeta {
  const resolved = resolveStorefrontThemeId(id);
  return STOREFRONT_THEMES.find((t) => t.id === resolved) ?? STOREFRONT_THEMES[0]!;
}

export function filterStorefrontThemes(
  themes: StorefrontThemeMeta[],
  options: FilterStorefrontThemesOptions = {},
): StorefrontThemeMeta[] {
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

export const STOREFRONT_THEME_CATEGORIES: Array<{
  id: StorefrontThemeCategory | 'all';
  label: string;
}> = [
  { id: 'all', label: 'همه' },
  { id: 'fashion', label: 'مد و پوشاک' },
  { id: 'electronics', label: 'الکترونیک' },
  { id: 'minimal', label: 'مینیمال' },
  { id: 'luxury', label: 'لوکس' },
  { id: 'modern', label: 'مدرن' },
  { id: 'classic', label: 'کلاسیک' },
  { id: 'marketplace', label: 'بازار' },
  { id: 'general', label: 'عمومی' },
];
