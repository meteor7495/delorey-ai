import { describe, expect, it } from 'vitest';
import {
  filterStorefrontThemes,
  isStorefrontThemeId,
  resolveStorefrontThemeId,
  STOREFRONT_THEMES,
} from './storefront-themes';

describe('storefront themes', () => {
  it('keeps eight named packs including the current classic look', () => {
    expect(STOREFRONT_THEMES.map((t) => t.id)).toEqual([
      'zi-home',
      'regal',
      'customme',
      'icenter',
      'noir',
      'exclusive',
      'rivo',
      'freebie',
    ]);
  });

  it('rejects unknown ids and falls back without touching shop data', () => {
    expect(isStorefrontThemeId('regal')).toBe(true);
    expect(isStorefrontThemeId('shopify')).toBe(false);
    expect(resolveStorefrontThemeId('missing')).toBe('zi-home');
    expect(resolveStorefrontThemeId(null)).toBe('zi-home');
  });

  it('includes gallery metadata for every theme pack', () => {
    for (const theme of STOREFRONT_THEMES) {
      expect(theme.previewImage).toMatch(/^\/theme-previews\/.+\.svg$/);
      expect(theme.tags.length).toBeGreaterThan(0);
      expect(theme.capabilities.desktop).toBe(true);
      expect(theme.capabilities.mobile).toBe(true);
      expect(theme.industries.length).toBeGreaterThan(0);
      expect(theme.styles.length).toBeGreaterThan(0);
      expect(theme.audiences.length).toBeGreaterThan(0);
      expect(theme.priorities.length).toBeGreaterThan(0);
      expect(theme.recommendationWeight).toBeGreaterThanOrEqual(0);
      expect(theme.recommendationWeight).toBeLessThanOrEqual(5);
    }
  });

  it('registers the rivo fashion theme with preview assets', () => {
    const rivo = STOREFRONT_THEMES.find((t) => t.id === 'rivo');
    expect(rivo).toBeDefined();
    expect(rivo?.category).toBe('fashion');
    expect(rivo?.previewImage).toBe('/theme-previews/rivo.svg');
    expect(rivo?.mobilePreviewImage).toBe('/theme-previews/rivo-mobile.svg');
    expect(isStorefrontThemeId('rivo')).toBe(true);
  });

  it('registers the freebie clothes theme with preview assets', () => {
    const freebie = STOREFRONT_THEMES.find((t) => t.id === 'freebie');
    expect(freebie).toBeDefined();
    expect(freebie?.name).toBe('فری‌بی');
    expect(freebie?.category).toBe('fashion');
    expect(freebie?.previewImage).toBe('/theme-previews/freebie.svg');
    expect(freebie?.mobilePreviewImage).toBe('/theme-previews/freebie-mobile.svg');
    expect(freebie?.defaults.primaryColor).toBe('#000000');
    expect(isStorefrontThemeId('freebie')).toBe(true);
  });

  it('filters themes by search query and category', () => {
    const fashion = filterStorefrontThemes(STOREFRONT_THEMES, {
      category: 'fashion',
    });
    expect(fashion.map((t) => t.id)).toEqual(['regal', 'rivo', 'freebie']);

    const tech = filterStorefrontThemes(STOREFRONT_THEMES, { query: 'تکنولوژی' });
    expect(tech.map((t) => t.id)).toEqual(['icenter']);

    const sorted = filterStorefrontThemes(STOREFRONT_THEMES, { sort: 'name' });
    expect(sorted[0]?.name.localeCompare(sorted[1]?.name ?? '', 'fa')).toBeLessThanOrEqual(
      0,
    );
  });
});
