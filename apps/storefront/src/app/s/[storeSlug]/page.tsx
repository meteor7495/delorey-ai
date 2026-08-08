'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { ProductCard, type ProductCardData } from '@/components/ProductCard';
import { api } from '@/lib/api';

type HomeData = {
  settings: {
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    tagline?: string | null;
    supportPhone?: string | null;
  };
  banners: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string | null;
    href: string | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  featured: ProductCardData[];
  widget: {
    publicKey: string;
    apiBase: string;
    widgetBase: string;
  } | null;
};

function useCountdown(hours = 18) {
  const end = useMemo(() => Date.now() + hours * 3600_000, [hours]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, end - now);
  const h = Math.floor(left / 3600_000);
  const m = Math.floor((left % 3600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  return { h, m, s };
}

function SectionHeader({
  title,
  href,
  linkLabel = 'مشاهده همه',
}: {
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-[20px] lg:text-[28px] text-zh-ink">{title}</h2>
      <Link
        href={href}
        className="text-[14px] text-zh-primary flex items-center gap-1"
      >
        {linkLabel}
        <span aria-hidden>‹</span>
      </Link>
    </div>
  );
}

export default function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const countdown = useCountdown(18);

  useEffect(() => {
    params.then(({ storeSlug: slug }) => {
      setStoreSlug(slug);
      api
        .storefrontHome(slug)
        .then((raw) =>
          setData({
            settings: raw.settings as HomeData['settings'],
            banners: (raw.banners as HomeData['banners']) ?? [],
            categories: (raw.categories as HomeData['categories']) ?? [],
            featured: (raw.featured as ProductCardData[]) ?? [],
            widget: (raw.widget as HomeData['widget']) ?? null,
          }),
        )
        .catch((e) => setError(String(e)));
    });
  }, [params]);

  const slides =
    data && data.banners.length > 0
      ? data.banners
      : [
          {
            id: 'fallback',
            title: 'ترند ترین کالکشن دکوراسیون',
            subtitle: 'زی هوم ، زیبایی به سبک ایرانی',
            imageUrl: '/figma/hero.jpg',
            href: null as string | null,
          },
        ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setSlide((s) => (s + 1) % slides.length);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (error) {
    return (
      <main className="dk-container py-20 text-center">
        <p className="text-zh-pink mb-3 text-[14px] font-semibold">{error}</p>
        <p className="text-zh-600 text-[14px]">
          اسلاگ فروشگاه را از Workspace → تنظیمات بررسی کنید.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="dk-container py-24 text-center text-zh-600 text-[14px]">
        در حال بارگذاری فروشگاه…
      </main>
    );
  }

  const current = slides[slide] ?? slides[0]!;
  const amazing = data.featured.filter(
    (p) => p.compareAtPrice != null && p.compareAtPrice > p.price,
  );
  const amazingList = (amazing.length > 0 ? amazing : data.featured).slice(0, 8);
  const popular = data.featured.slice(0, 8);
  const more = data.featured.slice(0, 4);

  return (
    <StoreShell
      settings={data.settings}
      widget={data.widget}
      categories={data.categories}
    >
      {/* Hero slider — full bleed */}
      <section className="relative w-full overflow-hidden dk-fade">
        <div className="relative h-[280px] sm:h-[420px] lg:h-[700px] bg-zh-900">
          <div
            key={current.id}
            className="absolute inset-0 dk-slide-in"
            style={{
              background: current.imageUrl
                ? `center/cover url(${current.imageUrl})`
                : `center/cover url(/figma/hero.jpg)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/25" />
          <div className="relative h-full flex flex-col items-center justify-start pt-10 lg:pt-20 px-4 text-center text-white">
            <p className="text-[18px] sm:text-[24px] lg:text-[32px]">
              {current.title}
            </p>
            <p className="mt-2 text-[24px] sm:text-[36px] lg:text-[48px] font-medium max-w-3xl">
              {current.subtitle || data.settings.tagline || data.settings.storeName}
            </p>
          </div>
          {slides.length > 1 && (
            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-3 z-10">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`اسلاید ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`rounded-full transition-all ${
                    i === slide
                      ? 'size-[27px] border-2 border-white/80 bg-white/30'
                      : 'size-[11px] bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Incredible offers */}
      <section className="dk-container mt-10 lg:mt-14">
        <div className="flex gap-4 lg:gap-6 overflow-x-auto dk-scrollbar-hide pb-2 items-stretch">
          <div className="relative shrink-0 w-[220px] lg:w-[288px] h-[360px] lg:h-[377px] rounded-dk-xl overflow-hidden bg-zh-primary text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/figma/offers-bg.svg"
              alt=""
              className="absolute inset-0 size-full object-cover opacity-90"
            />
            <div className="relative z-10 flex flex-col h-full p-6">
              <div className="flex items-start justify-end gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figma/icon-sparkle-white.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="size-10"
                />
              </div>
              <p className="text-[22px] lg:text-[24px] leading-relaxed text-right mt-2">
                پیشـــــنهاد
                <br />
                شگــفـــت انگیـــــــز
              </p>
              <div className="mt-auto">
                <Link
                  href={`/s/${storeSlug}/products`}
                  className="inline-flex items-center gap-2 rounded-dk bg-white/15 hover:bg-white/25 px-4 py-2 text-[14px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/figma/icon-arrow-left.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 invert"
                  />
                  مشاهده همه
                </Link>
                <div className="mt-4 rounded-dk-lg bg-white p-3 text-zh-900">
                  <div className="flex justify-end mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/figma/icon-clock.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="size-6"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-1 tnum">
                    {[
                      { v: countdown.h, l: 'ساعت' },
                      { v: countdown.m, l: 'دقیقه' },
                      { v: countdown.s, l: 'ثانیه' },
                    ].map((x, i) => (
                      <div key={x.l} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-[20px] text-zh-900 px-0.5">:</span>
                        )}
                        <div className="w-12 h-[66px] rounded-dk bg-zh-50 flex flex-col items-center justify-center">
                          <span className="text-[16px]">
                            {String(x.v).padStart(2, '0')}
                          </span>
                          <span className="text-[12px] text-zh-500">{x.l}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {amazingList.length === 0 ? (
            <p className="flex-1 py-16 text-center text-zh-600 text-[14px]">
              محصولی برای این بخش نیست — از CMS اضافه کنید.
            </p>
          ) : (
            amazingList.slice(0, 3).map((p) => (
              <ProductCard
                key={p.id}
                storeSlug={storeSlug}
                product={p}
                compact
              />
            ))
          )}
        </div>
      </section>

      {/* Categories */}
      {data.categories.length > 0 && (
        <section className="dk-container mt-12 lg:mt-16">
          <h2 className="text-center text-[22px] lg:text-[28px] text-zh-ink mb-8">
            دسته بندی محصولات
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {data.categories.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                href={`/s/${storeSlug}/products?category=${c.slug}`}
                className="group rounded-dk-xl bg-zh-100 p-1 hover:bg-zh-200 transition-colors"
              >
                <div className="bg-white border border-zh-300 rounded-dk-xl h-[180px] lg:h-[216px] flex flex-col items-center justify-center gap-4 px-4 py-4">
                  <div className="h-[100px] lg:h-[125px] w-full grid place-items-center overflow-hidden rounded-dk">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.imageUrl}
                        alt=""
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <span className="text-zh-primary text-[28px] font-bold">
                        {c.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[16px] text-zh-ink text-center">{c.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Promo band */}
      <section className="dk-container mt-12 lg:mt-16">
        <div className="relative overflow-hidden rounded-dk-xl bg-gradient-to-l from-zh-primary to-[#c39bd3] text-white min-h-[180px] lg:min-h-[252px] flex items-center px-6 lg:px-10">
          <div className="relative z-10 max-w-md text-right ms-auto lg:ms-0 lg:me-auto">
            <p className="text-[22px] lg:text-[28px]">
              کاملترین کالکشن ابزار آشپزخانه
            </p>
            <p className="mt-2 text-[14px] lg:text-[16px] opacity-90">
              آشپزخانه ات را با سبک {data.settings.storeName} تکمیل کن
            </p>
            <Link
              href={`/s/${storeSlug}/products`}
              className="mt-5 inline-flex zh-btn-primary bg-white text-zh-primary hover:bg-zh-50"
            >
              مشاهده محصولات
            </Link>
          </div>
        </div>
      </section>

      {/* Popular products */}
      <section className="dk-container mt-12 lg:mt-16">
        <SectionHeader
          title="محصولات پرفروش"
          href={`/s/${storeSlug}/products`}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {popular.map((p) => (
            <ProductCard key={p.id} storeSlug={storeSlug} product={p} />
          ))}
        </div>
        {popular.length === 0 && (
          <p className="py-16 text-center text-zh-600 text-[14px]">
            هنوز محصول منتشرشده‌ای نیست.
          </p>
        )}
      </section>

      {/* Dual credit banners */}
      <section className="dk-container mt-12 lg:mt-16">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            {
              title: 'خریــــد اعتباری!',
              body: 'سرویس‌های قابلمه متنوع، حال خوب آشپزخانه',
              tone: 'from-[#9B59B6] to-[#6C3483]',
            },
            {
              title: 'خریــــد اعتباری!',
              body: 'قهوه سازهای اسمگ؛ آشپزخانه مدرن',
              tone: 'from-[#DE6A95] to-[#9B59B6]',
            },
          ].map((b) => (
            <Link
              key={b.body}
              href={`/s/${storeSlug}/products`}
              className={`relative overflow-hidden rounded-dk-xl bg-gradient-to-br ${b.tone} text-white min-h-[200px] lg:min-h-[280px] p-6 lg:p-10 flex flex-col justify-start`}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[22px] lg:text-[28px]">{b.title}</h3>
                <span className="grid size-7 place-items-center rounded-full bg-white/20 text-[14px]">
                  %
                </span>
              </div>
              <p className="mt-3 text-[14px] max-w-[220px] opacity-95">{b.body}</p>
              <span className="mt-6 inline-flex h-8 items-center rounded-dk bg-white/15 px-4 text-[13px] w-fit">
                مشاهده
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Second product rail */}
      {more.length > 0 && (
        <section className="dk-container mt-12 lg:mt-16 mb-12 lg:mb-20">
          <SectionHeader
            title="پیشنهادهای ویژه"
            href={`/s/${storeSlug}/products`}
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {more.map((p) => (
              <ProductCard key={`m-${p.id}`} storeSlug={storeSlug} product={p} />
            ))}
          </div>
        </section>
      )}
    </StoreShell>
  );
}
