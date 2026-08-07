'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

type Settings = {
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

export function StoreShell({
  settings,
  widget,
  children,
}: {
  settings: Settings;
  widget?: Widget;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/s/${settings.storeSlug}`;

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--brand',
      settings.primaryColor || '#ef4056',
    );
    document.documentElement.style.setProperty(
      '--ink',
      settings.secondaryColor || '#0c0c0c',
    );
  }, [settings.primaryColor, settings.secondaryColor]);

  useEffect(() => {
    if (!widget?.publicKey || !widget.widgetBase) return;
    const existing = document.querySelector('script[data-delorey-embed]');
    if (existing) return;
    const script = document.createElement('script');
    script.src = `${widget.widgetBase}/embed.js`;
    script.async = true;
    script.dataset.deloreyEmbed = '1';
    script.dataset.publicKey = widget.publicKey;
    script.dataset.apiBase = widget.apiBase;
    document.body.appendChild(script);
  }, [widget]);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header
        className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/95 backdrop-blur"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}
      >
        <div className="container flex h-14 items-center gap-4">
          <Link href={base} className="flex items-center gap-2 font-extrabold text-lg">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-white text-sm"
                style={{ background: 'var(--brand)' }}
              >
                D
              </span>
            )}
            <span>{settings.storeName}</span>
          </Link>
          <nav className="ms-auto flex items-center gap-1 text-sm font-semibold">
            <Link
              href={`${base}/products`}
              className={`px-3 py-2 rounded-lg ${pathname.includes('/products') ? 'bg-[#f0f0f1]' : 'hover:bg-[#f7f7f8]'}`}
            >
              محصولات
            </Link>
            <Link
              href={`${base}/cart`}
              className={`px-3 py-2 rounded-lg ${pathname.endsWith('/cart') || pathname.includes('/checkout') ? 'bg-[#f0f0f1]' : 'hover:bg-[#f7f7f8]'}`}
            >
              سبد
            </Link>
            <Link
              href={`${base}/track`}
              className={`px-3 py-2 rounded-lg ${pathname.endsWith('/track') ? 'bg-[#f0f0f1]' : 'hover:bg-[#f7f7f8]'}`}
            >
              پیگیری
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-10">{children}</main>

      <footer className="border-t border-[var(--line)] bg-white py-6 text-sm text-[var(--muted)]">
        <div className="container flex flex-wrap items-center justify-between gap-2">
          <span>{settings.storeName}</span>
          {settings.supportPhone ? <span>پشتیبانی: {settings.supportPhone}</span> : null}
        </div>
      </footer>
    </div>
  );
}
