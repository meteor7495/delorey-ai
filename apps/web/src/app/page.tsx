import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PLANS } from '@/lib/api';

export default function LandingPage() {
  return (
    <main>
      {/* Hero — one composition: brand, headline, sentence, CTAs, full-bleed plane */}
      <section className="relative min-h-[100dvh] overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 700px at 70% 10%, rgba(31,168,160,0.35), transparent 55%), linear-gradient(160deg, #071018 0%, #0a2a2c 48%, #0f6e6e 120%)',
          }}
        />
        <div
          className="absolute -left-20 top-28 h-72 w-72 rounded-full bg-teal-bright/20 blur-3xl animate-drift"
          aria-hidden
        />
        <div
          className="absolute right-0 bottom-0 h-[55%] w-full opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to top, black, transparent)',
          }}
          aria-hidden
        />

        <SiteHeader />

        <div className="relative container flex min-h-[100dvh] flex-col justify-center pt-20 pb-16">
          <p className="animate-fadeUp text-sm font-bold tracking-[0.2em] text-teal-soft/80 uppercase mb-5">
            DeloRey
          </p>
          <h1
            className="animate-fadeUp max-w-3xl text-4xl sm:text-6xl font-black leading-[1.15] tracking-tight"
            style={{ animationDelay: '80ms' }}
          >
            کارمند فروش هوش مصنوعی برای فروشگاه آنلاین شما
          </h1>
          <p
            className="animate-fadeUp mt-5 max-w-xl text-base sm:text-lg text-white/70 leading-8"
            style={{ animationDelay: '160ms' }}
          >
            ویترین بومی، کانال‌های وب و پیام‌رسان، و پاسخ‌های grounded روی
            کاتالوگ واقعی — همه در یک پلتفرم SaaS.
          </p>
          <div
            className="animate-fadeUp mt-8 flex flex-wrap gap-3"
            style={{ animationDelay: '240ms' }}
          >
            <Link href="/request?plan=professional" className="btn btn-primary">
              شروع رایگان / ثبت درخواست
            </Link>
            <a href="/#pricing" className="btn btn-ghost text-ink">
              مشاهده تعرفه‌ها
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 sm:py-28">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            یک پکیج کامل برای فروش
          </h2>
          <p className="text-ink/60 max-w-2xl mb-10 leading-8">
            فروشگاه بومی شبیه تجربهٔ فروشگاهی آشنا، CMS در فضای کاری، و کارمند
            AI روی همان دادهٔ commerce.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: 'فروشگاه بومی',
                body: 'ویترین عمومی، سبد، COD و پیگیری سفارش روی پلتفرم DeloRey.',
              },
              {
                title: 'کارمند فروش AI',
                body: 'پاسخ grounded روی موجودی و قیمت؛ تلگرام، بله و چت وب با یک مغز.',
              },
              {
                title: 'کنترل در Workspace',
                body: 'CMS، اینباکس، دانش، گاردریل و ممیزی — همه زیر یک سقف.',
              },
            ].map((f, i) => (
              <article
                key={f.title}
                className="rounded-3xl border border-ink/8 bg-white p-6 shadow-[0_10px_40px_rgba(7,16,24,0.04)] animate-fadeUp"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-4 h-1.5 w-12 rounded-full bg-gradient-to-l from-teal to-teal-bright" />
                <h3 className="text-xl font-extrabold mb-2">{f.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="py-20 sm:py-28"
        style={{
          background:
            'linear-gradient(180deg, #e8f0f2 0%, #f4f8f9 40%, #f4f8f9 100%)',
        }}
      >
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            تعرفه‌ها
          </h2>
          <p className="text-ink/60 max-w-2xl mb-10 leading-8">
            قیمت‌های founding برای بازار ایران (فرضیهٔ قیمت‌گذاری). بعد از ثبت
            درخواست، حساب ساخته می‌شود و می‌توانید پرداخت را تکمیل کنید.
          </p>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 border ${
                  plan.featured
                    ? 'bg-ink text-white border-ink shadow-2xl shadow-teal/20 scale-[1.02]'
                    : 'bg-white border-ink/8'
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 start-6 rounded-full bg-teal-bright px-3 py-1 text-xs font-black text-ink">
                    پیشنهادی
                  </span>
                ) : null}
                <h3 className="text-xl font-extrabold">{plan.name}</h3>
                <p
                  className={`mt-1 text-sm ${plan.featured ? 'text-white/65' : 'text-ink/55'}`}
                >
                  {plan.blurb}
                </p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span
                    className={`text-sm ${plan.featured ? 'text-white/55' : 'text-ink/45'}`}
                  >
                    {plan.unit}
                  </span>
                </div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-teal-bright">✓</span>
                      <span
                        className={
                          plan.featured ? 'text-white/85' : 'text-ink/70'
                        }
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/request?plan=${plan.id}`}
                  className={`btn mt-8 w-full ${
                    plan.featured ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  انتخاب {plan.name}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container rounded-[2rem] overflow-hidden relative px-6 py-14 sm:px-12 text-white"
          style={{
            background:
              'linear-gradient(120deg, #0f6e6e, #071018 60%)',
          }}
        >
          <h2 className="text-3xl font-black max-w-xl leading-snug">
            آماده‌اید کارمند فروش AI را استخدام کنید؟
          </h2>
          <p className="mt-3 text-white/70 max-w-lg leading-8">
            درخواست بدهید؛ حساب به‌صورت خودکار ساخته می‌شود. پرداخت را تکمیل کنید
            و وارد Workspace شوید.
          </p>
          <Link
            href="/request?plan=professional"
            className="btn btn-primary mt-7"
          >
            ثبت درخواست دسترسی
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/8 py-8 text-sm text-ink/45">
        <div className="container flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold text-ink/70">DeloRey AI</span>
          <span>SaaS برای فروشگاه‌های آنلاین ایران</span>
        </div>
      </footer>
    </main>
  );
}
