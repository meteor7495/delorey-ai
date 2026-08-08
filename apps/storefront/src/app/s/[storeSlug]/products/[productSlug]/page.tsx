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
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    params.then(async ({ storeSlug: slug, productSlug }) => {
      setStoreSlug(slug);
      try {
        const [home, p] = await Promise.all([
          api.storefrontHome(slug),
          api.storefrontProduct(slug, productSlug),
        ]);
        setSettings(home.settings as NonNullable<typeof settings>);
        setCategories(
          (home.categories as Array<{ id: string; name: string; slug: string }>) ??
            [],
        );
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
      setMessage('به سبد خرید اضافه شد');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'افزودن نشد');
    }
  }

  if (error && !product) {
    return (
      <main className="dk-container py-20 text-center text-zh-pink text-[14px]">
        {error}
      </main>
    );
  }

  if (!settings || !product) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        در حال بارگذاری…
      </main>
    );
  }

  const images = product.images?.length ? product.images : [];
  const img = images[activeImg] ?? images[0];
  const off =
    product.compareAtPrice != null && product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) / product.compareAtPrice) *
            100,
        )
      : null;

  return (
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-6 lg:py-8 dk-fade">
        <div className="flex flex-wrap gap-2 text-[14px] text-zh-600 mb-6 justify-end">
          <Link href={`/s/${storeSlug}`}>{settings.storeName}</Link>
          <span>/</span>
          <Link href={`/s/${storeSlug}/products`}>کالاها</Link>
          <span>/</span>
          <span className="text-zh-900 line-clamp-1">{product.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Buy box — left in LTR / end in RTL */}
          <aside className="w-full lg:w-[288px] shrink-0 flex flex-col gap-4 order-2 lg:order-1">
            <div className="zh-card p-4 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-zh-50 pb-3">
                <span className="text-[14px] text-zh-800">گارانتی اصالت کالا</span>
                <span className="text-zh-warning text-[18px]">◆</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-zh-50 pb-3">
                <span className="text-[14px] text-zh-800">
                  {product.inStock ? 'موجود در انبار' : 'ناموجود'}
                </span>
                <span className="text-zh-primary text-[18px]">●</span>
              </div>
              <div className="space-y-2">
                {off != null && (
                  <div className="flex items-center gap-2">
                    <span className="zh-badge tnum">
                      {off.toLocaleString('fa-IR')}%
                    </span>
                    <span className="text-[14px] text-zh-600 line-through tnum">
                      {formatIrr(product.compareAtPrice!).replace(' تومان', '')}
                    </span>
                  </div>
                )}
                <div className="flex items-baseline gap-1 text-[16px] text-zh-900">
                  <span className="tnum text-[18px]">
                    {product.price.toLocaleString('fa-IR')}
                  </span>
                  <span>تومان</span>
                </div>
              </div>
              <button
                type="button"
                disabled={!product.inStock}
                onClick={addToCart}
                className="zh-btn-primary w-full"
              >
                افزودن به سبدخرید
              </button>
              {message && (
                <p className="text-[13px] text-dk-green font-medium">{message}</p>
              )}
              {error && (
                <p className="text-[13px] text-zh-pink font-medium">{error}</p>
              )}
              <Link
                href={`/s/${storeSlug}/cart`}
                className="flex h-10 items-center justify-center rounded-dk border border-zh-primary text-zh-primary text-[14px]"
              >
                مشاهده سبد
              </Link>
            </div>
          </aside>

          {/* Main product panel */}
          <div className="flex-1 zh-card p-5 lg:p-8 order-1 lg:order-2">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="flex items-center justify-end gap-3 flex-wrap">
                  <div className="flex items-center gap-1 text-[12px] text-zh-600">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/icon-star.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-5"
                    />
                    <span className="tnum">۳.۴</span>
                    <span>امتیاز</span>
                  </div>
                  <h1 className="text-[16px] lg:text-[18px] text-zh-800">
                    {product.title}
                  </h1>
                </div>

                <div className="border-t border-dashed border-zh-100 pt-4">
                  <p className="text-[16px] text-zh-900 mb-3 text-right">
                    ویژگی های اصلی
                  </p>
                  <p className="text-[14px] text-zh-600 leading-7 whitespace-pre-wrap text-right">
                    {product.description ||
                      'توضیحی برای این کالا ثبت نشده است. مشخصات کامل از پنل مدیریت قابل افزودن است.'}
                  </p>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative rounded-dk-xl overflow-hidden bg-zh-50 aspect-square grid place-items-center">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="max-h-full max-w-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-zh-400 text-[14px]">بدون تصویر</span>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto dk-scrollbar-hide">
                    {images.map((src, i) => (
                      <button
                        key={src}
                        type="button"
                        onClick={() => setActiveImg(i)}
                        className={`shrink-0 size-20 rounded-dk-lg border overflow-hidden ${
                          i === activeImg
                            ? 'border-zh-primary'
                            : 'border-zh-200'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={src}
                          alt=""
                          className="size-full object-contain p-1"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
