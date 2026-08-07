'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [q, setQ] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .storefrontHome(storeSlug)
      .then((home) =>
        setSettings(
          home.settings as {
            storeName: string;
            storeSlug: string;
            primaryColor: string;
            secondaryColor: string;
            logoUrl?: string | null;
            tagline?: string | null;
            supportPhone?: string | null;
          },
        ),
      )
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
      <main className="container py-16 text-center text-[var(--muted)]">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings}>
      <section className="container pt-5 space-y-4">
        <h1 className="text-xl font-extrabold">محصولات</h1>
        <div className="flex flex-wrap gap-2">
          <input
            className="input max-w-sm"
            placeholder="جستجو…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm bg-white border border-[var(--line)] rounded-lg px-3">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            فقط موجود
          </label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
          ))}
        </div>
        {products.length === 0 && (
          <p className="text-center text-sm text-[var(--muted)] py-10">
            محصولی یافت نشد
          </p>
        )}
      </section>
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
      <main className="container py-16 text-center text-[var(--muted)]">
        در حال بارگذاری…
      </main>
    );
  }
  return (
    <Suspense
      fallback={
        <main className="container py-16 text-center text-[var(--muted)]">
          در حال بارگذاری…
        </main>
      }
    >
      <ProductsInner storeSlug={storeSlug} />
    </Suspense>
  );
}
