'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api, formatIrr, getCartSessionId } from '@/lib/api';
import { useStorefrontChrome } from '@/lib/use-storefront';
import { pageTitleClass, pdpLayout, useStoreTheme } from '@/themes/theme-context';
import { readPersistedPreview } from '@/lib/preview-mode';

type VariantOption = {
  attributeId: string;
  attributeName: string;
  attributeValueId: string;
  value: string;
  label: string;
  colorHex?: string | null;
};

type Variant = {
  id: string;
  sku: string;
  active: boolean;
  effectivePrice: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  options: VariantOption[];
  inventory: { available: number; state: string } | null;
};

type Product = {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  hasVariants?: boolean;
  description?: string | null;
  images?: string[];
  variants?: Variant[];
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const { settings, categories, error: chromeError } = useStorefrontChrome(storeSlug);
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    params.then(({ storeSlug: slug, productSlug: pslug }) => {
      setStoreSlug(slug);
      setProductSlug(pslug);
    });
  }, [params]);

  useEffect(() => {
    if (!storeSlug || !productSlug) return;
    api
      .storefrontProduct(storeSlug, productSlug)
      .then((p) => {
        const prod = p as unknown as Product;
        setProduct(prod);
        const first =
          prod.variants?.find(
            (v) => v.active && (v.inventory?.available ?? 0) > 0,
          ) ?? prod.variants?.[0];
        if (first) {
          const init: Record<string, string> = {};
          for (const opt of first.options) {
            init[opt.attributeId] = opt.attributeValueId;
          }
          setSelected(init);
        }
      })
      .catch((e) => setError(String(e)));
  }, [storeSlug, productSlug]);

  const attributeGroups = useMemo(() => {
    if (!product?.variants?.length) return [];
    const map = new Map<
      string,
      { attributeId: string; attributeName: string; values: Map<string, VariantOption> }
    >();
    for (const v of product.variants) {
      for (const opt of v.options) {
        let group = map.get(opt.attributeId);
        if (!group) {
          group = {
            attributeId: opt.attributeId,
            attributeName: opt.attributeName,
            values: new Map(),
          };
          map.set(opt.attributeId, group);
        }
        group.values.set(opt.attributeValueId, opt);
      }
    }
    return [...map.values()].map((g) => ({
      attributeId: g.attributeId,
      attributeName: g.attributeName,
      values: [...g.values.values()],
    }));
  }, [product]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length) return null;
    return (
      product.variants.find((v) =>
        v.options.every(
          (opt) => selected[opt.attributeId] === opt.attributeValueId,
        ),
      ) ?? null
    );
  }, [product, selected]);

  const displayPrice = selectedVariant?.effectivePrice ?? product?.price ?? 0;
  const displayCompare =
    selectedVariant?.compareAtPrice ?? product?.compareAtPrice ?? null;
  const inStock = selectedVariant
    ? (selectedVariant.inventory?.available ?? 0) > 0
    : Boolean(product?.inStock);
  const needsVariant = Boolean(product?.hasVariants && product.variants?.length);

  async function addToCart() {
    if (!product) return;
    setError(null);
    setMessage(null);
    if (readPersistedPreview()?.active) {
      setError('در حالت پیش‌نمایش افزودن به سبد غیرفعال است');
      return;
    }
    if (needsVariant && !selectedVariant) {
      setError('لطفاً همه گزینه‌ها را انتخاب کنید');
      return;
    }
    if (!inStock) {
      setError('این کالا ناموجود است');
      return;
    }
    try {
      const sessionId = getCartSessionId(storeSlug);
      await api.storefrontSetCartItem(storeSlug, {
        sessionId,
        productId: product.id,
        variantId: selectedVariant?.id,
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
        {chromeError ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  const images = product.images?.length ? product.images : [];
  const variantImg = selectedVariant?.imageUrl;
  const img = variantImg || images[activeImg] || images[0];
  const off =
    displayCompare != null && displayCompare > displayPrice
      ? Math.round(((displayCompare - displayPrice) / displayCompare) * 100)
      : null;

  return (
    <StoreShell settings={settings} categories={categories}>
      <PdpView
        storeSlug={storeSlug}
        storeName={settings.storeName}
        product={product}
        img={img}
        images={images}
        activeImg={activeImg}
        setActiveImg={setActiveImg}
        attributeGroups={attributeGroups}
        selected={selected}
        setSelected={setSelected}
        selectedVariant={selectedVariant}
        displayPrice={displayPrice}
        displayCompare={displayCompare}
        off={off}
        inStock={inStock}
        needsVariant={needsVariant}
        addToCart={addToCart}
        message={message}
        error={error}
      />
    </StoreShell>
  );
}

function PdpView(props: {
  storeSlug: string;
  storeName: string;
  product: Product;
  img?: string;
  images: string[];
  activeImg: number;
  setActiveImg: (n: number) => void;
  attributeGroups: Array<{
    attributeId: string;
    attributeName: string;
    values: VariantOption[];
  }>;
  selected: Record<string, string>;
  setSelected: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  selectedVariant: Variant | null;
  displayPrice: number;
  displayCompare: number | null;
  off: number | null;
  inStock: boolean;
  needsVariant: boolean;
  addToCart: () => void;
  message: string | null;
  error: string | null;
}) {
  const theme = useStoreTheme();
  const layout = pdpLayout(theme);

  return (
    <div className="dk-container py-6 lg:py-10 dk-fade">
      <div className="flex flex-wrap gap-2 text-[14px] text-zh-600 mb-6 justify-end">
        <Link href={`/s/${props.storeSlug}`}>{props.storeName}</Link>
        <span>/</span>
        <Link href={`/s/${props.storeSlug}/products`}>کالاها</Link>
        <span>/</span>
        <span className="text-zh-900 line-clamp-1">{props.product.title}</span>
      </div>

      {layout === 'stack' ? (
        <div className="max-w-3xl mx-auto space-y-8">
          <Gallery {...props} tall />
          <div className="text-center space-y-4">
            <h1 className={pageTitleClass(theme)}>{props.product.title}</h1>
            <BuyBox {...props} centered />
          </div>
          <Description text={props.product.description} />
        </div>
      ) : layout === 'split' ? (
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <Gallery {...props} />
          <div className="space-y-6 text-right">
            <h1 className={pageTitleClass(theme)}>{props.product.title}</h1>
            <BuyBox {...props} />
            <Description text={props.product.description} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <aside className="w-full lg:w-[288px] shrink-0 order-2 lg:order-1">
            <div className="zh-card p-4">
              <BuyBox {...props} />
            </div>
          </aside>
          <div className="flex-1 zh-card p-5 lg:p-8 order-1 lg:order-2">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="order-2 lg:order-1 space-y-6">
                <h1 className="text-[16px] lg:text-[18px] text-zh-800 text-right">
                  {props.product.title}
                </h1>
                {props.selectedVariant && (
                  <p className="text-[13px] text-zh-600 text-right">
                    کد تنوع: {props.selectedVariant.sku}
                  </p>
                )}
                <Description text={props.product.description} />
              </div>
              <div className="order-1 lg:order-2">
                <Gallery {...props} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Gallery({
  img,
  images,
  activeImg,
  setActiveImg,
  tall,
}: {
  img?: string;
  images: string[];
  activeImg: number;
  setActiveImg: (n: number) => void;
  tall?: boolean;
}) {
  return (
    <div>
      <div
        className={`relative overflow-hidden bg-zh-50 grid place-items-center ${
          tall ? 'aspect-[3/4]' : 'aspect-square'
        }`}
        style={{ borderRadius: 'var(--zh-radius)' }}
      >
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="max-h-full max-w-full object-contain p-4" />
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
              className={`shrink-0 size-20 overflow-hidden border ${
                i === activeImg ? 'border-zh-primary' : 'border-zh-200'
              }`}
              style={{ borderRadius: 'var(--zh-radius)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="size-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyBox({
  storeSlug,
  attributeGroups,
  selected,
  setSelected,
  selectedVariant,
  displayPrice,
  displayCompare,
  off,
  inStock,
  needsVariant,
  addToCart,
  message,
  error,
  centered,
}: {
  storeSlug: string;
  attributeGroups: Array<{
    attributeId: string;
    attributeName: string;
    values: VariantOption[];
  }>;
  selected: Record<string, string>;
  setSelected: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  selectedVariant: Variant | null;
  displayPrice: number;
  displayCompare: number | null;
  off: number | null;
  inStock: boolean;
  needsVariant: boolean;
  addToCart: () => void;
  message: string | null;
  error: string | null;
  centered?: boolean;
}) {
  return (
    <div className={`space-y-4 ${centered ? 'max-w-sm mx-auto' : ''}`}>
      <div className="flex items-center justify-between gap-2 border-b border-zh-50 pb-3">
        <span className="text-[14px] text-zh-800">
          {inStock ? 'موجود در انبار' : 'ناموجود'}
        </span>
        <span className="text-zh-primary text-[18px]">●</span>
      </div>

      {attributeGroups.map((group) => (
        <div key={group.attributeId} className="space-y-2">
          <p className="text-[13px] text-zh-700 font-medium">{group.attributeName}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((val) => {
              const active = selected[group.attributeId] === val.attributeValueId;
              return (
                <button
                  key={val.attributeValueId}
                  type="button"
                  onClick={() =>
                    setSelected((prev) => ({
                      ...prev,
                      [group.attributeId]: val.attributeValueId,
                    }))
                  }
                  className={`min-w-10 border px-3 py-1.5 text-[13px] ${
                    active
                      ? 'border-zh-primary text-zh-primary bg-zh-primary/5'
                      : 'border-zh-200 text-zh-800'
                  }`}
                  style={{ borderRadius: 'var(--zh-radius)' }}
                >
                  {val.label || val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="space-y-2">
        {off != null && (
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <span className="zh-badge tnum">{off.toLocaleString('fa-IR')}%</span>
            <span className="text-[14px] text-zh-600 line-through tnum">
              {formatIrr(displayCompare!).replace(' تومان', '')}
            </span>
          </div>
        )}
        <div className="flex items-baseline gap-1 text-zh-900">
          <span className="tnum text-[22px]">
            {displayPrice.toLocaleString('fa-IR')}
          </span>
          <span>تومان</span>
        </div>
      </div>
      <button
        type="button"
        disabled={!inStock || (needsVariant && !selectedVariant)}
        onClick={addToCart}
        className="zh-btn-primary w-full"
      >
        افزودن به سبدخرید
      </button>
      {message && <p className="text-[13px] text-dk-green font-medium">{message}</p>}
      {error && <p className="text-[13px] text-zh-pink font-medium">{error}</p>}
      <Link
        href={`/s/${storeSlug}/cart`}
        className="flex h-10 items-center justify-center border border-zh-primary text-zh-primary text-[14px]"
        style={{ borderRadius: 'var(--zh-radius)' }}
      >
        مشاهده سبد
      </Link>
    </div>
  );
}

function Description({ text }: { text?: string | null }) {
  return (
    <div className="border-t border-dashed border-zh-100 pt-4">
      <p className="text-[16px] text-zh-900 mb-3 text-right">ویژگی های اصلی</p>
      <p className="text-[14px] text-zh-600 leading-7 whitespace-pre-wrap text-right">
        {text || 'توضیحی برای این کالا ثبت نشده است.'}
      </p>
    </div>
  );
}
