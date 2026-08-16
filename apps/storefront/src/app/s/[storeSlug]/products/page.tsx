'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { api } from '@/lib/api';
import { useStoreSlug, useStorefrontChrome } from '@/lib/use-storefront';
import {
  hasCategoryTiles,
  hasListingSidebar,
  listingGridClass,
  pageTitleClass,
  useStoreTheme,
} from '@/themes/theme-context';

function ProductsInner({ storeSlug }: { storeSlug: string }) {
  const search = useSearchParams();
  const { settings, categories, error: chromeError } = useStorefrontChrome(storeSlug);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState(search.get('q') ?? '');
  const [inStockOnly, setInStockOnly] = useState(search.get('inStock') === '1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const category = search.get('category') ?? undefined;
    const query: Record<string, string> = {};
    if (q) query.q = q;
    if (category) query.category = category;
    if (inStockOnly) query.inStock = '1';
    api
      .storefrontProducts(storeSlug, query)
      .then((rows) => setProducts(rows as unknown as ProductCardData[]))
      .catch((e) => setError(String(e)));
  }, [storeSlug, q, inStockOnly, search]);

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {chromeError ?? error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <ListingBody
        storeSlug={storeSlug}
        storeName={settings.storeName}
        categories={categories}
        products={products}
        q={q}
        setQ={setQ}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        error={error}
        activeCategory={search.get('category')}
      />
    </StoreShell>
  );
}

function ListingBody({
  storeSlug,
  storeName,
  categories,
  products,
  q,
  setQ,
  inStockOnly,
  setInStockOnly,
  error,
  activeCategory,
}: {
  storeSlug: string;
  storeName: string;
  categories: Array<{ id: string; name: string; slug: string; imageUrl?: string | null }>;
  products: ProductCardData[];
  q: string;
  setQ: (v: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  error: string | null;
  activeCategory: string | null;
}) {
  const theme = useStoreTheme();
  const categoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || activeCategory
    : 'همه کالاها';
  const sidebar = hasListingSidebar(theme);
  const tiles = hasCategoryTiles(theme);

  return (
    <div className="dk-container py-6 lg:py-10">
      <div className="flex flex-col items-end gap-1 text-[14px] mb-8">
        <p className="text-zh-600">
          {storeName} / {categoryName}
        </p>
        <h1 className={pageTitleClass(theme)}>{categoryName}</h1>
      </div>

      {tiles && categories.length > 0 && (
        <div className="mb-8 flex gap-3 overflow-x-auto pb-1">
          <Link
            href={`/s/${storeSlug}/products`}
            className={`shrink-0 px-4 py-2 text-[13px] border ${
              !activeCategory
                ? 'border-zh-primary text-zh-primary bg-zh-primary-50'
                : 'border-zh-100'
            }`}
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            همه
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/s/${storeSlug}/products?category=${c.slug}`}
              className={`shrink-0 px-4 py-2 text-[13px] border ${
                activeCategory === c.slug
                  ? 'border-zh-primary text-zh-primary bg-zh-primary-50'
                  : 'border-zh-100'
              }`}
              style={{ borderRadius: 'var(--zh-radius)' }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className={sidebar ? 'grid gap-6 lg:grid-cols-[260px_1fr]' : ''}>
        {sidebar && (
          <aside className="hidden lg:block zh-card p-6 h-fit sticky top-[180px] space-y-5">
            <p className="text-[16px] text-zh-900 font-semibold">فیلترها</p>
            <label className="flex items-center justify-between gap-2 text-[14px] text-zh-800">
              فقط کالاهای موجود
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="size-5 accent-zh-primary"
              />
            </label>
            <div>
              <p className="text-[14px] text-zh-900 mb-2">دسته‌ها</p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={`/s/${storeSlug}/products`}
                    className={`block rounded-dk px-3 py-2 text-[14px] ${
                      !activeCategory
                        ? 'bg-zh-primary-50 text-zh-primary'
                        : 'hover:bg-zh-50'
                    }`}
                  >
                    همه
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/s/${storeSlug}/products?category=${c.slug}`}
                      className={`block rounded-dk px-3 py-2 text-[14px] ${
                        activeCategory === c.slug
                          ? 'bg-zh-primary-50 text-zh-primary'
                          : 'hover:bg-zh-50'
                      }`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-[14px] text-zh-600 tnum">
              {products.length.toLocaleString('fa-IR')} کالا
            </p>
            <div className="flex items-center gap-3">
              {!sidebar && (
                <label className="flex items-center gap-2 text-[13px] text-zh-700">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-zh-primary"
                  />
                  فقط موجود
                </label>
              )}
              <input
                className="min-w-[180px] max-w-md h-11 bg-zh-surface border border-zh-300 px-4 text-[14px] outline-none focus:border-zh-primary"
                style={{ borderRadius: 'var(--zh-radius)' }}
                placeholder="جستجو در نتایج…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-zh-pink text-[14px] mb-3 font-medium">{error}</p>
          )}

          <div className={listingGridClass(theme)}>
            {products.map((p) => (
              <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
            ))}
          </div>
          {products.length === 0 && (
            <p className="py-16 text-center text-zh-600 text-[14px]">
              کالایی یافت نشد
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const storeSlug = useStoreSlug(params);
  if (!storeSlug) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        در حال بارگذاری…
      </main>
    );
  }
  return (
    <Suspense
      fallback={
        <main className="dk-container py-20 text-center text-zh-600">
          در حال بارگذاری…
        </main>
      }
    >
      <ProductsInner storeSlug={storeSlug} />
    </Suspense>
  );
}
