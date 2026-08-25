'use client';

import type { StoreSettings } from '@/themes/types';
import type { StorefrontThemeId } from './preview-types';

const PREVIEW_KEY = 'seloma_theme_preview';

export type ThemePreviewState = {
  active: boolean;
  themeId: StorefrontThemeId;
};

export function readPreviewFromUrl(): ThemePreviewState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const preview = params.get('preview');
  const theme = params.get('theme');
  if (preview !== '1' || !theme || !isKnownPreviewTheme(theme)) return null;
  return { active: true, themeId: theme };
}

export function persistPreviewState(state: ThemePreviewState | null) {
  if (typeof window === 'undefined') return;
  if (!state?.active) {
    sessionStorage.removeItem(PREVIEW_KEY);
    return;
  }
  sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(state));
}

export function readPersistedPreview(): ThemePreviewState | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PREVIEW_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ThemePreviewState;
    if (parsed?.active && parsed.themeId) return parsed;
  } catch {
    sessionStorage.removeItem(PREVIEW_KEY);
  }
  return null;
}

export function clearPreviewState() {
  persistPreviewState(null);
}

export function initPreviewFromUrl(): ThemePreviewState | null {
  const fromUrl = readPreviewFromUrl();
  if (fromUrl) {
    persistPreviewState(fromUrl);
    return fromUrl;
  }
  return readPersistedPreview();
}

export type PreviewThemeDefaults = {
  primaryColor: string;
  secondaryColor: string;
};

export function applyPreviewToSettings(
  settings: StoreSettings,
  preview: ThemePreviewState | null,
  themeDefaults?: PreviewThemeDefaults | null,
): StoreSettings {
  if (!preview?.active || !themeDefaults) return settings;
  return {
    ...settings,
    themeId: preview.themeId,
    primaryColor: themeDefaults.primaryColor,
    secondaryColor: themeDefaults.secondaryColor,
  };
}

export const PREVIEW_THEME_DEFAULTS: Record<
  StorefrontThemeId,
  PreviewThemeDefaults
> = {
  'zi-home': { primaryColor: '#9b59b6', secondaryColor: '#292c2d' },
  regal: { primaryColor: '#b0894d', secondaryColor: '#2c2118' },
  customme: { primaryColor: '#1aa6a0', secondaryColor: '#1a1a2e' },
  icenter: { primaryColor: '#f5c400', secondaryColor: '#0e1520' },
  noir: { primaryColor: '#c9a227', secondaryColor: '#050505' },
  exclusive: { primaryColor: '#db4444', secondaryColor: '#000000' },
  rivo: { primaryColor: '#224f34', secondaryColor: '#224f34' },
  freebie: { primaryColor: '#000000', secondaryColor: '#000000' },
};

export function isKnownPreviewTheme(
  themeId: string,
): themeId is StorefrontThemeId {
  return themeId in PREVIEW_THEME_DEFAULTS;
}
