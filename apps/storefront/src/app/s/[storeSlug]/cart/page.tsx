'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api, getCartSessionId } from '@/lib/api';

type Cart = {
  items: Array<{
    id: string;
    quantity: number;
    lineTotal: number;
    unitPrice: number;
    variantId?: string | null;
    product: {
      id: string;
      slug: string;
      title: string;
      price: number;
      currency: string;
      inStock: boolean;
      images: string[];
    };
    variant?: {
      id: string;
      sku: string;
      options: Array<{ attributeName: string; label: string }>;
    } | null;
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
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(slug: string) {
    const sessionId = getCartSessionId(slug);
    const [home, c] = await Promise.all([
      api.storefrontHome(slug),
      api.storefrontGetCart(slug, sessionId),
    ]);
    setSettings(home.settings as NonNullable<typeof settings>);
    setCategories(
      (home.categories as Array<{ id: string; name: string; slug: string }>) ??
        [],
    );
    setCart(c as unknown as Cart);
  }

  useEffect(() => {
    params.then(({ storeSlug: slug }) => {
      setStoreSlug(slug);
      load(slug).catch((e) => setError(String(e)));
    });
  }, [params]);

  async function setQty(
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) {
    try {
      const sessionId = getCartSessionId(storeSlug);
      const c = await api.storefrontSetCartItem(storeSlug, {
        sessionId,
        productId,
        variantId: variantId ?? undefined,
        quantity,
      });
      setCart(c as unknown as Cart);
    } catch (e) {
      setError(String(e));
    }
  }

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-dk-muted">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-4 lg:py-6">
        <h1 className="text-[20px] text-zh-900 mb-4">سبد خرید</h1>
        {error && <p className="text-zh-pink text-[14px] mb-3">{error}</p>}

        {!cart || cart.items.length === 0 ? (
          <div className="zh-card py-16 text-center">
            <p className="text-zh-600 text-[14px] mb-4">سبد خرید شما خالی است!</p>
            <Link
              href={`/s/${storeSlug}/products`}
              className="zh-btn-primary inline-flex px-6"
            >
              مشاهده کالاها
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="zh-card divide-y divide-zh-100">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-3 items-start">
                  <Link
                    href={`/s/${storeSlug}/products/${item.product.slug}`}
                    className="shrink-0 w-20 h-20 rounded-dk border border-zh-200 overflow-hidden bg-white"
                  >
                    {item.product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product.images[0]}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : null}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/s/${storeSlug}/products/${item.product.slug}`}
                      className="text-[14px] text-zh-900 line-clamp-2"
                    >
                      {item.product.title}
                    </Link>
                    {item.variant?.options?.length ? (
                      <p className="mt-1 text-[12px] text-zh-600">
                        {item.variant.options
                          .map((o) => `${o.attributeName}: ${o.label}`)
                          .join(' · ')}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center border border-zh-200 rounded-dk overflow-hidden">
                        <button
                          type="button"
                          className="h-8 w-8 text-zh-primary font-bold"
                          onClick={() =>
                            setQty(
                              item.product.id,
                              item.quantity - 1,
                              item.variantId,
                            )
                          }
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[14px] tnum">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="h-8 w-8 text-zh-primary font-bold"
                          onClick={() =>
                            setQty(
                              item.product.id,
                              item.quantity + 1,
                              item.variantId,
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[16px] text-zh-900 tnum">
                        {item.lineTotal.toLocaleString('fa-IR')}{' '}
                        <span className="text-[12px] text-zh-600">تومان</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="zh-card p-5 h-fit sticky top-[180px]">
              <div className="flex items-center justify-between text-[14px] mb-3">
                <span className="text-zh-600">جمع سبد</span>
                <span className="text-zh-900 text-[18px] tnum">
                  {cart.total.toLocaleString('fa-IR')}{' '}
                  <span className="text-[12px] text-zh-600">تومان</span>
                </span>
              </div>
              <p className="text-[13px] text-zh-600 mb-4">
                کد تخفیف و روش پرداخت در مرحله بعد.
              </p>
              <Link
                href={`/s/${storeSlug}/checkout`}
                className="zh-btn-primary w-full"
              >
                تایید و تکمیل سفارش
              </Link>
            </aside>
          </div>
        )}
      </div>
    </StoreShell>
  );
}
