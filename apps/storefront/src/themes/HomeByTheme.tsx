'use client';

import Link from 'next/link';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import type { StoreSettings } from '@/themes/types';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
};
type Category = { id: string; name: string; slug: string; imageUrl?: string | null };

export type HomeArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
};

export type HomeViewProps = {
  storeSlug: string;
  settings: StoreSettings;
  banners: Banner[];
  categories: Category[];
  featured: ProductCardData[];
  articles?: HomeArticle[];
  slides: Banner[];
  slide: number;
  setSlide: (n: number | ((p: number) => number)) => void;
  countdown: { h: number; m: number; s: number };
};

function SectionHeader({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[20px] lg:text-[28px] text-zh-ink">{title}</h2>
      <Link href={href} className="text-[14px] text-zh-primary">
        مشاهده همه ‹
      </Link>
    </div>
  );
}

export function HomeByTheme(props: HomeViewProps) {
  const theme = props.settings.themeId ?? 'zi-home';
  return (
    <>
      {theme === 'regal' ? (
        <RegalHome {...props} />
      ) : theme === 'customme' ? (
        <CustommeHome {...props} />
      ) : theme === 'icenter' ? (
        <IcenterHome {...props} />
      ) : theme === 'noir' ? (
        <NoirHome {...props} />
      ) : theme === 'exclusive' ? (
        <ExclusiveHome {...props} />
      ) : theme === 'rivo' ? (
        <RivoHome {...props} />
      ) : theme === 'freebie' ? (
        <FreebieHome {...props} />
      ) : (
        <ClassicHome {...props} />
      )}
      {theme !== 'rivo' && theme !== 'freebie' && (
        <ArticlesStrip storeSlug={props.storeSlug} articles={props.articles ?? []} />
      )}
    </>
  );
}

function ClassicHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
  setSlide,
  countdown,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0]!;
  const amazing = featured.filter(
    (p) => p.compareAtPrice != null && p.compareAtPrice > p.price,
  );
  const amazingList = (amazing.length > 0 ? amazing : featured).slice(0, 8);
  const popular = featured.slice(0, 8);

  return (
    <>
      <section className="relative w-full overflow-hidden dk-fade">
        <div className="relative h-[280px] sm:h-[420px] lg:h-[560px] bg-zh-900">
          <div
            className="absolute inset-0 dk-slide-in"
            style={{
              background: `center/cover url(${current.imageUrl || '/figma/hero.jpg'})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zh-bg via-transparent to-black/25" />
          <div className="relative h-full flex flex-col items-center justify-start pt-10 lg:pt-20 px-4 text-center text-white">
            <p className="text-[18px] sm:text-[24px] lg:text-[32px]">{current.title}</p>
            <p className="mt-2 text-[24px] sm:text-[36px] lg:text-[48px] font-medium max-w-3xl">
              {current.subtitle || settings.tagline || settings.storeName}
            </p>
          </div>
        </div>
      </section>
      <ProductRail
        storeSlug={storeSlug}
        title="پیشنهاد شگفت‌انگیز"
        products={amazingList}
        countdown={countdown}
      />
      <CategoryGrid storeSlug={storeSlug} categories={categories} />
      <ProductGrid storeSlug={storeSlug} title="محصولات پرفروش" products={popular} />
    </>
  );
}

function RegalHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  return (
    <>
      <section className="dk-container pt-10 lg:pt-16 pb-8 grid lg:grid-cols-2 gap-10 items-center">
        <div className="text-right space-y-5">
          <p className="text-[13px] tracking-[0.2em] text-zh-primary">
            {settings.storeName}
          </p>
          <h1 className="text-[32px] lg:text-[48px] leading-tight text-zh-ink font-medium">
            {current?.title || settings.tagline || 'لباس‌هایی که داستان شما را روایت می‌کنند'}
          </h1>
          <p className="text-zh-600 text-[15px] leading-8 max-w-md ms-auto">
            {current?.subtitle ||
              'هر محصول با دقت انتخاب شده تا حس زیبایی و اعتماد را به ویترین شما بیاورد.'}
          </p>
          <Link href={`/s/${storeSlug}/products`} className="zh-btn-primary rounded-none px-8">
            مشاهده کالکشن
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.slice(0, 4).map((p) => (
            <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
          ))}
        </div>
      </section>
      <section className="dk-container py-10">
        <h2 className="text-center text-[24px] text-zh-ink mb-8">دسته‌بندی</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((c) => (
            <Link
              key={c.id}
              href={`/s/${storeSlug}/products?category=${c.slug}`}
              className="h-40 bg-zh-100 grid place-items-center text-zh-ink hover:bg-zh-200"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
      <ProductGrid storeSlug={storeSlug} title="منتخب فصل" products={featured.slice(0, 8)} />
    </>
  );
}

function CustommeHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  return (
    <>
      <section className="dk-container py-10 lg:py-16 grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
        <div
          className="min-h-[280px] lg:min-h-[420px] rounded-[24px] bg-zh-50 overflow-hidden"
          style={{
            background: current?.imageUrl
              ? `center/cover url(${current.imageUrl})`
              : undefined,
          }}
        />
        <div className="space-y-4 text-right">
          <h1 className="text-[28px] lg:text-[40px] font-bold text-zh-ink">
            آنلاین شاپ {settings.storeName}
          </h1>
          <p className="text-zh-600 leading-8">
            {current?.subtitle ||
              settings.tagline ||
              'محصولات متنوع را از همین ویترین سفارش دهید.'}
          </p>
          <Link href={`/s/${storeSlug}/products`} className="zh-btn-primary rounded-full px-8">
            شروع خرید
          </Link>
        </div>
      </section>
      <div className="dk-container flex gap-3 overflow-x-auto pb-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/s/${storeSlug}/products?category=${c.slug}`}
            className="shrink-0 rounded-full border border-zh-200 px-4 py-2 text-[13px] hover:border-zh-primary hover:text-zh-primary"
          >
            {c.name}
          </Link>
        ))}
      </div>
      <ProductGrid storeSlug={storeSlug} title="جدیدترین‌ها" products={featured.slice(0, 8)} />
    </>
  );
}

function IcenterHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  return (
    <>
      <section className="dk-container mt-6 rounded-dk-xl overflow-hidden bg-zh-100 min-h-[280px] lg:min-h-[400px] relative">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: current?.imageUrl
              ? `center/cover url(${current.imageUrl})`
              : undefined,
          }}
        />
        <div className="relative p-8 lg:p-14 max-w-xl ms-auto text-right space-y-4">
          <h1 className="text-[28px] lg:text-[40px] font-bold text-zh-ink">
            {current?.title || 'انواع تجهیزات و کالای منتخب'}
          </h1>
          <p className="text-zh-600">
            {current?.subtitle || settings.tagline || 'با پشتیبانی فروشگاه بومی'}
          </p>
          <Link href={`/s/${storeSlug}/products`} className="zh-btn-primary text-zh-ink">
            مشاهده محصولات
          </Link>
        </div>
      </section>
      <section className="dk-container mt-8 grid sm:grid-cols-3 gap-4">
        {categories.slice(0, 3).map((c) => (
          <Link
            key={c.id}
            href={`/s/${storeSlug}/products?category=${c.slug}`}
            className="h-32 bg-zh-100 p-5 flex items-end justify-end text-zh-ink font-semibold"
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            {c.name}
          </Link>
        ))}
      </section>
      <ProductGrid storeSlug={storeSlug} title="پرفروش‌ترین‌ها" products={featured.slice(0, 8)} />
    </>
  );
}

function NoirHome({
  storeSlug,
  settings,
  featured,
  slides,
  slide,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  return (
    <>
      <section className="relative min-h-[70vh] grid place-items-center text-center px-6">
        {current?.imageUrl ? (
          <div
            className="absolute inset-0 opacity-35"
            style={{ background: `center/cover url(${current.imageUrl})` }}
          />
        ) : null}
        <div className="relative space-y-6">
          <p className="tracking-[0.35em] text-[12px] text-zh-500">
            {settings.storeName}
          </p>
          <h1 className="text-[40px] lg:text-[64px] font-light text-zh-ink">
            {current?.title || settings.tagline || 'مجموعه جدید'}
          </h1>
          <Link
            href={`/s/${storeSlug}/products`}
            className="inline-block border border-zh-ink px-10 py-3 text-[13px] tracking-[0.2em]"
          >
            خرید
          </Link>
        </div>
      </section>
      <ProductGrid storeSlug={storeSlug} title="منتخب" products={featured.slice(0, 8)} />
    </>
  );
}

function ExclusiveHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
  countdown,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0]!;
  return (
    <>
      <section className="dk-container mt-8 grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="hidden lg:block border-e border-zh-200 pe-6 space-y-3 py-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/s/${storeSlug}/products?category=${c.slug}`}
              className="block text-[15px] hover:text-zh-primary"
            >
              {c.name}
            </Link>
          ))}
          {categories.length === 0 && (
            <Link href={`/s/${storeSlug}/products`} className="block text-[15px]">
              همه محصولات
            </Link>
          )}
        </aside>
        <div className="relative min-h-[280px] bg-zh-900 text-zh-50 overflow-hidden">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: current.imageUrl
                ? `center/cover url(${current.imageUrl})`
                : undefined,
            }}
          />
          <div className="relative p-10 max-w-md space-y-4">
            <p className="text-[14px]">{settings.storeName}</p>
            <h1 className="text-[32px] lg:text-[44px] font-semibold leading-tight">
              {current.title || 'تا ۱۰٪ تخفیف'}
            </h1>
            <Link href={`/s/${storeSlug}/products`} className="inline-flex items-center gap-2 underline">
              خرید کنید
            </Link>
          </div>
        </div>
      </section>
      <ProductRail
        storeSlug={storeSlug}
        title="فروش ویژه امروز"
        products={featured.slice(0, 6)}
        countdown={countdown}
      />
      <ProductGrid storeSlug={storeSlug} title="محصولات" products={featured.slice(0, 8)} />
    </>
  );
}

function RivoHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
  countdown,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  const bestSelling = featured.slice(0, 3);
  const onSale = featured.filter(
    (p) => p.compareAtPrice != null && p.compareAtPrice > p.price,
  );
  const offerProducts = onSale.length > 0 ? onSale : featured;

  return (
    <>
      {/* Hero */}
      <section className="dk-container pt-8 lg:pt-12 pb-12 lg:pb-16 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="text-right space-y-6 order-2 lg:order-1">
          <h1 className="text-[36px] lg:text-[50px] leading-[1.15] font-medium text-zh-ink">
            {current?.title || 'مد خود را کشف کنید!'}
          </h1>
          <p className="text-[16px] lg:text-[18px] text-zh-600 leading-8 max-w-lg ms-auto">
            {current?.subtitle ||
              settings.tagline ||
              'مجموعه‌ای منتخب از پوشاک و اکسسوری متناسب با سلیقه شما.'}
          </p>
          <Link
            href={`/s/${storeSlug}/products`}
            className="inline-flex items-center justify-center h-[74px] px-10 bg-zh-primary text-white text-[15px] font-medium uppercase hover:opacity-90 transition-opacity"
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            مشاهده فروشگاه
          </Link>
        </div>
        <div
          className="relative min-h-[320px] lg:min-h-[480px] bg-zh-primarySoft overflow-hidden order-1 lg:order-2"
          style={{ borderRadius: 'var(--zh-radius)' }}
        >
          {current?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-zh-primarySoft" />
          )}
        </div>
      </section>

      {/* Best selling */}
      {bestSelling.length > 0 && (
        <section className="dk-container py-12 lg:py-16">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-[36px] lg:text-[50px] font-medium text-zh-ink">
              پرفروش‌ترین‌ها
            </h2>
            <p className="text-[16px] text-zh-600 max-w-xl mx-auto">
              محبوب‌ترین محصولات فروشگاه را از همین‌جا ببینید.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {bestSelling.map((p) => (
              <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href={`/s/${storeSlug}/products`}
              className="inline-flex items-center gap-3 text-[16px] text-zh-ink hover:text-zh-primary"
            >
              مشاهده همه
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </section>
      )}

      {/* Our products with category tabs */}
      <section className="dk-container py-12 lg:py-16">
        <h2 className="text-center text-[36px] lg:text-[50px] font-medium text-zh-ink mb-8">
          محصولات ما
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10 mb-10 text-[16px]">
          <Link
            href={`/s/${storeSlug}/products`}
            className="pb-1 border-b-2 border-zh-primary text-zh-primary font-medium"
          >
            همه
          </Link>
          {categories.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/s/${storeSlug}/products?category=${c.slug}`}
              className="pb-1 border-b-2 border-transparent text-zh-600 hover:text-zh-ink hover:border-zh-300 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
        {featured.length === 0 ? (
          <p className="py-16 text-center text-zh-600 text-[14px]">
            هنوز محصول منتشرشده‌ای نیست.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featured.slice(0, 8).map((p) => (
              <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Exclusive offer banner */}
      {offerProducts.length > 0 && (
        <section className="dk-container py-12 lg:py-16">
          <div
            className="bg-zh-primarySoft grid lg:grid-cols-2 gap-8 items-center overflow-hidden p-6 lg:p-10"
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            <div className="relative min-h-[280px] lg:min-h-[400px]">
              {offerProducts[0]?.images?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offerProducts[0].images[0]}
                  alt=""
                  className="h-full w-full object-cover object-top"
                  style={{ borderRadius: 'var(--zh-radius)' }}
                />
              ) : (
                <div className="h-full bg-zh-200" style={{ borderRadius: 'var(--zh-radius)' }} />
              )}
            </div>
            <div className="text-right space-y-6 px-2 lg:px-6">
              <h2 className="text-[32px] lg:text-[46px] font-bold text-zh-ink">
                پیشنهاد ویژه
              </h2>
              <p className="text-[18px] lg:text-[22px] text-zh-ink leading-8">
                از جدیدترین محصولات با تخفیف ویژه دیدن کنید.
              </p>
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'ساعت', value: countdown.h },
                  { label: 'دقیقه', value: countdown.m },
                  { label: 'ثانیه', value: countdown.s },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="size-[80px] lg:size-[100px] bg-white shadow-[0_7px_30px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center"
                    style={{ borderRadius: 'var(--zh-radius)' }}
                  >
                    <span className="text-[24px] lg:text-[32px] font-semibold text-zh-ink tnum">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                    <span className="text-[14px] text-zh-ink">{unit.label}</span>
                  </div>
                ))}
              </div>
              <Link
                href={`/s/${storeSlug}/products`}
                className="inline-flex items-center justify-center h-[74px] px-10 bg-zh-primary text-white text-[15px] font-medium uppercase hover:opacity-90"
                style={{ borderRadius: 'var(--zh-radius)' }}
              >
                خرید کنید
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Category showcase */}
      {categories.length > 0 && (
        <section className="dk-container py-12 lg:py-16 mb-8">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-[36px] lg:text-[50px] font-medium text-zh-ink">
              دسته‌بندی‌های منتخب
            </h2>
            <p className="text-[16px] text-zh-600 max-w-2xl mx-auto">
              {settings.tagline || 'مجموعه‌ای متنوع از پوشاک و اکسسوری برای هر سلیقه.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {categories.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                href={`/s/${storeSlug}/products?category=${c.slug}`}
                className="group block text-right"
              >
                <div
                  className="aspect-[3/4] bg-zh-primarySoft overflow-hidden mb-4"
                  style={{ borderRadius: 'var(--zh-radius)' }}
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.imageUrl}
                      alt=""
                      className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  ) : (
                    <div className="h-full grid place-items-center text-zh-600 text-[14px]">
                      {c.name}
                    </div>
                  )}
                </div>
                <h3 className="text-[24px] lg:text-[32px] font-medium text-zh-ink mb-2">
                  {c.name}
                </h3>
                <p className="text-[15px] text-zh-600 leading-7">
                  مشاهده محصولات این دسته
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function FreebieHome({
  storeSlug,
  settings,
  categories,
  featured,
  slides,
  slide,
}: HomeViewProps) {
  const current = slides[slide] ?? slides[0];
  const newArrivals = featured.slice(0, 4);
  const onSale = featured.filter(
    (p) => p.compareAtPrice != null && p.compareAtPrice > p.price,
  );
  const topSelling =
    onSale.length >= 2 ? onSale.slice(0, 4) : featured.slice(4, 8);
  const topList = topSelling.length > 0 ? topSelling : featured.slice(0, 4);
  const styleCats = categories.slice(0, 4);
  const brandLabels =
    categories.length > 0
      ? categories.slice(0, 5).map((c) => c.name)
      : [settings.storeName, 'کیفیت', 'ارسال سریع', 'تنوع', 'پشتیبانی'];

  return (
    <>
      {/* Hero — SHOP.CO style split */}
      <section className="bg-zh-50 overflow-hidden">
        <div className="dk-container grid lg:grid-cols-2 gap-8 lg:gap-0 items-center py-10 lg:py-0 lg:min-h-[560px]">
          <div className="text-right space-y-6 lg:space-y-8 order-2 lg:order-1 py-4 lg:py-16">
            <h1 className="text-[36px] sm:text-[48px] lg:text-[64px] leading-[1.05] font-bold uppercase text-zh-ink tracking-tight">
              {current?.title || 'لباسی که سبک شما را کامل می‌کند'}
            </h1>
            <p className="text-[14px] lg:text-[16px] text-zh-600 leading-7 max-w-xl ms-auto">
              {current?.subtitle ||
                settings.tagline ||
                'مجموعه‌ای متنوع از پوشاک باکیفیت برای استایل شخصی شما.'}
            </p>
            <Link
              href={`/s/${storeSlug}/products`}
              className="inline-flex items-center justify-center h-[52px] px-14 bg-zh-primary text-white text-[16px] font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              خرید کنید
            </Link>
            <div className="flex flex-wrap items-stretch gap-4 lg:gap-8 pt-2">
              {[
                { value: `${Math.max(categories.length, 1).toLocaleString('fa-IR')}+`, label: 'دسته‌بندی' },
                {
                  value: `${Math.max(featured.length, 1).toLocaleString('fa-IR')}+`,
                  label: 'محصول باکیفیت',
                },
                { value: '۳۰٬۰۰۰+', label: 'مشتری راضی' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex items-stretch gap-4 lg:gap-8">
                  {i > 0 ? (
                    <span className="hidden sm:block w-px self-stretch bg-zh-200" aria-hidden="true" />
                  ) : null}
                  <div className="text-right">
                    <p className="text-[24px] lg:text-[40px] font-bold text-zh-ink tnum leading-none">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[12px] lg:text-[16px] text-zh-600">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative order-1 lg:order-2 min-h-[280px] sm:min-h-[360px] lg:min-h-[560px]">
            {current?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.imageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : (
              <div className="absolute inset-0 bg-zh-100" />
            )}
            <span
              className="absolute top-[8%] start-[8%] size-12 lg:size-16 text-zh-ink opacity-90"
              aria-hidden="true"
            >
              <FreebieStar />
            </span>
            <span
              className="absolute bottom-[18%] end-[10%] size-7 lg:size-10 text-zh-ink opacity-90"
              aria-hidden="true"
            >
              <FreebieStar />
            </span>
          </div>
        </div>
      </section>

      {/* Brand / category strip */}
      <div className="bg-zh-primary text-white">
        <div className="dk-container flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-5 lg:py-7">
          {brandLabels.map((label) => (
            <span
              key={label}
              className="text-[14px] lg:text-[22px] font-bold uppercase tracking-wide opacity-95"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="dk-container py-12 lg:py-16">
          <h2 className="text-center text-[32px] lg:text-[48px] font-bold uppercase text-zh-ink mb-8 lg:mb-12">
            تازه‌ها
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
            ))}
          </div>
          <div className="mt-8 lg:mt-10 flex justify-center">
            <Link
              href={`/s/${storeSlug}/products`}
              className="inline-flex h-[46px] lg:h-[52px] items-center justify-center px-14 rounded-full border border-zh-ink/10 text-[14px] lg:text-[16px] text-zh-ink hover:bg-zh-50 transition-colors"
            >
              مشاهده همه
            </Link>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && topList.length > 0 ? (
        <div className="dk-container">
          <hr className="border-zh-100" />
        </div>
      ) : null}

      {/* Top selling */}
      {topList.length > 0 && (
        <section className="dk-container py-12 lg:py-16">
          <h2 className="text-center text-[32px] lg:text-[48px] font-bold uppercase text-zh-ink mb-8 lg:mb-12">
            پرفروش‌ها
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {topList.map((p) => (
              <ProductCard key={`top-${p.id}`} storeSlug={storeSlug} product={p} />
            ))}
          </div>
          <div className="mt-8 lg:mt-10 flex justify-center">
            <Link
              href={`/s/${storeSlug}/products`}
              className="inline-flex h-[46px] lg:h-[52px] items-center justify-center px-14 rounded-full border border-zh-ink/10 text-[14px] lg:text-[16px] text-zh-ink hover:bg-zh-50 transition-colors"
            >
              مشاهده همه
            </Link>
          </div>
        </section>
      )}

      {/* Browse by style — categories */}
      {styleCats.length > 0 && (
        <section className="dk-container pb-12 lg:pb-16">
          <div
            className="bg-zh-100 px-6 py-10 lg:px-16 lg:py-16"
            style={{ borderRadius: '40px' }}
          >
            <h2 className="text-center text-[32px] lg:text-[48px] font-bold uppercase text-zh-ink mb-8 lg:mb-12">
              مرور بر اساس استایل
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
              {styleCats.map((c, i) => {
                const wide = i === 1 || i === 2;
                return (
                  <Link
                    key={c.id}
                    href={`/s/${storeSlug}/products?category=${c.slug}`}
                    className={`group relative overflow-hidden bg-zh-surface min-h-[190px] lg:min-h-[289px] ${
                      wide ? 'sm:col-span-1 lg:min-h-[289px]' : ''
                    }`}
                    style={{ borderRadius: 'var(--zh-radius)' }}
                  >
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zh-200" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                    <span className="absolute top-5 start-6 lg:top-7 lg:start-9 text-[24px] lg:text-[36px] font-bold text-zh-ink drop-shadow-sm">
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {featured.length === 0 && categories.length === 0 && (
        <p className="dk-container py-20 text-center text-zh-600 text-[14px]">
          هنوز محصول یا دسته‌ای برای نمایش نیست.
        </p>
      )}
    </>
  );
}

function FreebieStar() {
  return (
    <svg viewBox="0 0 56 56" fill="currentColor" className="size-full" aria-hidden="true">
      <path d="M28 0L34.2 21.8L56 28L34.2 34.2L28 56L21.8 34.2L0 28L21.8 21.8L28 0Z" />
    </svg>
  );
}

function ProductRail({
  storeSlug,
  title,
  products,
  countdown,
}: {
  storeSlug: string;
  title: string;
  products: ProductCardData[];
  countdown: { h: number; m: number; s: number };
}) {
  return (
    <section className="dk-container mt-10 lg:mt-14">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-[20px] lg:text-[28px] text-zh-ink">{title}</h2>
        <div className="flex gap-1 tnum text-[12px] text-zh-600">
          <span>{String(countdown.h).padStart(2, '0')}</span>:
          <span>{String(countdown.m).padStart(2, '0')}</span>:
          <span>{String(countdown.s).padStart(2, '0')}</span>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto dk-scrollbar-hide pb-2">
        {products.map((p) => (
          <ProductCard key={p.id} storeSlug={storeSlug} product={p} compact />
        ))}
      </div>
    </section>
  );
}

function ProductGrid({
  storeSlug,
  title,
  products,
}: {
  storeSlug: string;
  title: string;
  products: ProductCardData[];
}) {
  return (
    <section className="dk-container mt-12 lg:mt-16 mb-12">
      <SectionHeader title={title} href={`/s/${storeSlug}/products`} />
      {products.length === 0 ? (
        <p className="py-16 text-center text-zh-600 text-[14px]">
          هنوز محصول منتشرشده‌ای نیست.
        </p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryGrid({
  storeSlug,
  categories,
}: {
  storeSlug: string;
  categories: Category[];
}) {
  if (categories.length === 0) return null;
  return (
    <section className="dk-container mt-12">
      <h2 className="text-center text-[22px] lg:text-[28px] text-zh-ink mb-8">
        دسته بندی محصولات
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/s/${storeSlug}/products?category=${c.slug}`}
            className="rounded-dk-xl overflow-hidden bg-zh-100 text-center hover:bg-zh-200 text-zh-ink"
          >
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" className="h-28 w-full object-cover" />
            ) : (
              <div className="h-28 bg-zh-200" />
            )}
            <p className="p-4">{c.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ArticlesStrip({
  storeSlug,
  articles,
}: {
  storeSlug: string;
  articles: HomeArticle[];
}) {
  if (articles.length === 0) return null;
  return (
    <section className="dk-container mt-12 lg:mt-16 mb-16">
      <SectionHeader title="مجله فروشگاه" href={`/s/${storeSlug}/articles`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {articles.slice(0, 4).map((a) => (
          <Link
            key={a.id}
            href={`/s/${storeSlug}/articles/${a.slug}`}
            className="rounded-dk-xl overflow-hidden border border-zh-100 bg-zh-surface hover:shadow-dk-card"
          >
            {a.featuredImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.featuredImageUrl}
                alt=""
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="h-40 bg-zh-100" />
            )}
            <div className="p-4 space-y-2 text-right">
              <h3 className="text-[16px] text-zh-ink leading-7">{a.title}</h3>
              {a.excerpt ? (
                <p className="text-[13px] text-zh-600 leading-6 line-clamp-2">
                  {a.excerpt}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
