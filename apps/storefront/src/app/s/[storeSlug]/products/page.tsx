'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { api } from '@/lib/api';

function ProductsInner({ storeSlug }: { storeSlug: string }) {
  const search = useSearchParams();
  const [settings, setSettings] = useState<{
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    tagline?: string | null;
    supportPhone?: string | null;
  } | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string; imageUrl?: string | null }>
  >([]);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState(search.get('q') ?? '');
  const [inStockOnly, setInStockOnly] = useState(search.get('inStock') === '1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .storefrontHome(storeSlug)
      .then((home) => {
        setSettings(home.settings as NonNullable<typeof settings>);
        setCategories(
          (home.categories as Array<{
            id: string;
            name: string;
            slug: string;
            imageUrl?: string | null;
          }>) ?? [],
        );
      })
      .catch((e) => setError(String(e)));
  }, [storeSlug]);

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
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  const activeCategory = search.get('category');
  const categoryName = activeCategory
    ? categories.find((c) => c.slug === activeCategory)?.name || activeCategory
    : 'همه کالاها';

  return (
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-6 lg:py-8">
        <div className="flex flex-col items-end gap-1 text-[14px] mb-6">
          <p className="text-zh-600">
            {settings.storeName} / {categoryName}
          </p>
          <h1 className="text-[18px] text-zh-900">{categoryName}</h1>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/s/${storeSlug}/products?category=${c.slug}`}
                className={`rounded-dk-xl border p-1 transition-colors ${
                  activeCategory === c.slug
                    ? 'border-zh-primary bg-zh-primary-50'
                    : 'border-zh-100 bg-zh-100'
                }`}
              >
                <div className="bg-white border border-zh-300 rounded-dk-xl h-[120px] lg:h-[160px] flex flex-col items-center justify-center gap-3 px-3">
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-16 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-zh-primary text-[22px] font-bold">
                      {c.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-[14px] text-zh-ink text-center">
                    {c.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[288px_1fr]">
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
                  <a
                    href={`/s/${storeSlug}/products`}
                    className={`block rounded-dk px-3 py-2 text-[14px] ${
                      !activeCategory
                        ? 'bg-zh-primary-50 text-zh-primary'
                        : 'hover:bg-zh-50'
                    }`}
                  >
                    همه
                  </a>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <a
                      href={`/s/${storeSlug}/products?category=${c.slug}`}
                      className={`block rounded-dk px-3 py-2 text-[14px] ${
                        activeCategory === c.slug
                          ? 'bg-zh-primary-50 text-zh-primary'
                          : 'hover:bg-zh-50'
                      }`}
                    >
                      {c.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-[14px] text-zh-600 tnum">
                {products.length.toLocaleString('fa-IR')} کالا
              </p>
              <input
                className="flex-1 min-w-[180px] max-w-md h-11 rounded-dk-lg bg-white border border-zh-300 px-4 text-[14px] outline-none focus:border-zh-primary"
                placeholder="جستجو در نتایج…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-zh-pink text-[14px] mb-3 font-medium">{error}</p>
            )}

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
    </StoreShell>
  );
}

export default function ProductsPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);
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
