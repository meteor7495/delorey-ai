'use client';

import Link from 'next/link';
import { formatIrr } from '@/lib/api';
import { useStoreTheme } from '@/themes/theme-context';

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  images?: string[];
  sku?: string | null;
};

function discountPercent(price: number, compareAt?: number | null) {
  if (compareAt == null || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function ProductCard({
  storeSlug,
  product,
  compact,
}: {
  storeSlug: string;
  product: ProductCardData;
  compact?: boolean;
}) {
  const theme = useStoreTheme();
  const img = product.images?.[0];
  const off = discountPercent(product.price, product.compareAtPrice);
  const href = `/s/${storeSlug}/products/${product.slug}`;

  if (theme === 'noir') {
    return (
      <Link href={href} className={`group block ${compact ? 'min-w-[240px]' : ''}`}>
        <div className="aspect-[3/4] bg-zh-100 overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
            />
          ) : (
            <div className="h-full grid place-items-center text-zh-500 text-[12px]">
              بدون تصویر
            </div>
          )}
        </div>
        <div className="mt-4 text-center space-y-1">
          <h3 className="text-[13px] tracking-[0.12em] uppercase text-zh-ink">
            {product.title}
          </h3>
          <p className="text-[13px] text-zh-primary tnum">
            {product.price.toLocaleString('fa-IR')} تومان
          </p>
        </div>
      </Link>
    );
  }

  if (theme === 'regal') {
    return (
      <Link href={href} className={`group block ${compact ? 'min-w-[220px]' : ''}`}>
        <div className="aspect-[4/5] bg-zh-100 overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
            />
          ) : null}
        </div>
        <div className="mt-3 text-right space-y-1">
          <h3 className="text-[15px] text-zh-ink">{product.title}</h3>
          <p className="text-[14px] text-zh-primary tnum">
            {product.price.toLocaleString('fa-IR')} تومان
          </p>
        </div>
      </Link>
    );
  }

  if (theme === 'customme') {
    return (
      <Link
        href={href}
        className={`group flex flex-col overflow-hidden rounded-3xl border border-zh-100 bg-zh-surface hover:shadow-dk-card ${
          compact ? 'min-w-[220px]' : 'h-full'
        }`}
      >
        <div className="h-44 bg-zh-50">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-contain p-4" />
          ) : null}
        </div>
        <div className="p-4 text-right space-y-2">
          <h3 className="text-[15px] font-semibold text-zh-ink line-clamp-2">
            {product.title}
          </h3>
          <p className="text-zh-primary font-bold tnum">
            {product.price.toLocaleString('fa-IR')} تومان
          </p>
        </div>
      </Link>
    );
  }

  if (theme === 'exclusive') {
    return (
      <Link
        href={href}
        className={`group block border border-zh-100 bg-zh-surface p-3 hover:shadow-dk-card ${
          compact ? 'min-w-[220px]' : ''
        }`}
      >
        <div className="relative h-40 bg-zh-50">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-contain" />
          ) : null}
          {off != null && (
            <span className="absolute top-2 start-2 bg-zh-primary text-white text-[11px] px-2 py-0.5">
              ٪{off.toLocaleString('fa-IR')}-
            </span>
          )}
        </div>
        <h3 className="mt-3 text-[14px] text-zh-ink line-clamp-2 min-h-[40px]">
          {product.title}
        </h3>
        <p className="mt-2 text-[16px] font-semibold tnum">
          {product.price.toLocaleString('fa-IR')} تومان
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`group flex flex-col zh-card overflow-hidden hover:shadow-dk-card transition-shadow ${
        compact ? 'min-w-[220px] w-[220px] lg:min-w-[288px] lg:w-[288px]' : 'h-full'
      }`}
    >
      <div className="flex flex-col gap-4 px-4 py-6 h-full">
        <div
          className={`relative overflow-hidden bg-zh-surface ${
            compact ? 'h-[140px]' : 'h-[160px]'
          }`}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="h-full w-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full grid place-items-center bg-zh-50 text-zh-400 text-[12px]">
              بدون تصویر
            </div>
          )}
          {!product.inStock && (
            <span className="absolute top-2 start-2 rounded-dk bg-zh-900/80 text-white text-[11px] px-2 py-0.5">
              ناموجود
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 flex-1 items-stretch">
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-center gap-1 shrink-0 text-zh-600 text-[14px]">
              <span className="tnum">۴.۳</span>
            </div>
            <div className="text-right min-w-0">
              <h3 className="text-[14px] text-zh-700 line-clamp-1">
                {product.title}
              </h3>
              <p className="text-[14px] text-zh-600 line-clamp-1 mt-1">
                {product.sku || product.slug}
              </p>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2 w-full">
            <div className="flex flex-col items-start gap-1">
              {off != null && (
                <span className="text-[14px] text-zh-600 line-through tnum">
                  {formatIrr(product.compareAtPrice!).replace(' تومان', '')}
                </span>
              )}
              <div className="flex items-end gap-1 text-zh-900">
                <span className="text-[16px] tnum">
                  {product.price.toLocaleString('fa-IR')}
                </span>
                <span className="text-[14px]">تومان</span>
              </div>
            </div>
            {off != null && (
              <span className="zh-badge tnum shrink-0">
                {off.toLocaleString('fa-IR')}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
