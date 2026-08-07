import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container py-16 text-center fade-up">
      <h1 className="text-2xl font-extrabold mb-3">فروشگاه DeloRey</h1>
      <p className="text-[var(--muted)] mb-6">
        برای مشاهده ویترین، اسلاگ فروشگاه را از Workspace → تنظیمات فروشگاه بگیرید.
      </p>
      <Link className="btn btn-brand" href="/s/demo">
        نمونه مسیر /s/[slug]
      </Link>
    </main>
  );
}
