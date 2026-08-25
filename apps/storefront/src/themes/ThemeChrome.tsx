'use client';

import Link from 'next/link';
import type { FormEvent, ReactNode } from 'react';
import type { StoreSettings } from '@/themes/types';

type Category = { id: string; name: string; slug: string; imageUrl?: string | null };

export type ChromeProps = {
  settings: StoreSettings;
  base: string;
  pathname: string;
  categories: Category[];
  q: string;
  setQ: (value: string) => void;
  catOpen: boolean;
  setCatOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  onSearch: (e: FormEvent) => void;
};

function Logo({ settings, base }: { settings: StoreSettings; base: string }) {
  return (
    <Link href={base} className="shrink-0 flex items-center">
      {settings.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl}
          alt={settings.storeName}
          className="h-8 lg:h-9 w-auto max-w-[160px] object-contain"
        />
      ) : (
        <span className="text-[18px] lg:text-[22px] font-bold tracking-tight text-zh-ink">
          {settings.storeName}
        </span>
      )}
    </Link>
  );
}

function SearchField({
  q,
  setQ,
  onSearch,
  rounded,
}: {
  q: string;
  setQ: (v: string) => void;
  onSearch: (e: FormEvent) => void;
  rounded?: string;
}) {
  return (
    <form onSubmit={onSearch} className="flex-1 relative min-w-0" role="search">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="جستجو"
        className={`w-full h-11 pe-4 ps-4 text-[15px] text-zh-900 placeholder:text-zh-400 outline-none border border-zh-300 bg-zh-surface focus:border-zh-primary ${rounded ?? 'rounded-dk-lg'}`}
      />
    </form>
  );
}

function CartLink({ base, pathname }: { base: string; pathname: string }) {
  const active = pathname.includes('/cart') || pathname.includes('/checkout');
  return (
    <Link
      href={`${base}/cart`}
      className={`flex h-10 items-center justify-center px-3 border border-zh-100 hover:bg-zh-50 ${
        active ? 'text-zh-primary' : ''
      }`}
      style={{ borderRadius: 'var(--zh-radius)' }}
      aria-label="سبد خرید"
    >
      سبد
    </Link>
  );
}

export function ThemeHeader(props: ChromeProps) {
  const theme = props.settings.themeId ?? 'zi-home';
  if (theme === 'regal') return <RegalHeader {...props} />;
  if (theme === 'customme') return <CustommeHeader {...props} />;
  if (theme === 'icenter') return <IcenterHeader {...props} />;
  if (theme === 'noir') return <NoirHeader {...props} />;
  if (theme === 'exclusive') return <ExclusiveHeader {...props} />;
  if (theme === 'rivo') return <RivoHeader {...props} />;
  if (theme === 'freebie') return <FreebieHeader {...props} />;
  return <ClassicHeader {...props} />;
}

function ClassicHeader({
  settings,
  base,
  pathname,
  categories,
  q,
  setQ,
  catOpen,
  setCatOpen,
  onSearch,
}: ChromeProps) {
  return (
    <>
      <div className="hidden lg:block bg-zh-primary text-white text-[14px]">
        <div className="dk-container flex h-10 items-center justify-between gap-4">
          <span>خرید بیش از یک میلیون تومان ارسال رایگان</span>
          <span>{settings.tagline || 'خدمات فروشگاه'}</span>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-zh-surface border-b border-zh-100">
        <div className="dk-container pt-4 pb-3 lg:pt-6 lg:pb-4">
          <div className="flex items-center gap-3 lg:gap-6">
            <Logo settings={settings} base={base} />
            <SearchField q={q} setQ={setQ} onSearch={onSearch} />
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href={`${base}/track`}
                className="flex h-10 items-center rounded-dk border border-zh-100 px-3 hover:bg-zh-50"
              >
                پیگیری
              </Link>
              <CartLink base={base} pathname={pathname} />
            </div>
          </div>
        </div>
        <NavRow
          base={base}
          categories={categories}
          catOpen={catOpen}
          setCatOpen={setCatOpen}
        />
      </header>
    </>
  );
}

function RegalHeader({
  settings,
  base,
  pathname,
  categories,
  q,
  setQ,
  onSearch,
}: ChromeProps) {
  return (
    <header className="sticky top-0 z-50 bg-zh-bg border-b border-zh-200">
      <div className="dk-container py-5 flex items-center gap-6">
        <Logo settings={settings} base={base} />
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 text-[14px] text-zh-800">
          {categories.slice(0, 5).map((c) => (
            <Link key={c.id} href={`${base}/products?category=${c.slug}`} className="hover:text-zh-primary">
              {c.name}
            </Link>
          ))}
          <Link href={`${base}/products`} className="hover:text-zh-primary">
            همه محصولات
          </Link>
          <Link href={`${base}/articles`} className="hover:text-zh-primary">
            مجله
          </Link>
        </nav>
        <div className="flex items-center gap-3 ms-auto">
          <div className="hidden md:block w-56">
            <SearchField q={q} setQ={setQ} onSearch={onSearch} rounded="rounded-none" />
          </div>
          <CartLink base={base} pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

function CustommeHeader({
  settings,
  base,
  pathname,
  categories,
  q,
  setQ,
  onSearch,
}: ChromeProps) {
  return (
    <header className="sticky top-0 z-50 bg-zh-surface shadow-sm">
      <div className="dk-container py-4 flex items-center gap-4">
        <Logo settings={settings} base={base} />
        <SearchField q={q} setQ={setQ} onSearch={onSearch} rounded="rounded-full" />
        <Link href={`${base}/track`} className="hidden sm:block text-[13px] text-zh-600">
          پیگیری سفارش
        </Link>
        <CartLink base={base} pathname={pathname} />
      </div>
      <div className="border-t border-zh-100">
        <div className="dk-container flex gap-5 overflow-x-auto py-3 text-[13px] text-zh-700">
          {categories.map((c) => (
            <Link key={c.id} href={`${base}/products?category=${c.slug}`} className="shrink-0 hover:text-zh-primary">
              {c.name}
            </Link>
          ))}
          <Link href={`${base}/articles`} className="shrink-0 hover:text-zh-primary">
            مجله
          </Link>
        </div>
      </div>
    </header>
  );
}

function IcenterHeader({
  settings,
  base,
  pathname,
  categories,
  q,
  setQ,
  catOpen,
  setCatOpen,
  onSearch,
}: ChromeProps) {
  return (
    <>
      <div className="bg-zh-primary text-zh-ink text-[13px]">
        <div className="dk-container h-10 flex items-center justify-between">
          <span>بهترین تخفیف‌ها منتظر شماست</span>
          <Link href={`${base}/products`} className="font-semibold">
            مشاهده محصولات
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-zh-bg border-b border-zh-200">
        <div className="dk-container py-4 flex items-center gap-4">
          <Logo settings={settings} base={base} />
          <SearchField q={q} setQ={setQ} onSearch={onSearch} />
          <Link
            href={`${base}/track`}
            className="hidden sm:flex h-11 items-center px-3 bg-zh-100 text-[13px]"
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            حساب / پیگیری
          </Link>
          <CartLink base={base} pathname={pathname} />
        </div>
        <NavRow
          base={base}
          categories={categories}
          catOpen={catOpen}
          setCatOpen={setCatOpen}
          dark
        />
      </header>
    </>
  );
}

function NoirHeader({
  settings,
  base,
  pathname,
  categories,
}: ChromeProps) {
  return (
    <header className="sticky top-0 z-50 bg-zh-bg border-b border-zh-200">
      <div className="dk-container py-6 flex items-center justify-between">
        <nav className="hidden md:flex gap-6 text-[13px] tracking-[0.14em] uppercase text-zh-700">
          {categories.slice(0, 4).map((c) => (
            <Link key={c.id} href={`${base}/products?category=${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </nav>
        <Logo settings={settings} base={base} />
        <div className="flex items-center gap-4 text-[13px]">
          <Link href={`${base}/products`}>فروشگاه</Link>
          <Link href={`${base}/articles`}>مجله</Link>
          <CartLink base={base} pathname={pathname} />
        </div>
      </div>
    </header>
  );
}

function ExclusiveHeader({
  settings,
  base,
  pathname,
  q,
  setQ,
  onSearch,
}: ChromeProps) {
  return (
    <>
      <div className="bg-zh-900 text-zh-50 text-[13px]">
        <div className="dk-container h-10 flex items-center justify-center gap-3">
          <span>ارسال رایگان این هفته — از فروشگاه دیدن کنید</span>
          <Link href={`${base}/products`} className="underline">
            خرید
          </Link>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-zh-surface border-b border-zh-200">
        <div className="dk-container py-4 flex items-center gap-6">
          <Logo settings={settings} base={base} />
          <nav className="hidden lg:flex gap-6 text-[15px]">
            <Link href={base}>خانه</Link>
            <Link href={`${base}/products`}>فروشگاه</Link>
            <Link href={`${base}/articles`}>مجله</Link>
            <Link href={`${base}/track`}>تماس</Link>
          </nav>
          <SearchField q={q} setQ={setQ} onSearch={onSearch} rounded="rounded-md" />
          <CartLink base={base} pathname={pathname} />
        </div>
      </header>
    </>
  );
}

function FreebieHeader({
  settings,
  base,
  pathname,
  categories,
  q,
  setQ,
  catOpen,
  setCatOpen,
  onSearch,
}: ChromeProps) {
  const saleHref = `${base}/products?sort=sale`;
  return (
    <>
      <div className="bg-zh-primary text-white text-[12px] lg:text-[14px]">
        <div className="dk-container h-[34px] lg:h-[38px] flex items-center justify-center px-4 text-center">
          <p>
            {settings.tagline || 'ثبت‌نام کنید و از اولین خرید تخفیف بگیرید.'}{' '}
            <Link href={`${base}/products`} className="underline underline-offset-2">
              همین حالا
            </Link>
          </p>
        </div>
      </div>
      <header className="sticky top-0 z-50 bg-zh-surface border-b border-zh-100">
        <div className="dk-container py-4 lg:py-5 flex items-center gap-3 lg:gap-10">
          <button
            type="button"
            className="lg:hidden flex size-10 items-center justify-center shrink-0 text-zh-ink"
            aria-label="منوی دسته‌بندی"
            aria-expanded={catOpen}
            onClick={() => setCatOpen((v) => !v)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <Logo settings={settings} base={base} />
          <nav className="hidden lg:flex items-center gap-6 text-[16px] text-zh-ink shrink-0">
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-1 hover:opacity-70"
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
              >
                فروشگاه
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {catOpen && (
                <div className="absolute top-full start-0 z-50 mt-2 w-56 rounded-2xl border border-zh-100 bg-zh-surface shadow-dk-card py-2">
                  {categories.length === 0 ? (
                    <p className="px-4 py-3 text-zh-600 text-[14px]">هنوز دسته‌ای تعریف نشده</p>
                  ) : (
                    categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`${base}/products?category=${c.slug}`}
                        className="flex px-4 py-2.5 text-[14px] hover:bg-zh-50"
                        onClick={() => setCatOpen(false)}
                      >
                        {c.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
            <Link href={saleHref} className="hover:opacity-70">
              تخفیف‌ها
            </Link>
            <Link href={`${base}/products`} className="hover:opacity-70">
              تازه‌ها
            </Link>
            <Link href={`${base}/articles`} className="hover:opacity-70">
              برندها
            </Link>
          </nav>
          <form
            onSubmit={onSearch}
            className="hidden lg:flex flex-1 items-center gap-3 h-12 px-4 bg-zh-100 rounded-full min-w-0"
            role="search"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0 text-zh-400" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی محصول..."
              className="flex-1 bg-transparent text-[16px] text-zh-900 placeholder:text-zh-400 outline-none min-w-0"
            />
          </form>
          <div className="flex items-center gap-3 lg:gap-4 ms-auto shrink-0">
            <Link
              href={`${base}/cart`}
              className={`flex size-10 items-center justify-center text-zh-ink hover:opacity-70 ${
                pathname.includes('/cart') || pathname.includes('/checkout') ? 'opacity-100' : ''
              }`}
              aria-label="سبد خرید"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 4V2M17 4V2M3.5 7h17l-1.5 12H5L3.5 7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href={`${base}/track`}
              className="flex size-10 items-center justify-center text-zh-ink hover:opacity-70"
              aria-label="حساب کاربری"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>
          </div>
        </div>
        {catOpen && (
          <div className="lg:hidden border-t border-zh-100 bg-zh-surface">
            <div className="dk-container py-3 space-y-1">
              <form onSubmit={onSearch} className="mb-3" role="search">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="جستجوی محصول..."
                  className="w-full h-11 px-4 bg-zh-100 rounded-full text-[14px] outline-none"
                />
              </form>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`${base}/products?category=${c.slug}`}
                  className="block py-2.5 text-[15px] text-zh-800"
                  onClick={() => setCatOpen(false)}
                >
                  {c.name}
                </Link>
              ))}
              <Link href={`${base}/products`} className="block py-2.5 text-[15px] text-zh-800" onClick={() => setCatOpen(false)}>
                همه محصولات
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function RivoHeader({
  settings,
  base,
  pathname,
  categories,
}: ChromeProps) {
  return (
    <header className="sticky top-0 z-50 bg-zh-surface">
      <div className="dk-container py-4 lg:py-5 flex items-center gap-4 lg:gap-8">
        <Logo settings={settings} base={base} />
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 text-[15px] text-zh-800">
          <Link href={base} className="hover:text-zh-primary">
            خانه
          </Link>
          <Link href={`${base}/products`} className="hover:text-zh-primary">
            فروشگاه
          </Link>
          {categories.slice(0, 3).map((c) => (
            <Link
              key={c.id}
              href={`${base}/products?category=${c.slug}`}
              className="hover:text-zh-primary"
            >
              {c.name}
            </Link>
          ))}
          <Link href={`${base}/track`} className="hover:text-zh-primary">
            تماس
          </Link>
        </nav>
        <div className="flex items-center gap-3 ms-auto shrink-0">
          <Link
            href={`${base}/cart`}
            className={`relative flex size-8 items-center justify-center text-zh-ink hover:text-zh-primary ${
              pathname.includes('/cart') || pathname.includes('/checkout')
                ? 'text-zh-primary'
                : ''
            }`}
            aria-label="سبد خرید"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 4V2M17 4V2M3.5 7h17l-1.5 12H5L3.5 7z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href={`${base}/products`}
            className="hidden sm:flex h-[52px] items-center px-6 border border-zh-primary text-[15px] text-zh-primary hover:bg-zh-primary hover:text-white transition-colors"
            style={{ borderRadius: 'var(--zh-radius)' }}
          >
            مشاهده فروشگاه
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavRow({
  base,
  categories,
  catOpen,
  setCatOpen,
  dark,
}: {
  base: string;
  categories: Category[];
  catOpen: boolean;
  setCatOpen: ChromeProps['setCatOpen'];
  dark?: boolean;
}) {
  return (
    <div className="border-t border-zh-100">
      <div className="dk-container flex items-center gap-4 h-14 overflow-x-auto dk-scrollbar-hide">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCatOpen((v) => !v)}
            className="flex items-center gap-2 text-[15px] text-zh-primary"
          >
            دسته بندی کالاها
          </button>
          {catOpen && (
            <div className="absolute top-full start-0 z-50 mt-2 w-64 rounded-dk-xl border border-zh-100 bg-zh-surface shadow-dk-card py-2">
              {categories.length === 0 ? (
                <p className="px-4 py-3 text-zh-600 text-[14px]">هنوز دسته‌ای تعریف نشده</p>
              ) : (
                categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`${base}/products?category=${c.slug}`}
                    className="flex px-4 py-2.5 text-[14px] hover:bg-zh-50"
                    onClick={() => setCatOpen(false)}
                  >
                    {c.name}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <nav className={`flex items-center gap-6 text-[15px] ${dark ? 'text-zh-800' : 'text-zh-900'}`}>
          <Link href={`${base}/products`} className="shrink-0 hover:text-zh-primary">
            محصولات
          </Link>
          <Link href={`${base}/articles`} className="shrink-0 hover:text-zh-primary">
            مجله
          </Link>
          <Link href={`${base}/track`} className="shrink-0 hover:text-zh-primary">
            پیگیری سفارش
          </Link>
        </nav>
      </div>
    </div>
  );
}

export function ThemeFooter({
  settings,
  base,
  categories,
}: {
  settings: StoreSettings;
  base: string;
  categories: Category[];
}) {
  const theme = settings.themeId ?? 'zi-home';
  if (theme === 'rivo') {
    return <RivoFooter settings={settings} base={base} categories={categories} />;
  }
  if (theme === 'freebie') {
    return <FreebieFooter settings={settings} base={base} categories={categories} />;
  }
  return (
    <footer className="hidden lg:block mt-auto bg-zh-50 relative">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="absolute -top-5 start-1/2 -translate-x-1/2 size-10 rounded-full bg-zh-surface border border-zh-100 shadow-dk grid place-items-center text-zh-primary"
        aria-label="بازگشت به بالا"
      >
        ↑
      </button>
      <div className="dk-container pt-16 pb-8">
        <div className="flex items-start justify-between gap-10">
          <div className="w-[420px] shrink-0 space-y-4 text-right">
            <p className="text-[18px] font-bold text-zh-ink">{settings.storeName}</p>
            <p className="text-[14px] text-zh-600 leading-7">
              {settings.tagline ||
                'فروشگاه ما با ضمانت کیفیت، ارسال سریع و پشتیبانی حرفه‌ای همراه شماست.'}
            </p>
            {settings.supportPhone ? (
              <p className="text-[14px] text-zh-900 tnum">تلفن: {settings.supportPhone}</p>
            ) : null}
          </div>
          <div className="flex flex-1 justify-between gap-8 text-[14px]">
            <div className="space-y-3 text-right">
              <p className="text-zh-900 font-semibold">محصولات</p>
              <ul className="space-y-3 text-zh-600">
                {categories.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link href={`${base}/products?category=${c.slug}`}>{c.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href={`${base}/products`}>همه کالاها</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3 text-right">
              <p className="text-zh-900 font-semibold">خدمات</p>
              <ul className="space-y-3 text-zh-600">
                <li>
                  <Link href={`${base}/articles`}>مجله فروشگاه</Link>
                </li>
                <li>
                  <Link href={`${base}/track`}>پیگیری سفارش</Link>
                </li>
                <li>
                  <Link href={`${base}/cart`}>سبد خرید</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function RivoFooter({
  settings,
  base,
  categories,
}: {
  settings: StoreSettings;
  base: string;
  categories: Category[];
}) {
  return (
    <footer className="hidden lg:block mt-auto bg-zh-primary text-white relative">
      <div className="dk-container pt-16 pb-8">
        <div className="grid grid-cols-4 gap-10">
          <div className="space-y-5">
            <p className="text-[32px] font-bold tracking-tight">
              {settings.storeName}
            </p>
            <p className="text-[14px] text-zh-primarySoft leading-7 capitalize">
              {settings.tagline || 'فروشگاه آنلاین مد و پوشاک'}
            </p>
          </div>
          <div className="space-y-4 text-right">
            <p className="text-[22px] font-medium uppercase">فروشگاه</p>
            <ul className="space-y-3 text-[20px] text-zh-primarySoft capitalize">
              <li>
                <Link href={`${base}/products`} className="hover:text-white">
                  محصولات
                </Link>
              </li>
              {categories.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/products?category=${c.slug}`}
                    className="hover:text-white"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 text-right">
            <p className="text-[22px] font-medium uppercase">شرکت</p>
            <ul className="space-y-3 text-[20px] text-zh-primarySoft capitalize">
              <li>
                <Link href={`${base}/articles`} className="hover:text-white">
                  مجله
                </Link>
              </li>
              <li>
                <Link href={`${base}/track`} className="hover:text-white">
                  تماس
                </Link>
              </li>
              <li>
                <Link href={`${base}/cart`} className="hover:text-white">
                  سبد خرید
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[22px] font-medium uppercase">خبرنامه</p>
            <form
              className="flex border-2 border-zh-pink overflow-hidden"
              style={{ borderRadius: 'var(--zh-radius)' }}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="ایمیل خود را وارد کنید"
                className="flex-1 h-[57px] px-4 bg-transparent text-white placeholder:text-white/70 outline-none text-[16px]"
                aria-label="ایمیل خبرنامه"
              />
              <button
                type="submit"
                className="h-[57px] px-6 bg-zh-pink text-zh-primary font-medium text-[16px] uppercase shrink-0 hover:opacity-90"
              >
                ارسال
              </button>
            </form>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/20 flex items-center justify-between text-[14px]">
          <p className="text-white/70">
            © {new Date().getFullYear()} {settings.storeName}
          </p>
          <div className="flex gap-6">
            <Link href={`${base}/track`} className="hover:text-zh-primarySoft">
              حریم خصوصی
            </Link>
            <Link href={`${base}/track`} className="hover:text-zh-primarySoft">
              شرایط استفاده
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FreebieFooter({
  settings,
  base,
  categories,
}: {
  settings: StoreSettings;
  base: string;
  categories: Category[];
}) {
  return (
    <footer className="mt-auto bg-zh-50 relative pb-8 lg:pb-0">
      <div className="dk-container relative z-10 -mt-16 lg:-mt-24 mb-10 lg:mb-16 px-4 lg:px-0">
        <div
          className="bg-zh-primary text-white px-6 py-10 lg:px-16 lg:py-14 grid lg:grid-cols-2 gap-8 items-center"
          style={{ borderRadius: '40px' }}
        >
          <h2 className="text-[28px] lg:text-[40px] font-bold uppercase leading-tight text-right">
            از جدیدترین پیشنهادها باخبر شوید
          </h2>
          <form
            className="space-y-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="flex items-center gap-3 h-12 lg:h-14 px-4 bg-white text-zh-ink rounded-full">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0" aria-hidden="true">
                <path d="M3 5l7 5 7-5M3 5h14v10H3V5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
              <input
                type="email"
                placeholder="ایمیل خود را وارد کنید"
                className="flex-1 bg-transparent text-[14px] lg:text-[16px] outline-none min-w-0"
                aria-label="ایمیل خبرنامه"
              />
            </label>
            <button
              type="submit"
              className="w-full h-12 lg:h-14 rounded-full bg-white text-zh-ink text-[14px] lg:text-[16px] font-medium hover:opacity-90 transition-opacity"
            >
              عضویت در خبرنامه
            </button>
          </form>
        </div>
      </div>
      <div className="dk-container pb-10 lg:pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 text-right">
          <div className="col-span-2 space-y-4">
            <p className="text-[24px] lg:text-[33px] font-bold text-zh-ink">{settings.storeName}</p>
            <p className="text-[14px] text-zh-600 leading-7 max-w-sm">
              {settings.tagline ||
                'پوشاک و اکسسوری متناسب با سبک شما — با کیفیت، ارسال سریع و پشتیبانی حرفه‌ای.'}
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-[14px] lg:text-[15px] font-medium uppercase tracking-wide text-zh-400">
              فروشگاه
            </p>
            <ul className="space-y-3 text-[14px] lg:text-[16px] text-zh-ink">
              {categories.slice(0, 4).map((c) => (
                <li key={c.id}>
                  <Link href={`${base}/products?category=${c.slug}`} className="hover:opacity-70">
                    {c.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`${base}/products`} className="hover:opacity-70">
                  همه محصولات
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[14px] lg:text-[15px] font-medium uppercase tracking-wide text-zh-400">
              راهنما
            </p>
            <ul className="space-y-3 text-[14px] lg:text-[16px] text-zh-ink">
              <li>
                <Link href={`${base}/track`} className="hover:opacity-70">
                  پشتیبانی
                </Link>
              </li>
              <li>
                <Link href={`${base}/track`} className="hover:opacity-70">
                  پیگیری سفارش
                </Link>
              </li>
              <li>
                <Link href={`${base}/cart`} className="hover:opacity-70">
                  سبد خرید
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <p className="text-[14px] lg:text-[15px] font-medium uppercase tracking-wide text-zh-400">
              محتوا
            </p>
            <ul className="space-y-3 text-[14px] lg:text-[16px] text-zh-ink">
              <li>
                <Link href={`${base}/articles`} className="hover:opacity-70">
                  مجله
                </Link>
              </li>
              <li>
                <Link href={`${base}/products`} className="hover:opacity-70">
                  تخفیف‌ها
                </Link>
              </li>
              <li>
                <Link href={base} className="hover:opacity-70">
                  درباره ما
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-zh-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-zh-600">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. تمامی حقوق محفوظ است.
          </p>
          {settings.supportPhone ? (
            <p className="tnum">پشتیبانی: {settings.supportPhone}</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

export function MobileTabBar({
  base,
  pathname,
}: {
  base: string;
  pathname: string;
}): ReactNode {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-zh-surface border-t border-zh-100 grid grid-cols-4 h-14 text-[11px] font-medium text-zh-600">
      {[
        { href: base, label: 'خانه', active: pathname === base },
        {
          href: `${base}/products`,
          label: 'دسته‌ها',
          active: pathname.includes('/products'),
        },
        {
          href: `${base}/cart`,
          label: 'سبد',
          active: pathname.includes('/cart') || pathname.includes('/checkout'),
        },
        {
          href: `${base}/track`,
          label: 'پیگیری',
          active: pathname.includes('/track'),
        },
      ].map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`flex flex-col items-center justify-center gap-0.5 ${
            t.active ? 'text-zh-primary' : ''
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
