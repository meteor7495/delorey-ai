import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { PLANS } from '@/lib/api';

const FEATURES = [
  {
    title: 'فروشگاه بومی',
    body: 'ویترین عمومی، سبد، پرداخت در محل و پیگیری سفارش — بدون وابستگی به ابزارهای پراکنده.',
  },
  {
    title: 'کارمند فروش AI',
    body: 'پاسخ grounded روی موجودی و قیمت واقعی؛ وب، تلگرام و بله با یک مغز مشترک.',
  },
  {
    title: 'اینباکس یکپارچه',
    body: 'گفتگوهای همه کانال‌ها در یک جا؛ تحویل به انسان وقتی لازم است.',
  },
  {
    title: 'دانش و گاردریل',
    body: 'سیاست‌ها، پرسش‌های متداول و سقف‌ها را شما تعریف می‌کنید؛ AI داخل همان مرزها کار می‌کند.',
  },
  {
    title: 'همگام‌سازی کاتالوگ',
    body: 'قیمت و موجودی از فروشگاه شما می‌آید تا پاسخ‌ها حدس نباشند.',
  },
  {
    title: 'انتساب و آنالیتیکس',
    body: 'ببینید گفتگوها چطور به سفارش و صرفه‌جویی زمان پشتیبانی وصل می‌شوند.',
  },
] as const;

export default function LandingPage() {
  return (
    <main>
      <section className="relative min-h-[100dvh] overflow-hidden text-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1100px 640px at 78% 8%, rgba(31,168,160,0.38), transparent 58%), radial-gradient(700px 480px at 12% 88%, rgba(15,110,110,0.35), transparent 55%), linear-gradient(165deg, #071018 0%, #0a2428 42%, #0f6e6e 130%)',
          }}
        />
        <div
          className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-teal-bright/18 blur-3xl animate-drift"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'linear-gradient(to top, black 10%, transparent)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute end-[-4%] top-[22%] hidden w-[min(420px,42vw)] lg:block"
          aria-hidden
        >
          <div className="animate-fadeUp rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md shadow-2xl shadow-black/30"
            style={{ animationDelay: '320ms' }}
          >
            <div className="mb-3 flex items-center gap-2 text-xs text-white/55">
              <span className="h-2 w-2 rounded-full bg-teal-bright" />
              کارمند فروش · فعال
            </div>
            <div className="space-y-2.5 text-sm leading-7">
              <p className="rounded-xl bg-white/10 px-3 py-2 text-white/85">
                سایز M موجوده؟ ارسال به شیراز چند روزه؟
              </p>
              <p className="rounded-xl bg-teal/50 px-3 py-2 text-white">
                بله، M موجود است. ارسال به شیراز معمولاً ۲ تا ۳ روز کاری است.
              </p>
            </div>
          </div>
        </div>

        <SiteHeader />

        <div className="relative container flex min-h-[100dvh] flex-col justify-center pt-20 pb-16">
          <p className="animate-fadeUp font-display text-2xl sm:text-3xl font-bold tracking-tight text-teal-soft mb-4">
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
            <a href="/#pricing" className="btn btn-ghost">
              مشاهده تعرفه‌ها
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 sm:py-28">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-teal uppercase mb-4">
              کی هستیم
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug mb-5">
              لایه عملیاتی فروش هوشمند برای کسب‌وکارهای آنلاین ایران
            </h2>
            <p className="text-ink/65 max-w-2xl leading-8 text-base sm:text-lg">
              DeloRey یک Commerce OS است — نه چت‌بات‌ساز و نه تیکتینگ. کارمند
              فروش AI را به کاتالوگ، سفارش و سیاست‌های واقعی فروشگاه وصل می‌کنیم
              تا هر گفتگو روی وب، تلگرام یا بله تبدیل به فرصت فروش شود، نه فقط
              یک پیام بی‌پاسخ.
            </p>
          </div>
          <ul className="space-y-5 border-s-2 border-teal/25 ps-6">
            {[
              'برای فروشگاه‌های مد، آرایشی، الکترونیک و برندهای D2C',
              'تمرکز روی تبدیل گفتگو به درآمد، نه حجم پیام',
              'کنترل با شماست؛ گاردریل و تحویل به انسان بخشی از محصول است',
            ].map((item) => (
              <li key={item} className="text-sm sm:text-base leading-7 text-ink/70">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="features"
        className="py-20 sm:py-28"
        style={{
          background:
            'linear-gradient(180deg, #e8f0f2 0%, #f4f8f9 35%, #f4f8f9 100%)',
        }}
      >
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            امکانات
          </h2>
          <p className="text-ink/60 max-w-2xl mb-12 leading-8">
            یک پکیج کامل برای فروش: فروشگاه، کانال‌ها، کارمند AI و فضای کاری —
            همه روی همان دادهٔ commerce.
          </p>
          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <article
                key={f.title}
                className="animate-fadeUp"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="mb-3 h-1 w-10 rounded-full bg-gradient-to-l from-teal to-teal-bright" />
                <h3 className="text-xl font-extrabold mb-2">{f.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 sm:py-28">
        <div className="container">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            تعرفه‌ها
          </h2>
          <p className="text-ink/60 max-w-2xl mb-10 leading-8">
            قیمت‌های founding برای بازار ایران. بعد از ثبت درخواست، حساب ساخته
            می‌شود و می‌توانید پرداخت را تکمیل کنید.
          </p>
          <div className="grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 border ${
                  plan.featured
                    ? 'bg-ink text-white border-ink shadow-2xl shadow-teal/20 lg:scale-[1.02]'
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
                      <span className="text-teal-bright shrink-0">✓</span>
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

      <section className="pb-20">
        <div
          className="container relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 text-white"
          style={{
            background: 'linear-gradient(125deg, #0f6e6e, #071018 62%)',
          }}
        >
          <div
            className="absolute -end-16 -top-16 h-48 w-48 rounded-full bg-teal-bright/25 blur-3xl"
            aria-hidden
          />
          <h2 className="relative text-3xl font-black max-w-xl leading-snug">
            آماده‌اید کارمند فروش AI را استخدام کنید؟
          </h2>
          <p className="relative mt-3 text-white/70 max-w-lg leading-8">
            درخواست بدهید؛ حساب به‌صورت خودکار ساخته می‌شود. پرداخت را تکمیل کنید
            و وارد Workspace شوید.
          </p>
          <Link
            href="/request?plan=professional"
            className="btn btn-primary relative mt-7"
          >
            ثبت درخواست دسترسی
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink/8 py-8 text-sm text-ink/45">
        <div className="container flex flex-wrap items-center justify-between gap-3">
          <span className="font-bold text-ink/70">DeloRey AI</span>
          <nav className="flex flex-wrap gap-5">
            <a href="/#about" className="hover:text-ink/70">
              کی هستیم
            </a>
            <a href="/#features" className="hover:text-ink/70">
              امکانات
            </a>
            <a href="/#pricing" className="hover:text-ink/70">
              تعرفه‌ها
            </a>
          </nav>
          <span>SaaS برای فروشگاه‌های آنلاین ایران</span>
        </div>
      </footer>
    </main>
  );
}
