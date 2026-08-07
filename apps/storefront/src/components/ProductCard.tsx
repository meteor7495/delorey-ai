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
};

export function ProductCard({
  storeSlug,
  product,
}: {
  storeSlug: string;
  product: ProductCardData;
}) {
  const img = product.images?.[0];
  return (
    <Link
      href={`/s/${storeSlug}/products/${product.slug}`}
      className="card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md fade-up"
    >
      <div className="aspect-square bg-[#f3f3f3] grid place-items-center overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-[var(--muted)]">بدون تصویر</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-bold line-clamp-2 min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-extrabold text-[var(--brand)]">
            {formatIrr(product.price)}
          </span>
          {product.compareAtPrice != null && product.compareAtPrice > product.price ? (
            <span className="text-xs text-[var(--muted)] line-through">
              {formatIrr(product.compareAtPrice)}
            </span>
          ) : null}
        </div>
        {!product.inStock && (
          <p className="mt-1 text-xs text-red-600">ناموجود</p>
        )}
      </div>
    </Link>
  );
}
