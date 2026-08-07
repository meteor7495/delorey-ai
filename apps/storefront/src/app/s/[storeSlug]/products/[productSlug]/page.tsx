'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api, formatIrr, getCartSessionId } from '@/lib/api';

type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  description?: string | null;
  images?: string[];
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [settings, setSettings] = useState<{
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    supportPhone?: string | null;
  } | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async ({ storeSlug: slug, productSlug }) => {
      setStoreSlug(slug);
      try {
        const [home, p] = await Promise.all([
          api.storefrontHome(slug),
          api.storefrontProduct(slug, productSlug),
        ]);
        setSettings(home.settings as NonNullable<typeof settings>);
        setProduct(p as unknown as Product);
      } catch (e) {
        setError(String(e));
      }
    });
  }, [params]);

  async function addToCart() {
    if (!product) return;
    setError(null);
    try {
      const sessionId = getCartSessionId(storeSlug);
      await api.storefrontSetCartItem(storeSlug, {
        sessionId,
        productId: product.id,
        quantity: 1,
      });
      setMessage('به سبد اضافه شد');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'افزودن نشد');
    }
  }

  if (error && !product) {
    return (
      <main className="container py-16 text-center text-red-600">{error}</main>
    );
  }

  if (!settings || !product) {
    return (
      <main className="container py-16 text-center text-[var(--muted)]">
        در حال بارگذاری…
      </main>
    );
  }

  const img = product.images?.[0];

  return (
    <StoreShell settings={settings}>
      <section className="container pt-5 grid gap-6 lg:grid-cols-2 fade-up">
        <div className="card aspect-square overflow-hidden grid place-items-center bg-[#f3f3f3]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[var(--muted)]">بدون تصویر</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">{product.title}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-xl font-extrabold text-[var(--brand)]">
              {formatIrr(product.price)}
            </span>
            {product.compareAtPrice != null &&
            product.compareAtPrice > product.price ? (
              <span className="text-[var(--muted)] line-through">
                {formatIrr(product.compareAtPrice)}
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)] whitespace-pre-wrap">
            {product.description || 'توضیحی ثبت نشده است.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-brand"
              disabled={!product.inStock}
              onClick={addToCart}
            >
              {product.inStock ? 'افزودن به سبد' : 'ناموجود'}
            </button>
            <Link href={`/s/${storeSlug}/cart`} className="btn btn-ghost">
              مشاهده سبد
            </Link>
          </div>
          {message && <p className="mt-3 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </section>
    </StoreShell>
  );
}
