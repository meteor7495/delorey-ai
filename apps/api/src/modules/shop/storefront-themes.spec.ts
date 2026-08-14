import { describe, expect, it } from 'vitest';
import {
  isStorefrontThemeId,
  resolveStorefrontThemeId,
  STOREFRONT_THEMES,
} from './storefront-themes';

describe('storefront themes', () => {
  it('keeps six named packs including the current classic look', () => {
    expect(STOREFRONT_THEMES.map((t) => t.id)).toEqual([
      'zi-home',
      'regal',
      'customme',
      'icenter',
      'noir',
      'exclusive',
    ]);
  });

  it('rejects unknown ids and falls back without touching shop data', () => {
    expect(isStorefrontThemeId('regal')).toBe(true);
    expect(isStorefrontThemeId('shopify')).toBe(false);
    expect(resolveStorefrontThemeId('missing')).toBe('zi-home');
    expect(resolveStorefrontThemeId(null)).toBe('zi-home');
  });
});
