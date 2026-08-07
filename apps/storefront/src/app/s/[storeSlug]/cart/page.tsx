'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api, formatIrr, getCartSessionId } from '@/lib/api';

type Cart = {
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: number;
    product: {
      id: string;
      slug: string;
      title: string;
      price: number;
      currency: string;
      inStock: boolean;
      images: string[];
    };
  }>;
  total: number;
  currency: string;
};

export default function CartPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
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
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(slug: string) {
    const sessionId = getCartSessionId(slug);
    const [home, c] = await Promise.all([
      api.storefrontHome(slug),
      api.storefrontGetCart(slug, sessionId),
    ]);
    setSettings(home.settings as NonNullable<typeof settings>);
    setCart(c as unknown as Cart);
  }

  useEffect(() => {
    params.then(({ storeSlug: slug }) => {
      setStoreSlug(slug);
      load(slug).catch((e) => setError(String(e)));
    });
  }, [params]);

  async function setQty(productId: string, quantity: number) {
    try {
      const sessionId = getCartSessionId(storeSlug);
      const c = await api.storefrontSetCartItem(storeSlug, {
        sessionId,
        productId,
        quantity,
      });
      setCart(c as unknown as Cart);
    } catch (e) {
      setError(String(e));
    }
  }

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
        <h1 className="text-xl font-extrabold">سبد خرید</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!cart || cart.items.length === 0 ? (
          <div className="card p-8 text-center text-[var(--muted)]">
            سبد خالی است.{' '}
            <Link href={`/s/${storeSlug}/products`} className="text-[var(--brand)] font-semibold">
              بازگشت به محصولات
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="card p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <Link
                      href={`/s/${storeSlug}/products/${item.product.slug}`}
                      className="font-bold"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-[var(--muted)]">
                      {formatIrr(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setQty(item.product.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setQty(item.product.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <span className="ms-3 font-extrabold text-[var(--brand)]">
                      {formatIrr(item.lineTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
              <span className="font-extrabold text-lg">
                جمع: {formatIrr(cart.total)}
              </span>
              <Link href={`/s/${storeSlug}/checkout`} className="btn btn-brand">
                ادامه تسویه (COD)
              </Link>
            </div>
          </>
        )}
      </section>
    </StoreShell>
  );
}
