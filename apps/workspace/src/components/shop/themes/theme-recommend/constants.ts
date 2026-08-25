export type ThemePreferencesDraft = {
  industries: string[];
  styles: string[];
  audiences: string[];
  priorities: string[];
  brandingLevel?: string;
};

export type ThemeRecommendStepId =
  | 'intro'
  | 'industry'
  | 'style'
  | 'audience'
  | 'priority'
  | 'branding'
  | 'results'
  | 'gallery';

export type ThemeRecommendationRow = {
  theme: {
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    previewImage: string;
    industries: string[];
    styles: string[];
    audiences: string[];
    priorities: string[];
    defaults: { primaryColor: string; secondaryColor: string };
    capabilities: { desktop: boolean; mobile: boolean };
  };
  score: number;
  matchLabel: string;
  reasons: string[];
};

export type ThemeOption = {
  id: string;
  label: string;
  hint?: string;
};

export const EMPTY_THEME_PREFERENCES: ThemePreferencesDraft = {
  industries: [],
  styles: [],
  audiences: [],
  priorities: [],
};

export const INDUSTRY_OPTIONS: ThemeOption[] = [
  { id: 'fashion', label: 'مد و پوشاک' },
  { id: 'beauty', label: 'زیبایی و آرایشی' },
  { id: 'electronics', label: 'الکترونیک' },
  { id: 'home', label: 'خانه و مبلمان' },
  { id: 'jewelry', label: 'جواهرات و اکسسوری' },
  { id: 'kids', label: 'کودک' },
  { id: 'food', label: 'خوراکی و نوشیدنی' },
  { id: 'sports', label: 'ورزش' },
  { id: 'general', label: 'عمومی / سایر' },
];

export const STYLE_OPTIONS: ThemeOption[] = [
  { id: 'minimal', label: 'مینیمال و تمیز' },
  { id: 'modern', label: 'مدرن' },
  { id: 'luxury', label: 'لوکس' },
  { id: 'bold', label: 'جسور و پرانرژی' },
  { id: 'elegant', label: 'شیک' },
  { id: 'colorful', label: 'رنگارنگ و دوستانه' },
  { id: 'professional', label: 'حرفه‌ای' },
  { id: 'dark_premium', label: 'تیره و پرمیوم' },
];

export const AUDIENCE_OPTIONS: ThemeOption[] = [
  { id: 'young_trend', label: 'جوان و ترند' },
  { id: 'families', label: 'خانواده‌ها' },
  { id: 'professionals', label: 'حرفه‌ای‌ها' },
  { id: 'premium', label: 'مشتریان پرمیوم' },
  { id: 'general', label: 'مخاطب عمومی' },
  { id: 'businesses', label: 'کسب‌وکارها' },
];

export const PRIORITY_OPTIONS: ThemeOption[] = [
  { id: 'products', label: 'محصولات' },
  { id: 'visual_branding', label: 'هویت بصری' },
  { id: 'promotions', label: 'پروموشن' },
  { id: 'categories', label: 'دسته‌بندی' },
  { id: 'fast_shopping', label: 'خرید سریع' },
  { id: 'premium_experience', label: 'تجربه پرمیوم' },
];

export const BRANDING_OPTIONS: ThemeOption[] = [
  { id: 'strong', label: 'بله، برند قوی دارم' },
  { id: 'somewhat', label: 'تا حدی' },
  { id: 'none', label: 'نه، سلوما پیشنهاد بدهد' },
];

export const THEME_RECOMMEND_STORAGE_KEY = 'seloma_theme_recommend_v1';
