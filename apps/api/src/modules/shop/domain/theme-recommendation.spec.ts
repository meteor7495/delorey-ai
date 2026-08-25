import { describe, expect, it } from 'vitest';
import {
  inferIndustriesFromCategoryNames,
  matchLabelForScore,
  normalizeThemePreferences,
  recommendThemes,
  scoreTheme,
} from './theme-recommendation';
import { STOREFRONT_THEMES } from '../storefront-themes';

describe('theme recommendation', () => {
  it('normalizes unknown preference values out', () => {
    const prefs = normalizeThemePreferences({
      industries: ['fashion', 'spaceships'],
      styles: ['luxury'],
      audiences: ['premium'],
      priorities: ['visual_branding', 'nope'],
      brandingLevel: 'strong',
    });
    expect(prefs.industries).toEqual(['fashion']);
    expect(prefs.priorities).toEqual(['visual_branding']);
    expect(prefs.brandingLevel).toBe('strong');
  });

  it('infers industries from category names', () => {
    expect(
      inferIndustriesFromCategoryNames(['پوشاک زنانه', 'موبایل و گجت']),
    ).toEqual(['fashion', 'electronics']);
  });

  it('scores luxury fashion preferences toward regal/noir/rivo', () => {
    const prefs = normalizeThemePreferences({
      industries: ['fashion'],
      styles: ['luxury', 'elegant'],
      audiences: ['premium'],
      priorities: ['visual_branding', 'premium_experience'],
    });

    const top = recommendThemes(STOREFRONT_THEMES, prefs, { limit: 3 });
    expect(top).toHaveLength(3);
    expect(top[0]!.score).toBeGreaterThanOrEqual(top[1]!.score);
    expect(top.map((r) => r.theme.id)).toEqual(
      expect.arrayContaining(['regal']),
    );
    expect(top[0]!.theme.id).toMatch(/regal|noir|rivo/);
    expect(top[0]!.reasons.length).toBeGreaterThan(0);
    expect(top[0]!.reasons.some((r) => r.includes('مد'))).toBe(true);
  });

  it('scores electronics / dark premium toward icenter', () => {
    const prefs = normalizeThemePreferences({
      industries: ['electronics'],
      styles: ['dark_premium', 'professional'],
      audiences: ['professionals'],
      priorities: ['products', 'categories'],
    });
    const top = recommendThemes(STOREFRONT_THEMES, prefs, { limit: 1 });
    expect(top[0]!.theme.id).toBe('icenter');
    expect(top[0]!.score).toBeGreaterThan(70);
  });

  it('is deterministic for the same inputs', () => {
    const prefs = normalizeThemePreferences({
      industries: ['general'],
      styles: ['modern'],
      audiences: ['general'],
      priorities: ['promotions'],
    });
    const a = recommendThemes(STOREFRONT_THEMES, prefs);
    const b = recommendThemes(STOREFRONT_THEMES, prefs);
    expect(a.map((r) => ({ id: r.theme.id, score: r.score }))).toEqual(
      b.map((r) => ({ id: r.theme.id, score: r.score })),
    );
  });

  it('keeps reasons tied to actual attribute matches', () => {
    const theme = STOREFRONT_THEMES.find((t) => t.id === 'regal')!;
    const prefs = normalizeThemePreferences({
      industries: ['fashion'],
      styles: ['luxury'],
      audiences: ['families'],
      priorities: ['fast_shopping'],
    });
    const breakdown = scoreTheme(theme, prefs);
    const [result] = recommendThemes([theme], prefs, { limit: 1 });
    expect(breakdown.total).toBe(result!.score);
    expect(result!.matched.industries).toEqual(['fashion']);
    expect(result!.matched.styles).toEqual(['luxury']);
    expect(result!.matched.audiences).toEqual([]);
    expect(result!.reasons.every((r) => !r.includes('خانواده'))).toBe(true);
  });

  it('labels high scores as best match', () => {
    expect(matchLabelForScore(94)).toBe('بهترین تطبیق');
    expect(matchLabelForScore(87)).toBe('تطبیق عالی');
    expect(matchLabelForScore(75)).toBe('تطبیق خوب');
  });
});
