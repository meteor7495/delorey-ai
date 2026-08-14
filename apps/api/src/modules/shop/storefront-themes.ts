export const STOREFRONT_THEME_IDS = [
  'zi-home',
  'regal',
  'customme',
  'icenter',
  'noir',
  'exclusive',
] as const;

export type StorefrontThemeId = (typeof STOREFRONT_THEME_IDS)[number];

export type StorefrontThemeLayout =
  | 'classic'
  | 'editorial'
  | 'playful'
  | 'tech'
  | 'dark'
  | 'marketplace';

export type StorefrontThemeMeta = {
  id: StorefrontThemeId;
  name: string;
  description: string;
  layout: StorefrontThemeLayout;
  defaults: { primaryColor: string; secondaryColor: string };
  swatches: { bg: string; fg: string; accent: string };
};

export const STOREFRONT_THEMES: StorefrontThemeMeta[] = [
  {
    id: 'zi-home',
    name: 'زی‌هوم',
    description: 'ویترین فعلی — بنر تمام‌عرض و پیشنهاد شگفت‌انگیز',
    layout: 'classic',
    defaults: { primaryColor: '#9b59b6', secondaryColor: '#292c2d' },
    swatches: { bg: '#ffffff', fg: '#292c2d', accent: '#9b59b6' },
  },
  {
    id: 'regal',
    name: 'ریگال',
    description: 'فروشگاه لباس زنانه — کرم، طلایی، چیدمان مجله‌ای',
    layout: 'editorial',
    defaults: { primaryColor: '#b0894d', secondaryColor: '#2c2118' },
    swatches: { bg: '#f7f3ee', fg: '#1c1410', accent: '#b0894d' },
  },
  {
    id: 'customme',
    name: 'کاستومی',
    description: 'آنلاین‌شاپ روشن با دکمهٔ فیروزه‌ای و قهرمان کلاژ',
    layout: 'playful',
    defaults: { primaryColor: '#1aa6a0', secondaryColor: '#1a1a2e' },
    swatches: { bg: '#ffffff', fg: '#1a1a2e', accent: '#1aa6a0' },
  },
  {
    id: 'icenter',
    name: 'آی‌سنتر',
    description: 'فروشگاه تجهیزات — پس‌زمینه تیره و طلایی',
    layout: 'tech',
    defaults: { primaryColor: '#f5c400', secondaryColor: '#0e1520' },
    swatches: { bg: '#0e1520', fg: '#e8edf5', accent: '#f5c400' },
  },
  {
    id: 'noir',
    name: 'نوآر',
    description: 'مد تیره — مشکی، سفید، فضای مینیمال',
    layout: 'dark',
    defaults: { primaryColor: '#c9a227', secondaryColor: '#050505' },
    swatches: { bg: '#050505', fg: '#f5f5f5', accent: '#c9a227' },
  },
  {
    id: 'exclusive',
    name: 'اکسکلوسیو',
    description: 'بازار عمومی — نوار اعلان، دسته در کنار بنر',
    layout: 'marketplace',
    defaults: { primaryColor: '#db4444', secondaryColor: '#000000' },
    swatches: { bg: '#ffffff', fg: '#000000', accent: '#db4444' },
  },
];

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
