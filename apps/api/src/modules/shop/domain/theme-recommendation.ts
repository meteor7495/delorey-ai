/**
 * Deterministic storefront theme recommendation.
 *
 * Flow today:
 *   preferences → scoreTheme → top N + match reasons
 *
 * Future AI layer can enrich preferences / re-rank before scoring
 * without replacing this matcher.
 */

export const THEME_INDUSTRIES = [
  'fashion',
  'beauty',
  'electronics',
  'home',
  'jewelry',
  'kids',
  'food',
  'sports',
  'general',
] as const;

export type ThemeIndustry = (typeof THEME_INDUSTRIES)[number];

export const THEME_STYLES = [
  'minimal',
  'modern',
  'luxury',
  'bold',
  'elegant',
  'colorful',
  'professional',
  'dark_premium',
] as const;

export type ThemeStyle = (typeof THEME_STYLES)[number];

export const THEME_AUDIENCES = [
  'young_trend',
  'families',
  'professionals',
  'premium',
  'general',
  'businesses',
] as const;

export type ThemeAudience = (typeof THEME_AUDIENCES)[number];

export const THEME_PRIORITIES = [
  'products',
  'visual_branding',
  'promotions',
  'categories',
  'fast_shopping',
  'premium_experience',
] as const;

export type ThemePriority = (typeof THEME_PRIORITIES)[number];

export const THEME_BRANDING_LEVELS = ['strong', 'somewhat', 'none'] as const;

export type ThemeBrandingLevel = (typeof THEME_BRANDING_LEVELS)[number];

export type ThemePreferences = {
  industries: ThemeIndustry[];
  styles: ThemeStyle[];
  audiences: ThemeAudience[];
  priorities: ThemePriority[];
  brandingLevel?: ThemeBrandingLevel;
};

export type ThemeRecommendationProfile = {
  industries: ThemeIndustry[];
  styles: ThemeStyle[];
  audiences: ThemeAudience[];
  priorities: ThemePriority[];
  /** 0–5 contribution toward the popularity bucket (max +5). */
  recommendationWeight: number;
};

export type ThemeScoreWeights = {
  industry: number;
  style: number;
  audience: number;
  priority: number;
  popularity: number;
};

export const DEFAULT_THEME_SCORE_WEIGHTS: ThemeScoreWeights = {
  industry: 40,
  style: 30,
  audience: 15,
  priority: 10,
  popularity: 5,
};

export type ThemeScoreBreakdown = {
  industry: number;
  style: number;
  audience: number;
  priority: number;
  popularity: number;
  total: number;
};

export type ScoredThemeRecommendation<T extends ThemeRecommendationProfile> = {
  theme: T;
  score: number;
  breakdown: ThemeScoreBreakdown;
  matched: {
    industries: ThemeIndustry[];
    styles: ThemeStyle[];
    audiences: ThemeAudience[];
    priorities: ThemePriority[];
  };
  reasons: string[];
  matchLabel: string;
};

const INDUSTRY_LABEL_FA: Record<ThemeIndustry, string> = {
  fashion: 'مد و پوشاک',
  beauty: 'زیبایی و آرایشی',
  electronics: 'الکترونیک',
  home: 'خانه و مبلمان',
  jewelry: 'جواهرات و اکسسوری',
  kids: 'کودک',
  food: 'خوراکی و نوشیدنی',
  sports: 'ورزش',
  general: 'عمومی',
};

const STYLE_LABEL_FA: Record<ThemeStyle, string> = {
  minimal: 'مینیمال و تمیز',
  modern: 'مدرن',
  luxury: 'لوکس',
  bold: 'جسور و پرانرژی',
  elegant: 'شیک',
  colorful: 'رنگارنگ و دوستانه',
  professional: 'حرفه‌ای',
  dark_premium: 'تیره و پرمیوم',
};

const AUDIENCE_LABEL_FA: Record<ThemeAudience, string> = {
  young_trend: 'جوان و ترند',
  families: 'خانواده‌ها',
  professionals: 'حرفه‌ای‌ها',
  premium: 'مشتریان پرمیوم',
  general: 'مخاطب عمومی',
  businesses: 'کسب‌وکارها',
};

const PRIORITY_LABEL_FA: Record<ThemePriority, string> = {
  products: 'محصولات',
  visual_branding: 'هویت بصری',
  promotions: 'پروموشن',
  categories: 'دسته‌بندی',
  fast_shopping: 'خرید سریع',
  premium_experience: 'تجربه پرمیوم',
};

const CATEGORY_INDUSTRY_HINTS: Array<{
  industry: ThemeIndustry;
  patterns: RegExp[];
}> = [
  {
    industry: 'fashion',
    patterns: [/مد/, /پوشاک/, /لباس/, /fashion/, /apparel/, /clothing/i],
  },
  {
    industry: 'beauty',
    patterns: [/زیبایی/, /آرایشی/, /بهداشتی/, /beauty/, /cosmetic/i],
  },
  {
    industry: 'electronics',
    patterns: [/الکترونیک/, /موبایل/, /لپ‌?تاپ/, /gadget/, /tech/i],
  },
  {
    industry: 'home',
    patterns: [/خانه/, /مبلمان/, /دکوراسیون/, /home/, /furniture/i],
  },
  {
    industry: 'jewelry',
    patterns: [/جواهر/, /اکسسوری/, /زیور/, /jewelry/, /accessories/i],
  },
  {
    industry: 'kids',
    patterns: [/کودک/, /نوزاد/, /بچگانه/, /kids/, /baby/i],
  },
  {
    industry: 'food',
    patterns: [/خوراک/, /غذا/, /نوشیدنی/, /food/, /beverage/i],
  },
  {
    industry: 'sports',
    patterns: [/ورزش/, /ورزشی/, /fitness/, /sport/i],
  },
];

export function isThemeIndustry(value: string): value is ThemeIndustry {
  return (THEME_INDUSTRIES as readonly string[]).includes(value);
}

export function isThemeStyle(value: string): value is ThemeStyle {
  return (THEME_STYLES as readonly string[]).includes(value);
}

export function isThemeAudience(value: string): value is ThemeAudience {
  return (THEME_AUDIENCES as readonly string[]).includes(value);
}

export function isThemePriority(value: string): value is ThemePriority {
  return (THEME_PRIORITIES as readonly string[]).includes(value);
}

export function isThemeBrandingLevel(value: string): value is ThemeBrandingLevel {
  return (THEME_BRANDING_LEVELS as readonly string[]).includes(value);
}

export function normalizeThemePreferences(input: {
  industries?: string[];
  styles?: string[];
  audiences?: string[];
  priorities?: string[];
  brandingLevel?: string | null;
}): ThemePreferences {
  return {
    industries: unique(
      (input.industries ?? []).filter(isThemeIndustry),
    ),
    styles: unique((input.styles ?? []).filter(isThemeStyle)),
    audiences: unique((input.audiences ?? []).filter(isThemeAudience)),
    priorities: unique((input.priorities ?? []).filter(isThemePriority)),
    brandingLevel:
      input.brandingLevel && isThemeBrandingLevel(input.brandingLevel)
        ? input.brandingLevel
        : undefined,
  };
}

/** Infer industries from merchant category names (Persian / English hints). */
export function inferIndustriesFromCategoryNames(
  names: string[],
): ThemeIndustry[] {
  const found = new Set<ThemeIndustry>();
  for (const raw of names) {
    const name = raw.trim();
    if (!name) continue;
    for (const hint of CATEGORY_INDUSTRY_HINTS) {
      if (hint.patterns.some((re) => re.test(name))) {
        found.add(hint.industry);
      }
    }
  }
  return [...found];
}

function overlapRatio(selected: string[], themeValues: string[]): number {
  if (selected.length === 0) return 0;
  const set = new Set(themeValues);
  const hits = selected.filter((v) => set.has(v)).length;
  return hits / selected.length;
}

function matchedValues<T extends string>(selected: T[], themeValues: T[]): T[] {
  const set = new Set(themeValues);
  return selected.filter((v) => set.has(v));
}

function clampScore(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.max(0, Math.min(max, value));
}

/**
 * Branding level lightly nudges visual / premium priorities when the merchant
 * has a strong brand (does not invent matches that are not on the theme).
 */
export function preferencesForScoring(
  preferences: ThemePreferences,
): ThemePreferences {
  if (preferences.brandingLevel !== 'strong') return preferences;
  const priorities = unique([
    ...preferences.priorities,
    'visual_branding' as ThemePriority,
    'premium_experience' as ThemePriority,
  ]);
  return { ...preferences, priorities };
}

export function scoreTheme<T extends ThemeRecommendationProfile>(
  theme: T,
  preferences: ThemePreferences,
  weights: ThemeScoreWeights = DEFAULT_THEME_SCORE_WEIGHTS,
): ThemeScoreBreakdown {
  const prefs = preferencesForScoring(preferences);
  const industry =
    prefs.industries.length === 0
      ? weights.industry * 0.35
      : weights.industry * overlapRatio(prefs.industries, theme.industries);
  const style =
    prefs.styles.length === 0
      ? weights.style * 0.35
      : weights.style * overlapRatio(prefs.styles, theme.styles);
  const audience =
    prefs.audiences.length === 0
      ? weights.audience * 0.35
      : weights.audience * overlapRatio(prefs.audiences, theme.audiences);
  const priority =
    prefs.priorities.length === 0
      ? weights.priority * 0.35
      : weights.priority * overlapRatio(prefs.priorities, theme.priorities);
  const popularity =
    (clampScore(theme.recommendationWeight, 5) / 5) * weights.popularity;

  const breakdown: ThemeScoreBreakdown = {
    industry: round1(clampScore(industry, weights.industry)),
    style: round1(clampScore(style, weights.style)),
    audience: round1(clampScore(audience, weights.audience)),
    priority: round1(clampScore(priority, weights.priority)),
    popularity: round1(clampScore(popularity, weights.popularity)),
    total: 0,
  };
  breakdown.total = round1(
    breakdown.industry +
      breakdown.style +
      breakdown.audience +
      breakdown.priority +
      breakdown.popularity,
  );
  return breakdown;
}

export function buildMatchReasons(
  matched: ScoredThemeRecommendation<ThemeRecommendationProfile>['matched'],
): string[] {
  const reasons: string[] = [];
  for (const industry of matched.industries) {
    reasons.push(`مناسب برای ${INDUSTRY_LABEL_FA[industry]}`);
  }
  for (const style of matched.styles) {
    reasons.push(`هم‌خوان با حس ${STYLE_LABEL_FA[style]}`);
  }
  for (const audience of matched.audiences) {
    reasons.push(`طراحی‌شده برای ${AUDIENCE_LABEL_FA[audience]}`);
  }
  for (const priority of matched.priorities) {
    reasons.push(`تمرکز روی ${PRIORITY_LABEL_FA[priority]}`);
  }
  return reasons.slice(0, 4);
}

export function matchLabelForScore(score: number): string {
  if (score >= 90) return 'بهترین تطبیق';
  if (score >= 80) return 'تطبیق عالی';
  if (score >= 70) return 'تطبیق خوب';
  return 'تطبیق قابل قبول';
}

export function recommendThemes<T extends ThemeRecommendationProfile>(
  themes: T[],
  preferences: ThemePreferences,
  options: {
    limit?: number;
    weights?: ThemeScoreWeights;
  } = {},
): ScoredThemeRecommendation<T>[] {
  const limit = options.limit ?? 3;
  const weights = options.weights ?? DEFAULT_THEME_SCORE_WEIGHTS;
  const prefs = preferencesForScoring(preferences);

  const scored = themes.map((theme) => {
    const breakdown = scoreTheme(theme, preferences, weights);
    const matched = {
      industries: matchedValues(prefs.industries, theme.industries),
      styles: matchedValues(prefs.styles, theme.styles),
      audiences: matchedValues(prefs.audiences, theme.audiences),
      priorities: matchedValues(prefs.priorities, theme.priorities),
    };
    return {
      theme,
      score: breakdown.total,
      breakdown,
      matched,
      reasons: buildMatchReasons(matched),
      matchLabel: matchLabelForScore(breakdown.total),
    };
  });

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.theme.recommendationWeight - a.theme.recommendationWeight;
    })
    .slice(0, limit);
}

export function industryLabelFa(id: ThemeIndustry): string {
  return INDUSTRY_LABEL_FA[id];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
