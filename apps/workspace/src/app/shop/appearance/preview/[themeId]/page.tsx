'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toastFromError } from '@/lib/notify';
import { api } from '@/shared/api';
import { ThemePreview } from '@/components/shop/themes/theme-preview';
import type { ShopTheme } from '@/components/shop/themes/theme-gallery.utils';

export default function ThemePreviewPage() {
  const params = useParams<{ themeId: string }>();
  const router = useRouter();
  const [themes, setThemes] = useState<ShopTheme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState('zi-home');
  const [storefrontUrl, setStorefrontUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listShopThemes(), api.shopSettings()])
      .then(([packs, settings]) => {
        setThemes(packs as ShopTheme[]);
        setActiveThemeId(String(settings.themeId ?? 'zi-home'));
        const url = String(settings.storefrontUrl ?? '');
        if (!url) {
          throw new Error('آدرس ویترین تنظیم نشده است');
        }
        setStorefrontUrl(url);
      })
      .catch((e) => {
        toastFromError(e);
        router.replace('/shop/appearance');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const theme = themes.find((t) => t.id === params.themeId);

  useEffect(() => {
    if (!loading && themes.length > 0 && !theme) {
      router.replace('/shop/appearance');
    }
  }, [loading, theme, themes.length, router]);

  if (loading || !theme || !storefrontUrl) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--text-3)]">
        در حال بارگذاری پیش‌نمایش…
      </div>
    );
  }

  return (
    <ThemePreview
      theme={theme}
      storefrontUrl={storefrontUrl}
      activeThemeId={activeThemeId}
    />
  );
}
