'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  MobileTabBar,
  ThemeFooter,
  ThemeHeader,
} from '@/themes/ThemeChrome';
import { PreviewBanner, PreviewProvider } from '@/themes/preview-context';
import { StoreThemeProvider } from '@/themes/theme-context';
import { applyThemeTokens } from '@/themes/tokens';
import type { StoreSettings } from '@/themes/types';
import {
  applyPreviewToSettings,
  initPreviewFromUrl,
  PREVIEW_THEME_DEFAULTS,
  type ThemePreviewState,
} from '@/lib/preview-mode';

export type { StoreSettings };

type Widget = {
  publicKey: string;
  apiBase: string;
  widgetBase: string;
} | null;

type Category = { id: string; name: string; slug: string; imageUrl?: string | null };

export function StoreShell({
  settings,
  widget,
  categories = [],
  children,
}: {
  settings: StoreSettings;
  widget?: Widget;
  categories?: Category[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [preview, setPreview] = useState<ThemePreviewState | null>(null);

  useEffect(() => {
    setPreview(initPreviewFromUrl());
  }, [pathname]);

  const effectiveSettings = useMemo(() => {
    const defaults = preview?.themeId
      ? PREVIEW_THEME_DEFAULTS[preview.themeId]
      : null;
    return applyPreviewToSettings(settings, preview, defaults);
  }, [preview, settings]);

  const base = `/s/${effectiveSettings.storeSlug}`;
  const [q, setQ] = useState('');
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    applyThemeTokens(effectiveSettings.themeId, effectiveSettings.primaryColor);
  }, [effectiveSettings.themeId, effectiveSettings.primaryColor]);

  useEffect(() => {
    if (preview?.active || !widget?.publicKey || !widget.widgetBase) return;
    if (
      document.querySelector(
        'script[data-seloma-embed], script[data-delorey-embed]',
      )
    ) {
      return;
    }
    const script = document.createElement('script');
    script.src = `${widget.widgetBase}/embed.js`;
    script.async = true;
    script.dataset.selomaEmbed = '1';
    script.dataset.publicKey = widget.publicKey;
    script.dataset.apiBase = widget.apiBase;
    document.body.appendChild(script);
  }, [preview?.active, widget]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query
        ? `${base}/products?q=${encodeURIComponent(query)}`
        : `${base}/products`,
    );
  }

  return (
    <PreviewProvider
      isPreview={Boolean(preview?.active)}
      previewThemeId={preview?.themeId ?? null}
    >
      <StoreThemeProvider themeId={effectiveSettings.themeId}>
        <div className="min-h-[100dvh] flex flex-col bg-zh-bg text-zh-800">
          <PreviewBanner />
          <ThemeHeader
            settings={effectiveSettings}
            base={base}
            pathname={pathname}
            categories={categories}
            q={q}
            setQ={setQ}
            catOpen={catOpen}
            setCatOpen={setCatOpen}
            onSearch={onSearch}
          />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <MobileTabBar base={base} pathname={pathname} />
          <ThemeFooter
            settings={effectiveSettings}
            base={base}
            categories={categories}
          />
        </div>
      </StoreThemeProvider>
    </PreviewProvider>
  );
}
