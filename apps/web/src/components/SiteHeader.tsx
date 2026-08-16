'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/#about', label: 'کی هستیم' },
  { href: '/#features', label: 'امکانات' },
  { href: '/#pricing', label: 'تعرفه‌ها' },
] as const;

const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_WORKSPACE_URL ?? 'http://localhost:3010/login';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background,box-shadow,backdrop-filter] duration-300 ${
        scrolled || open
          ? 'bg-[var(--color-text-primary)]/92 backdrop-blur-xl shadow-[0_10px_30px_rgba(26,22,37,0.22)]'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white text-sm font-black shadow-lg shadow-primary/30">
            S
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Seloma
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-bold text-white/75">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 hover:bg-white/8 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/request"
            className="rounded-lg px-3 py-2 hover:bg-white/8 hover:text-white transition-colors"
          >
            ثبت درخواست
          </Link>
          <a
            href={WORKSPACE_URL}
            className="btn btn-ghost !py-2 !px-4 !text-sm ms-2"
          >
            ورود
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'بستن منو' : 'باز کردن منو'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-white transition-transform duration-200 ${
                open ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute inset-x-0 top-[6px] h-0.5 rounded-full bg-white transition-opacity duration-200 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`absolute inset-x-0 top-[12px] h-0.5 rounded-full bg-white transition-transform duration-200 ${
                open ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`md:hidden overflow-hidden border-t border-white/10 transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="container flex flex-col gap-1 py-4 text-sm font-bold text-white/85">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-3 hover:bg-white/8"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/request"
            className="rounded-xl px-3 py-3 hover:bg-white/8"
            onClick={() => setOpen(false)}
          >
            ثبت درخواست
          </Link>
          <div className="mt-2 grid gap-2 px-1 pb-1">
            <Link
              href="/request?plan=site-growth"
              className="btn btn-primary"
              onClick={() => setOpen(false)}
            >
              شروع کنید
            </Link>
            <a href={WORKSPACE_URL} className="btn btn-outline-light">
              ورود به Workspace
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
