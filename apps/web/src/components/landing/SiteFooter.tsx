import Link from 'next/link';
import { FOOTER_LINKS } from '@/lib/landing-content';
import { WORKSPACE_URL } from '@/lib/api';

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/8 bg-white py-12 sm:py-14">
      <div className="container">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 no-underline mb-4">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white text-sm font-black shadow-lg shadow-primary/20">
                S
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-ink">
                Seloma
              </span>
            </Link>
            <p className="text-sm leading-7 text-ink/50 max-w-xs">
              پلتفرم تجارت هوشمند — تیم هوشمند برای فروشگاه‌های آنلاین.
            </p>
          </div>

          <div>
            <p className="text-xs font-black text-ink/40 mb-4">محصول</p>
            <nav className="flex flex-col gap-2.5 text-sm font-bold text-ink/60">
              {FOOTER_LINKS.product.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-primary-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-black text-ink/40 mb-4">یکپارچگی</p>
            <nav className="flex flex-col gap-2.5 text-sm font-bold text-ink/60">
              {FOOTER_LINKS.integrations.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-primary-text transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-black text-ink/40 mb-4">منابع</p>
            <nav className="flex flex-col gap-2.5 text-sm font-bold text-ink/60">
              {FOOTER_LINKS.resources.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-primary-text transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <a
                href={WORKSPACE_URL}
                className="hover:text-primary-text transition-colors"
              >
                ورود
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-ink/8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-ink/40">
          <p>© {new Date().getFullYear()} سِلوما — تجارت هوشمند</p>
          <p>ساخته‌شده برای کسب‌وکارهای آنلاین ایران</p>
        </div>
      </div>
    </footer>
  );
}
