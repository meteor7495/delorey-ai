import { describe, expect, it } from 'vitest';
import {
  filterStorefrontThemes,
  isStorefrontThemeId,
  resolveStorefrontThemeId,
  STOREFRONT_THEMES,
} from './storefront-themes';

describe('storefront themes', () => {
  it('keeps seven named packs including the current classic look', () => {
    expect(STOREFRONT_THEMES.map((t) => t.id)).toEqual([
      'zi-home',
      'regal',
      'customme',
      'icenter',
      'noir',
      'exclusive',
      'rivo',
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

  it('filters themes by search query and category', () => {
    const fashion = filterStorefrontThemes(STOREFRONT_THEMES, {
      category: 'fashion',
    });
    expect(fashion.map((t) => t.id)).toEqual(['regal', 'rivo']);

    const tech = filterStorefrontThemes(STOREFRONT_THEMES, { query: 'تکنولوژی' });
    expect(tech.map((t) => t.id)).toEqual(['icenter']);

    const sorted = filterStorefrontThemes(STOREFRONT_THEMES, { sort: 'name' });
    expect(sorted[0]?.name.localeCompare(sorted[1]?.name ?? '', 'fa')).toBeLessThanOrEqual(
      0,
    );
  });
});
