'use client';

import Link from 'next/link';
import { formatIrr } from '@/lib/api';

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
  const img = product.images?.[0];
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <Link
      href={`/s/${storeSlug}/products/${product.slug}`}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/figma/icon-star.svg"
                alt=""
                width={15}
                height={15}
                className="size-[15px]"
              />
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
