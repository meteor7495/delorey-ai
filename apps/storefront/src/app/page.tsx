import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-dk-bg text-dk-text">
      <div className="dk-container py-20 text-center dk-fade">
        <div className="inline-grid h-14 w-14 place-items-center rounded-dk-lg bg-dk-red text-white text-xl font-black mb-4">
          S
        </div>
        <h1 className="text-[22px] font-black text-dk-navy mb-2">
          فروشگاه آنلاین سِلوما
        </h1>
        <p className="text-[13px] text-dk-muted max-w-md mx-auto leading-7 mb-6">
          برای ورود به ویترین، اسلاگ فروشگاه را از فضای کاری → تنظیمات فروشگاه
          کپی کنید.
        </p>
        <Link
          href="/s/demo"
          className="inline-flex h-11 items-center rounded-dk bg-dk-red text-white text-[13px] font-extrabold px-5 hover:bg-dk-deep"
        >
          نمونه مسیر /s/[slug]
        </Link>
      </div>
    </main>
  );
}
