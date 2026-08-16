'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  MobileTabBar,
  ThemeFooter,
  ThemeHeader,
} from '@/themes/ThemeChrome';
import { StoreThemeProvider } from '@/themes/theme-context';
import { applyThemeTokens } from '@/themes/tokens';
import type { StoreSettings } from '@/themes/types';

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
  const base = `/s/${settings.storeSlug}`;
  const [q, setQ] = useState('');
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    applyThemeTokens(settings.themeId, settings.primaryColor);
  }, [settings.themeId, settings.primaryColor]);

  useEffect(() => {
    if (!widget?.publicKey || !widget.widgetBase) return;
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
  }, [widget]);

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
    <StoreThemeProvider themeId={settings.themeId}>
      <div className="min-h-[100dvh] flex flex-col bg-zh-bg text-zh-800">
        <ThemeHeader
          settings={settings}
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
        <ThemeFooter settings={settings} base={base} categories={categories} />
      </div>
    </StoreThemeProvider>
  );
}
