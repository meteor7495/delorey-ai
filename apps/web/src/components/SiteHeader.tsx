import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-bright to-teal text-white text-sm font-black shadow-lg shadow-teal/30">
            D
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            DeloRey
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm font-bold text-white/80">
          <a href="/#about" className="hover:text-white transition-colors">
            کی هستیم
          </a>
          <a href="/#features" className="hover:text-white transition-colors">
            امکانات
          </a>
          <a href="/#pricing" className="hover:text-white transition-colors">
            تعرفه‌ها
          </a>
          <Link href="/request" className="hover:text-white transition-colors">
            ثبت درخواست
          </Link>
          <a
            href={
              process.env.NEXT_PUBLIC_WORKSPACE_URL ??
              'http://localhost:3010/login'
            }
            className="btn btn-ghost !py-2 !px-4 text-sm"
          >
            ورود
          </a>
        </nav>
      </div>
    </header>
  );
}
