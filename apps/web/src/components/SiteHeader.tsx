'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CTAS, NAV_LINKS } from '@/lib/landing-content';

const WORKSPACE_URL =
  process.env.NEXT_PUBLIC_WORKSPACE_URL ?? 'http://localhost:3010/login';

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [onHero, setOnHero] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setOnHero(y < window.innerHeight * 0.65);
    };
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

  const isHero = onHero;
  const compact = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        compact
          ? isHero
            ? 'bg-[var(--color-text-primary)]/92 backdrop-blur-xl shadow-[0_10px_30px_rgba(26,22,37,0.22)]'
            : 'bg-white/92 backdrop-blur-xl shadow-[0_10px_30px_rgba(26,22,37,0.08)] border-b border-ink/8'
          : isHero
            ? 'bg-transparent'
            : 'bg-white/80 backdrop-blur-md border-b border-ink/8'
      }`}
    >
      <div
        className={`container flex items-center justify-between transition-[height] duration-300 ${
          compact ? 'h-14' : 'h-16'
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 no-underline"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white text-sm font-black shadow-lg shadow-primary/30">
            S
          </span>
          <span
            className={`font-display text-lg font-bold tracking-tight ${
              isHero && !compact ? 'text-white' : compact && !isHero ? 'text-ink' : 'text-white'
            } ${compact && isHero ? 'text-white' : ''}`}
          >
            Seloma
          </span>
        </Link>

        <nav
          className={`hidden lg:flex items-center gap-0.5 text-sm font-bold ${
            isHero && !compact
              ? 'text-white/75'
              : compact && !isHero
                ? 'text-ink/65'
                : 'text-white/75'
          }`}
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-lg px-2.5 py-2 transition-colors ${
                isHero || (compact && isHero)
                  ? 'hover:bg-white/8 hover:text-white'
                  : 'hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {item.label}
            </a>
          ))}
          <a
            href={WORKSPACE_URL}
            className={`rounded-lg px-2.5 py-2 transition-colors ${
              isHero || (compact && isHero)
                ? 'hover:bg-white/8 hover:text-white'
                : 'hover:bg-ink/5 hover:text-ink'
            }`}
          >
            ورود
          </a>
          <Link
            href={CTAS.primary.href}
            className="btn btn-primary !py-2 !px-4 !text-sm ms-2"
          >
            {CTAS.primary.label}
          </Link>
        </nav>

        <button
          type="button"
          className={`lg:hidden grid h-10 w-10 place-items-center rounded-xl border ${
            isHero && !compact
              ? 'border-white/15 bg-white/5 text-white'
              : 'border-ink/10 bg-ink/5 text-ink'
          }`}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'بستن منو' : 'باز کردن منو'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-4">
            <span
              className={`absolute inset-x-0 top-0 h-0.5 rounded-full transition-transform duration-200 ${
                isHero && !compact ? 'bg-white' : 'bg-ink'
              } ${open ? 'translate-y-[6px] rotate-45' : ''}`}
            />
            <span
              className={`absolute inset-x-0 top-[6px] h-0.5 rounded-full transition-opacity duration-200 ${
                isHero && !compact ? 'bg-white' : 'bg-ink'
              } ${open ? 'opacity-0' : ''}`}
            />
            <span
              className={`absolute inset-x-0 top-[12px] h-0.5 rounded-full transition-transform duration-200 ${
                isHero && !compact ? 'bg-white' : 'bg-ink'
              } ${open ? '-translate-y-[6px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`lg:hidden overflow-hidden border-t transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-[32rem] opacity-100' : 'max-h-0 opacity-0'
        } ${
          isHero
            ? 'border-white/10 bg-[var(--color-text-primary)]/98'
            : 'border-ink/8 bg-white/98'
        }`}
      >
        <nav
          className={`container flex flex-col gap-1 py-4 text-sm font-bold ${
            isHero ? 'text-white/85' : 'text-ink/80'
          }`}
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`rounded-xl px-3 py-3 ${
                isHero ? 'hover:bg-white/8' : 'hover:bg-ink/5'
              }`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a
            href={WORKSPACE_URL}
            className={`rounded-xl px-3 py-3 ${
              isHero ? 'hover:bg-white/8' : 'hover:bg-ink/5'
            }`}
            onClick={() => setOpen(false)}
          >
            ورود
          </a>
          <div className="mt-2 grid gap-2 px-1 pb-1">
            <Link
              href={CTAS.primary.href}
              className="btn btn-primary"
              onClick={() => setOpen(false)}
            >
              {CTAS.primary.label}
            </Link>
            <a
              href={CTAS.secondary.href}
              className={isHero ? 'btn btn-outline-light' : 'btn btn-soft'}
              onClick={() => setOpen(false)}
            >
              {CTAS.secondary.label}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
