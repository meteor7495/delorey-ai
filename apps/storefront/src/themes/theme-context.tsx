'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { THEME_TOKENS } from '@/themes/tokens';

export function normalizeThemeId(themeId?: string | null) {
  return themeId && THEME_TOKENS[themeId] ? themeId : 'zi-home';
}

const StoreThemeContext = createContext('zi-home');

export function StoreThemeProvider({
  themeId,
  children,
}: {
  themeId?: string | null;
  children: ReactNode;
}) {
  return (
    <StoreThemeContext.Provider value={normalizeThemeId(themeId)}>
      {children}
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  return useContext(StoreThemeContext);
}

export function listingGridClass(theme: string) {
  switch (theme) {
    case 'regal':
      return 'grid grid-cols-2 lg:grid-cols-3 gap-8';
    case 'customme':
      return 'grid grid-cols-2 lg:grid-cols-3 gap-5';
    case 'icenter':
      return 'grid grid-cols-2 xl:grid-cols-4 gap-4';
    case 'noir':
      return 'grid grid-cols-1 sm:grid-cols-2 gap-10';
    case 'exclusive':
      return 'grid grid-cols-2 xl:grid-cols-3 gap-6';
    case 'rivo':
      return 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6';
    default:
      return 'grid grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6';
  }
}

export function hasListingSidebar(theme: string) {
  return theme === 'zi-home' || theme === 'exclusive' || theme === 'icenter';
}

export function hasCategoryTiles(theme: string) {
  return theme === 'zi-home' || theme === 'customme';
}

export function pdpLayout(theme: string): 'aside' | 'split' | 'stack' {
  if (theme === 'zi-home') return 'aside';
  if (theme === 'noir') return 'stack';
  return 'split';
}

export function pageTitleClass(theme: string) {
  switch (theme) {
    case 'regal':
      return 'text-[28px] lg:text-[36px] font-medium tracking-tight text-zh-ink';
    case 'noir':
      return 'text-[22px] lg:text-[28px] tracking-[0.18em] uppercase text-zh-ink';
    case 'exclusive':
      return 'text-[24px] font-semibold text-zh-ink';
    case 'customme':
      return 'text-[24px] lg:text-[32px] font-bold text-zh-ink';
    case 'rivo':
      return 'text-[32px] lg:text-[50px] font-medium text-zh-ink';
    default:
      return 'text-[20px] lg:text-[24px] text-zh-ink';
  }
}
