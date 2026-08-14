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
            <Link href={`${base}/track`}>تماس</Link>
          </nav>
          <SearchField q={q} setQ={setQ} onSearch={onSearch} rounded="rounded-md" />
          <CartLink base={base} pathname={pathname} />
        </div>
      </header>
    </>
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
