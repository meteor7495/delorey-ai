'use client';

import { useEffect, useMemo, useState } from 'react';
import { StoreShell } from '@/components/StoreShell';
import type { ProductCardData } from '@/components/ProductCard';
import { HomeByTheme } from '@/themes/HomeByTheme';
import { api } from '@/lib/api';

type HomeData = {
  settings: {
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    themeId?: string | null;
    logoUrl?: string | null;
    tagline?: string | null;
    supportPhone?: string | null;
  };
  banners: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    href: string | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  featured: ProductCardData[];
  articles?: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    publishedAt: string | null;
  }>;
  widget: {
    publicKey: string;
    apiBase: string;
    widgetBase: string;
  } | null;
};

function useCountdown(hours = 18) {
  const end = useMemo(() => Date.now() + hours * 3600_000, [hours]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { h, m, s };
}

export default function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const countdown = useCountdown(18);

  useEffect(() => {
    params.then(({ storeSlug: slug }) => {
      setStoreSlug(slug);
      api
        .storefrontHome(slug)
        .then((raw) =>
          setData({
            settings: raw.settings as HomeData['settings'],
            banners: (raw.banners as HomeData['banners']) ?? [],
            categories: (raw.categories as HomeData['categories']) ?? [],
            featured: (raw.featured as ProductCardData[]) ?? [],
            articles:
              (raw.articles as HomeData['articles']) ?? [],
            widget: (raw.widget as HomeData['widget']) ?? null,
          }),
        )
        .catch((e) => setError(String(e)));
    });
  }, [params]);

  const slides =
    data && data.banners.length > 0
      ? data.banners
      : [
          {
            id: 'fallback',
            title: data?.settings.storeName ?? 'فروشگاه',
            subtitle: data?.settings.tagline ?? null,
            imageUrl: '/figma/hero.jpg',
            href: null as string | null,
          },
        ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (error) {
    return (
      <main className="dk-container py-20 text-center">
        <p className="text-zh-pink mb-3 text-[14px] font-semibold">{error}</p>
        <p className="text-zh-600 text-[14px]">
          اسلاگ فروشگاه را از Workspace → تنظیمات بررسی کنید.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="dk-container py-24 text-center text-zh-600 text-[14px]">
        در حال بارگذاری فروشگاه…
      </main>
    );
  }

  return (
    <StoreShell
      settings={data.settings}
      widget={data.widget}
      categories={data.categories}
    >
      <HomeByTheme
        storeSlug={storeSlug}
        settings={data.settings}
        banners={data.banners}
        categories={data.categories}
        featured={data.featured}
        articles={data.articles}
        slides={slides}
        slide={slide}
        setSlide={setSlide}
        countdown={countdown}
      />
    </StoreShell>
  );
}
