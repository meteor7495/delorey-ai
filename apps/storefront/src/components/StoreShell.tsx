'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';

export type StoreSettings = {
  storeName: string;
  storeSlug: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  tagline?: string | null;
  supportPhone?: string | null;
};

type Widget = {
  publicKey: string;
  apiBase: string;
  widgetBase: string;
} | null;

type Category = { id: string; name: string; slug: string; imageUrl?: string | null };

function FigmaIcon({ src, alt = '', size = 24 }: { src: string; alt?: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="block size-full object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function StoreShell({
  settings,
  widget,
  categories = [],
  children,
}: {
  settings: StoreSettings;
  widget?: Widget;
  categories?: Category[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/s/${settings.storeSlug}`;
  const [q, setQ] = useState('');
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const primary = settings.primaryColor || '#9B59B6';
    document.documentElement.style.setProperty('--brand', primary);
    document.documentElement.style.setProperty('--zh-primary', primary);
    document.documentElement.style.setProperty('--dk-red', primary);
  }, [settings.primaryColor]);

  useEffect(() => {
    if (!widget?.publicKey || !widget.widgetBase) return;
    if (document.querySelector('script[data-delorey-embed]')) return;
    const script = document.createElement('script');
    script.src = `${widget.widgetBase}/embed.js`;
    script.async = true;
    script.dataset.deloreyEmbed = '1';
    script.dataset.publicKey = widget.publicKey;
    script.dataset.apiBase = widget.apiBase;
    document.body.appendChild(script);
  }, [widget]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query
        ? `${base}/products?q=${encodeURIComponent(query)}`
        : `${base}/products`,
    );
  }

  const navItems = [
    {
      href: `${base}/products`,
      label: 'شگفت انگیزها',
      icon: '/figma/icon-sparkle.svg',
    },
    {
      href: `${base}/products`,
      label: 'ترند ترین',
      icon: '/figma/icon-medal.svg',
    },
    {
      href: `${base}/products`,
      label: 'پرفروش ترین',
      icon: '/figma/icon-cup.svg',
    },
    {
      href: `${base}/products`,
      label: 'محبوب ترین',
      icon: '/figma/icon-heart.svg',
    },
    { href: `${base}/track`, label: 'سوالات شما', icon: null as string | null },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white text-zh-800">
      {/* Top promo strip */}
      <div className="hidden lg:block bg-zh-primary text-white text-[14px]">
        <div className="dk-container flex h-10 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="border-l border-white pl-3">۵۰٪ تخفیف</span>
            <span>فروش بهاره</span>
          </div>
          <div className="flex items-center gap-2">
            <span>خرید بیش از یک میلیون تومان ارسال رایگان</span>
            <span className="border-l border-white pl-3">خدمات رایگان</span>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 bg-white border-b border-zh-100">
        <div className="dk-container pt-4 pb-3 lg:pt-6 lg:pb-4">
          <div className="flex items-center gap-3 lg:gap-6">
            <Link href={base} className="shrink-0 flex items-center">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="h-8 lg:h-9 w-auto max-w-[140px] object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/figma/logo.svg"
                  alt={settings.storeName}
                  className="h-8 lg:h-9 w-auto"
                />
              )}
            </Link>

            <form
              onSubmit={onSearch}
              className="flex-1 relative min-w-0"
              role="search"
            >
              <span className="pointer-events-none absolute inset-y-0 end-4 flex items-center text-zh-400">
                <FigmaIcon src="/figma/icon-search.svg" size={24} />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جستجو"
                className="w-full h-12 rounded-dk-lg border border-zh-300 bg-white pe-12 ps-4 text-[16px] text-zh-900 placeholder:text-zh-400 outline-none focus:border-zh-primary focus:ring-2 focus:ring-zh-primary/15"
              />
            </form>

            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <Link
                href={`${base}/track`}
                className="flex h-10 items-center gap-2 rounded-dk border border-zh-100 px-3 hover:bg-zh-50"
                aria-label="حساب کاربری"
              >
                <FigmaIcon src="/figma/icon-user.svg" size={24} />
                <FigmaIcon src="/figma/icon-arrow-down.svg" size={20} />
              </Link>
              <Link
                href={`${base}/cart`}
                className={`flex h-10 w-10 items-center justify-center rounded-dk border border-zh-100 hover:bg-zh-50 ${
                  pathname.includes('/cart') || pathname.includes('/checkout')
                    ? 'text-zh-primary'
                    : ''
                }`}
                aria-label="سبد خرید"
              >
                <FigmaIcon src="/figma/icon-cart.svg" size={24} />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-zh-50">
          <div className="dk-container flex items-center gap-4 h-[74px] overflow-x-auto dk-scrollbar-hide">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="flex items-center gap-3 text-[16px] text-zh-primary"
              >
                <span className="size-6 overflow-hidden">
                  <FigmaIcon src="/figma/icon-menu.svg" size={24} />
                </span>
                دسته بندی کالاها
              </button>
              {catOpen && (
                <div className="absolute top-full start-0 z-50 mt-2 w-64 rounded-dk-xl border border-zh-100 bg-white shadow-dk-card py-2">
                  {categories.length === 0 ? (
                    <p className="px-4 py-3 text-zh-600 text-[14px]">
                      هنوز دسته‌ای تعریف نشده
                    </p>
                  ) : (
                    categories.map((c) => (
                      <Link
                        key={c.id}
                        href={`${base}/products?category=${c.slug}`}
                        className="flex items-center justify-between px-4 py-2.5 text-[14px] hover:bg-zh-50"
                        onClick={() => setCatOpen(false)}
                      >
                        {c.name}
                      </Link>
                    ))
                  )}
                  <Link
                    href={`${base}/products`}
                    className="block px-4 py-2.5 text-[14px] text-zh-primary border-t border-zh-100"
                    onClick={() => setCatOpen(false)}
                  >
                    همه محصولات
                  </Link>
                </div>
              )}
            </div>

            <nav className="flex items-center gap-6 text-[16px] text-zh-900">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="shrink-0 flex items-center gap-1 whitespace-nowrap hover:text-zh-primary"
                >
                  {item.icon ? (
                    <span className="size-6 overflow-hidden">
                      <FigmaIcon src={item.icon} size={24} />
                    </span>
                  ) : null}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 lg:pb-0">{children}</main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-zh-100 grid grid-cols-4 h-14 text-[11px] font-medium text-zh-600">
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

      <footer className="hidden lg:block mt-auto bg-zh-primary-50 relative">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute -top-5 start-1/2 -translate-x-1/2 size-10 rounded-full bg-white border border-zh-100 shadow-dk grid place-items-center text-zh-primary"
          aria-label="بازگشت به بالا"
        >
          ↑
        </button>

        <div className="dk-container pt-16 pb-8">
          <div className="flex items-start justify-between gap-10">
            <div className="w-[500px] shrink-0 space-y-6 text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/figma/footer-logo.svg" alt="" className="h-8 w-auto ms-auto" />
              <div>
                <p className="text-[14px] font-semibold text-zh-900 mb-2">
                  درباره {settings.storeName}
                </p>
                <p className="text-[14px] text-zh-600 leading-7">
                  {settings.tagline ||
                    'فروشگاه ما با ارائه مجموعه‌ای متنوع از محصولات خانه، تجربه‌ای آسان و مطمئن برای خرید آنلاین فراهم کرده است. با ضمانت کیفیت، ارسال سریع و پشتیبانی حرفه‌ای، همراه شما هستیم.'}
                </p>
              </div>
              <p className="text-[14px] text-zh-900 tnum">
                تلفن پشتیبانی:{' '}
                {settings.supportPhone || '۰۲۱-۴۴۳۴۹۸۶۷'}
              </p>
              <p className="text-[14px] text-zh-900">همراه ما باشید</p>
            </div>

            <div className="flex flex-1 justify-between gap-8 text-[14px]">
              <div className="space-y-3 text-right">
                <p className="text-zh-900 font-semibold">محصولات</p>
                <ul className="space-y-3 text-zh-600">
                  {categories.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <Link href={`${base}/products?category=${c.slug}`}>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                  {categories.length === 0 && (
                    <>
                      <li>
                        <Link href={`${base}/products`}>همه کالاها</Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-zh-900 font-semibold">خدمات مشتریان</p>
                <ul className="space-y-3 text-zh-600">
                  <li>
                    <Link href={`${base}/track`}>پیگیری سفارش</Link>
                  </li>
                  <li>شرایط و قوانین</li>
                  <li>روش‌های ارسال</li>
                  <li>سوالات متداول</li>
                </ul>
              </div>
              <div className="space-y-3 text-right">
                <p className="text-zh-900 font-semibold">درباره ما</p>
                <ul className="space-y-3 text-zh-600">
                  <li>معرفی فروشگاه</li>
                  <li>تماس با ما</li>
                  <li>همکاری با ما</li>
                  <li>
                    <Link href={`${base}/products`}>وبلاگ</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-zh-200 flex flex-wrap gap-4 items-stretch">
            <div className="flex-1 min-w-[280px] bg-white rounded-dk-xl px-6 py-5 flex flex-wrap items-center justify-around gap-4">
              {[
                { t: 'ارسال سریع', d: 'در کمترین زمان ممکن' },
                { t: 'ضمانت بازگشت کالا', d: 'حداکثر ۱۰ روز کاری' },
                { t: 'اصالت کالا', d: 'از بهترین برندها' },
              ].map((x) => (
                <div key={x.t} className="text-right">
                  <p className="text-[16px] text-zh-900">{x.t}</p>
                  <p className="text-[14px] text-zh-500">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-zh-900 text-zh-300 text-[14px]">
          <div className="dk-container flex flex-wrap items-center justify-between gap-3 py-4">
            <p>
              کلیه حقوق این سایت متعلق به {settings.storeName} می‌باشد.
            </p>
            <p className="tnum">
              © {new Date().getFullYear()} — powered by DeloRey
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
