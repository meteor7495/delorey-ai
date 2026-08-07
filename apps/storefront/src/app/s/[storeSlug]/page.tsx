'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { api } from '@/lib/api';

export default function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [data, setData] = useState<{
    settings: {
      storeName: string;
      storeSlug: string;
      primaryColor: string;
      secondaryColor: string;
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
    categories: Array<{ id: string; name: string; slug: string }>;
    featured: ProductCardData[];
    widget: {
      publicKey: string;
      apiBase: string;
      widgetBase: string;
    } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ storeSlug: slug }) => {
      setStoreSlug(slug);
      api
        .storefrontHome(slug)
        .then((raw) =>
          setData({
            settings: raw.settings as typeof data extends null
              ? never
              : NonNullable<typeof data>['settings'],
            banners: (raw.banners as NonNullable<typeof data>['banners']) ?? [],
            categories:
              (raw.categories as NonNullable<typeof data>['categories']) ?? [],
            featured: (raw.featured as ProductCardData[]) ?? [],
            widget: (raw.widget as NonNullable<typeof data>['widget']) ?? null,
          }),
        )
        .catch((e) => setError(String(e)));
    });
  }, [params]);

  if (error) {
    return (
      <main className="container py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-[var(--muted)]">
          اسلاگ را از Workspace → تنظیمات فروشگاه بررسی کنید.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="container py-16 text-center text-[var(--muted)]">
        در حال بارگذاری فروشگاه…
      </main>
    );
  }

  const hero = data.banners[0];

  return (
    <StoreShell settings={data.settings} widget={data.widget}>
      <section className="container pt-5 space-y-6">
        <div
          className="relative overflow-hidden rounded-2xl min-h-[180px] sm:min-h-[240px] flex items-end p-6 text-white fade-up"
          style={{
            background: hero?.imageUrl
              ? `linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.55)), url(${hero.imageUrl}) center/cover`
              : `linear-gradient(135deg, ${data.settings.primaryColor}, #1a1a1a)`,
          }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              {hero?.title || data.settings.storeName}
            </h1>
            <p className="mt-2 text-white/85 max-w-xl">
              {hero?.subtitle || data.settings.tagline || 'خرید آسان با پشتیبانی هوشمند'}
            </p>
            <Link
              href={hero?.href || `/s/${storeSlug}/products`}
              className="btn btn-brand mt-4 inline-flex"
            >
              مشاهده محصولات
            </Link>
          </div>
        </div>

        {data.categories.length > 0 && (
          <div className="fade-up">
            <h2 className="font-extrabold mb-3">دسته‌ها</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/s/${storeSlug}/products?category=${c.slug}`}
                  className="shrink-0 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:border-[var(--brand)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-extrabold">منتخب</h2>
            <Link
              href={`/s/${storeSlug}/products`}
              className="text-sm font-semibold text-[var(--brand)]"
            >
              همه
            </Link>
          </div>
          <div className="product-grid">
            {data.featured.map((p) => (
              <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
            ))}
          </div>
          {data.featured.length === 0 && (
            <p className="text-sm text-[var(--muted)] py-8 text-center">
              هنوز محصول منتشرشده‌ای نیست. از CMS محصول اضافه کنید.
            </p>
          )}
        </div>
      </section>
    </StoreShell>
  );
}
