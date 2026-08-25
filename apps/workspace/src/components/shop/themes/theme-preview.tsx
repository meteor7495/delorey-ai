'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Monitor, Smartphone, X } from 'lucide-react';
import { toastFromError, toastSuccess } from '@/lib/notify';
import { api } from '@/shared/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  buildStorefrontPreviewUrl,
  THEME_CATEGORY_LABELS,
  type ShopTheme,
} from './theme-gallery.utils';

type PreviewDevice = 'desktop' | 'mobile';

type ThemePreviewProps = {
  theme: ShopTheme;
  storefrontUrl: string;
  activeThemeId: string;
};

export function ThemePreview({
  theme,
  storefrontUrl,
  activeThemeId,
}: ThemePreviewProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const previewUrl = buildStorefrontPreviewUrl(storefrontUrl, theme.id);
  const isActive = activeThemeId === theme.id;

  const closePreview = useCallback(() => {
    router.push('/shop/appearance');
  }, [router]);

  useEffect(() => {
    setIframeLoading(true);
  }, [theme.id, device]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closePreview();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closePreview]);

  async function useTheme() {
    if (isActive || saving) return;
    setSaving(true);
    try {
      await api.updateShopSettings({
        themeId: theme.id,
        primaryColor: theme.defaults.primaryColor,
        secondaryColor: theme.defaults.secondaryColor,
      });
      toastSuccess('تم انتخاب و ذخیره شد');
      router.push('/shop/appearance');
    } catch (err) {
      toastFromError(err, 'انتخاب تم ناموفق بود');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--surface-1)]">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={closePreview}
          aria-label="بازگشت به گالری تم"
        >
          <ArrowRight className="ms-1 h-4 w-4" aria-hidden />
          بازگشت
        </Button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{theme.name}</h1>
          <p className="truncate text-xs text-[var(--text-3)]">
            {theme.description}
          </p>
        </div>

        <Badge variant="secondary">
          {THEME_CATEGORY_LABELS[theme.category] ?? theme.category}
        </Badge>

        <div
          className="inline-flex rounded-lg border p-1"
          role="group"
          aria-label="نوع نمایش پیش‌نمایش"
        >
          <Button
            type="button"
            size="sm"
            variant={device === 'desktop' ? 'default' : 'ghost'}
            onClick={() => setDevice('desktop')}
            aria-pressed={device === 'desktop'}
          >
            <Monitor className="ms-1 h-4 w-4" aria-hidden />
            دسکتاپ
          </Button>
          <Button
            type="button"
            size="sm"
            variant={device === 'mobile' ? 'default' : 'ghost'}
            onClick={() => setDevice('mobile')}
            aria-pressed={device === 'mobile'}
          >
            <Smartphone className="ms-1 h-4 w-4" aria-hidden />
            موبایل
          </Button>
        </div>

        <Button
          type="button"
          onClick={useTheme}
          disabled={isActive || saving}
          aria-label={isActive ? 'این تم فعال است' : 'استفاده از این تم'}
        >
          {saving ? (
            <>
              <Loader2 className="ms-1 h-4 w-4 animate-spin" aria-hidden />
              در حال ذخیره…
            </>
          ) : isActive ? (
            'تم فعلی'
          ) : (
            'استفاده از این تم'
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={closePreview}
          aria-label="بستن پیش‌نمایش"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="relative flex flex-1 items-start justify-center overflow-auto bg-[var(--surface-2)] p-3 sm:p-6">
        {iframeLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-2)]/80">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-500)]" />
            <span className="sr-only">در حال بارگذاری پیش‌نمایش…</span>
          </div>
        ) : null}

        <div
          className={`relative h-[calc(100dvh-88px)] transition-all ${
            device === 'mobile'
              ? 'w-[390px] max-w-full rounded-[2rem] border-[10px] border-black/90 shadow-2xl'
              : 'w-full max-w-[1280px] rounded-lg border shadow-lg'
          }`}
        >
          <iframe
            ref={iframeRef}
            key={`${theme.id}-${device}`}
            src={previewUrl}
            title={`پیش‌نمایش زنده ${theme.name}`}
            className="h-full w-full rounded-[inherit] bg-white"
            onLoad={() => setIframeLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>

      <footer className="shrink-0 border-t px-4 py-2 text-center text-xs text-[var(--text-3)] sm:px-6">
        پیش‌نمایش زنده با داده‌های فروشگاه شما — خرید و ثبت سفارش در این حالت
        غیرفعال است.{' '}
        <Link href="/shop/appearance" className="text-[var(--brand-500)]">
          بازگشت به گالری
        </Link>
      </footer>
    </div>
  );
}
