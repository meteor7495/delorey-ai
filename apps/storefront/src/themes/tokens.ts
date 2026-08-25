export type ThemeTokens = {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  pink: string;
  warning: string;
  ink: string;
  900: string;
  800: string;
  700: string;
  600: string;
  500: string;
  400: string;
  300: string;
  200: string;
  100: string;
  50: string;
  bg: string;
  surface: string;
  radius: string;
};

const classic: ThemeTokens = {
  primary: '#9b59b6',
  primaryHover: '#7d3c98',
  primarySoft: '#f5eef8',
  pink: '#de6a95',
  warning: '#ec8514',
  ink: '#151617',
  900: '#292c2d',
  800: '#3e4344',
  700: '#52595a',
  600: '#676f71',
  500: '#858c8d',
  400: '#a4a9aa',
  300: '#c2c5c6',
  200: '#d1d4d4',
  100: '#e1e2e3',
  50: '#f0f1f1',
  bg: '#ffffff',
  surface: '#ffffff',
  radius: '8px',
};

export const THEME_TOKENS: Record<string, ThemeTokens> = {
  'zi-home': classic,
  regal: {
    primary: '#b0894d',
    primaryHover: '#8c6a38',
    primarySoft: '#f3ead8',
    pink: '#c4a574',
    warning: '#b0894d',
    ink: '#1c1410',
    900: '#2c2118',
    800: '#3d3228',
    700: '#5c4c3e',
    600: '#8a7a6c',
    500: '#a39486',
    400: '#c4b8ac',
    300: '#ddd4ca',
    200: '#ebe4dc',
    100: '#f3ece4',
    50: '#f7f3ee',
    bg: '#f7f3ee',
    surface: '#fffcf8',
    radius: '2px',
  },
  customme: {
    primary: '#1aa6a0',
    primaryHover: '#14847f',
    primarySoft: '#e6f7f6',
    pink: '#f472b6',
    warning: '#f59e0b',
    ink: '#1a1a2e',
    900: '#1a1a2e',
    800: '#2d2d44',
    700: '#45455f',
    600: '#5c5c78',
    500: '#7a7a94',
    400: '#a3a3b8',
    300: '#c9c9d6',
    200: '#e0e0ea',
    100: '#eef0f4',
    50: '#f6f7fb',
    bg: '#ffffff',
    surface: '#ffffff',
    radius: '16px',
  },
  icenter: {
    primary: '#f5c400',
    primaryHover: '#d4a800',
    primarySoft: '#3a3208',
    pink: '#f5c400',
    warning: '#f5c400',
    ink: '#f4f7fb',
    900: '#e8edf5',
    800: '#c5cedd',
    700: '#9aabc4',
    600: '#8b9bb4',
    500: '#6b7c96',
    400: '#4a5a73',
    300: '#2c3a52',
    200: '#1f2b40',
    100: '#172033',
    50: '#121a28',
    bg: '#0e1520',
    surface: '#172033',
    radius: '12px',
  },
  noir: {
    primary: '#c9a227',
    primaryHover: '#a8861c',
    primarySoft: '#2a240c',
    pink: '#c9a227',
    warning: '#c9a227',
    ink: '#f5f5f5',
    900: '#f5f5f5',
    800: '#e0e0e0',
    700: '#c2c2c2',
    600: '#9a9a9a',
    500: '#7a7a7a',
    400: '#5a5a5a',
    300: '#3a3a3a',
    200: '#242424',
    100: '#161616',
    50: '#0f0f0f',
    bg: '#050505',
    surface: '#111111',
    radius: '0px',
  },
  exclusive: {
    primary: '#db4444',
    primaryHover: '#b83838',
    primarySoft: '#fdecec',
    pink: '#db4444',
    warning: '#db4444',
    ink: '#000000',
    900: '#000000',
    800: '#1a1a1a',
    700: '#3a3a3a',
    600: '#7d8184',
    500: '#8f8f8f',
    400: '#b3b3b3',
    300: '#d1d1d1',
    200: '#e5e5e5',
    100: '#f0f0f0',
    50: '#f5f5f5',
    bg: '#ffffff',
    surface: '#ffffff',
    radius: '4px',
  },
  rivo: {
    primary: '#224f34',
    primaryHover: '#1a3d28',
    primarySoft: '#c2efd4',
    pink: '#a3f3be',
    warning: '#224f34',
    ink: '#224f34',
    900: '#224f34',
    800: '#224f34',
    700: '#3d6b52',
    600: '#6f6f6f',
    500: '#8a8a8a',
    400: '#a8a8a8',
    300: '#c2efd4',
    200: '#dffbea',
    100: '#eef9f2',
    50: '#f7fcf9',
    bg: '#ffffff',
    surface: '#ffffff',
    radius: '3px',
  },
};

export function resolveThemeTokens(themeId?: string | null): ThemeTokens {
  return THEME_TOKENS[themeId ?? ''] ?? classic;
}

export function applyThemeTokens(
  themeId: string | null | undefined,
  brandPrimary?: string | null,
) {
  if (typeof document === 'undefined') return;
  const tokens = resolveThemeTokens(themeId);
  const primary = brandPrimary?.trim() || tokens.primary;
  const root = document.documentElement;
  root.setAttribute('data-store-theme', themeId && THEME_TOKENS[themeId] ? themeId : 'zi-home');
  const map: Record<string, string> = {
    '--zh-primary': primary,
    '--zh-primary-hover': tokens.primaryHover,
    '--zh-primary-50': tokens.primarySoft,
    '--zh-pink': tokens.pink,
    '--zh-warning': tokens.warning,
    '--zh-ink': tokens.ink,
    '--zh-900': tokens[900],
    '--zh-800': tokens[800],
    '--zh-700': tokens[700],
    '--zh-600': tokens[600],
    '--zh-500': tokens[500],
    '--zh-400': tokens[400],
    '--zh-300': tokens[300],
    '--zh-200': tokens[200],
    '--zh-100': tokens[100],
    '--zh-50': tokens[50],
    '--zh-bg': tokens.bg,
    '--zh-surface': tokens.surface,
    '--zh-radius': tokens.radius,
    '--brand': primary,
    '--dk-red': primary,
    '--dk-red-deep': tokens.primaryHover,
    '--dk-navy': tokens[900],
    '--dk-text': tokens[800],
    '--dk-muted': tokens[600],
    '--dk-hint': tokens[400],
    '--dk-line': tokens[100],
    '--dk-bg': tokens[50],
    '--dk-surface': tokens.surface,
    '--dk-search': tokens[50],
    '--dk-rating': tokens.warning,
  };
  for (const [key, value] of Object.entries(map)) {
    root.style.setProperty(key, value);
  }
  document.body.style.background = tokens.bg;
  document.body.style.color = tokens[800];
}
