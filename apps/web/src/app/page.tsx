import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import {
  AI_EMPLOYEE_PLANS,
  DEFAULT_PLAN_ID,
  SITE_BUILDER_PLANS,
  type Plan,
} from '@/lib/api';

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      className={`plan-card ${plan.featured ? 'plan-card--featured lg:-mt-2 lg:mb-2' : ''}`}
    >
      {plan.featured ? (
        <span className="mb-4 inline-flex w-fit rounded-lg bg-teal-bright px-2.5 py-1 text-[11px] font-black text-ink">
          {plan.category === 'site'
            ? 'پیشنهادی برای اکثر فروشگاه‌ها'
            : 'هستهٔ محصول DeloRey'}
        </span>
      ) : (
        <span className="mb-4 inline-flex h-[26px]" aria-hidden />
      )}
      <h3 className="text-xl font-extrabold">{plan.name}</h3>
      <p
        className={`mt-1 text-sm leading-6 ${
          plan.featured ? 'text-white/65' : 'text-ink/55'
        }`}
      >
        {plan.blurb}
      </p>
      <div className="mt-6 flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tight">{plan.price}</span>
        <span
          className={`text-sm ${plan.featured ? 'text-white/50' : 'text-ink/45'}`}
        >
          {plan.unit}
        </span>
      </div>
      <ul className="mt-6 space-y-2.5 text-sm flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2.5">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-[11px] font-black ${
                plan.featured
                  ? 'bg-teal-bright/20 text-teal-bright'
                  : 'bg-teal/10 text-teal'
              }`}
            >
              ✓
            </span>
            <span className={plan.featured ? 'text-white/85' : 'text-ink/70'}>
              {f}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={`/request?plan=${plan.id}`}
        className={`btn mt-8 w-full ${
          plan.featured ? 'btn-primary' : 'btn-soft'
        }`}
      >
        {plan.cta}
      </Link>
    </article>
  );
}

const FEATURES = [
  {
    title: 'فروشگاه بومی',
    body: 'ویترین عمومی، سبد، پرداخت در محل و پیگیری سفارش — بدون ابزارهای پراکنده.',
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
    body: 'سیاست‌ها و سقف‌ها را شما تعریف می‌کنید؛ AI داخل همان مرزها کار می‌کند.',
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

const ABOUT_POINTS = [
  {
    title: 'مخاطب ما',
    body: 'فروشگاه‌های مد، آرایشی، الکترونیک و برندهای D2C که کانال پیام‌رسان دارند.',
  },
  {
    title: 'معیار موفقیت',
    body: 'تبدیل گفتگو به درآمد و کاهش ساعت پشتیبانی — نه فقط حجم پیام.',
  },
  {
    title: 'کنترل شما',
    body: 'گاردریل و تحویل به انسان بخشی از محصول است؛ نه آپشن لوکس.',
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
              'radial-gradient(1000px 620px at 85% 0%, rgba(31,168,160,0.42), transparent 55%), radial-gradient(720px 520px at 0% 100%, rgba(15,110,110,0.28), transparent 50%), linear-gradient(168deg, #050d12 0%, #0a1f24 46%, #0d5558 125%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, black 28%, black 72%, transparent 100%)',
          }}
          aria-hidden
        />
        <div
          className="absolute -start-28 top-16 h-[22rem] w-[22rem] rounded-full bg-teal-bright/20 blur-3xl animate-drift"
          aria-hidden
        />

        <SiteHeader />

        <div className="relative container grid min-h-[100dvh] items-center gap-12 pt-24 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="max-w-2xl">
            <p className="animate-fadeUp font-display text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-white mb-3">
              DeloRey
            </p>
            <h1
              className="animate-fadeUp text-[2rem] sm:text-5xl lg:text-[3.35rem] font-black leading-[1.2] tracking-tight"
              style={{ animationDelay: '80ms' }}
            >
              کارمند فروش هوش مصنوعی برای فروشگاه آنلاین شما
            </h1>
            <p
              className="animate-fadeUp mt-5 max-w-lg text-base sm:text-lg text-white/68 leading-8"
              style={{ animationDelay: '160ms' }}
            >
              ویترین بومی، کانال‌های وب و پیام‌رسان، و پاسخ دقیق روی کاتالوگ
              واقعی — همه در یک پلتفرم.
            </p>
            <div
              className="animate-fadeUp mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Link
                href={`/request?plan=${DEFAULT_PLAN_ID}`}
                className="btn btn-primary"
              >
                ثبت درخواست دسترسی
              </Link>
              <a href="/#pricing" className="btn btn-outline-light">
                مشاهده تعرفه‌ها
              </a>
            </div>
          </div>

          <div
            className="animate-fadeUp relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ animationDelay: '280ms' }}
            aria-hidden
          >
            <div className="absolute -inset-6 rounded-[2rem] bg-teal-bright/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/14 bg-[#0b171c]/78 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="status-dot" />
                  کارمند فروش · فعال
                </div>
                <div className="flex gap-1.5">
                  {['وب', 'تلگرام', 'بله'].map((ch) => (
                    <span
                      key={ch}
                      className="rounded-md bg-white/8 px-2 py-1 text-[11px] font-bold text-white/55"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3 p-4 sm:p-5">
                <div className="max-w-[88%] rounded-2xl rounded-se-md bg-white/10 px-3.5 py-2.5 text-sm leading-7 text-white/88">
                  سایز M از این کت موجوده؟ ارسال شیراز چقدر طول می‌کشه؟
                </div>
                <div className="ms-auto max-w-[90%] rounded-2xl rounded-ss-md bg-gradient-to-l from-teal to-teal-bright/90 px-3.5 py-2.5 text-sm leading-7 text-white shadow-lg shadow-teal/20">
                  بله، سایز M موجود است. ارسال به شیراز معمولاً ۲ تا ۳ روز کاری
                  است. می‌خواهید لینک سفارش را بفرستم؟
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/45">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-bright/80" />
                  grounded روی موجودی و سیاست ارسال فروشگاه
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section-anchor py-20 sm:py-28">
        <div className="container">
          <div className="max-w-3xl">
            <p className="eyebrow mb-4">کی هستیم</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug mb-5">
              لایه عملیاتی فروش هوشمند برای کسب‌وکارهای آنلاین ایران
            </h2>
            <p className="text-ink/65 leading-8 text-base sm:text-lg">
              DeloRey یک Commerce OS است — نه چت‌بات‌ساز و نه تیکتینگ. کارمند
              فروش AI را به کاتالوگ، سفارش و سیاست‌های واقعی فروشگاه وصل می‌کنیم
              تا هر گفتگو روی وب، تلگرام یا بله فرصت فروش باشد، نه پیام بی‌پاسخ.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {ABOUT_POINTS.map((item, i) => (
              <div
                key={item.title}
                className="animate-fadeUp"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <p className="text-xs font-black tracking-wide text-teal mb-2">
                  ۰{i + 1}
                </p>
                <h3 className="text-lg font-extrabold mb-2">{item.title}</h3>
                <p className="text-sm leading-7 text-ink/60">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="section-anchor py-20 sm:py-28"
        style={{
          background:
            'linear-gradient(180deg, #e7eef1 0%, #f2f6f7 42%, #f2f6f7 100%)',
        }}
      >
        <div className="container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-4">امکانات</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-snug mb-4">
              یک پکیج کامل برای فروش
            </h2>
            <p className="text-ink/60 leading-8 max-w-md">
              فروشگاه، کانال‌ها، کارمند AI و فضای کاری — همه روی همان دادهٔ
              commerce.
            </p>
            <Link
              href={`/request?plan=${DEFAULT_PLAN_ID}`}
              className="btn btn-soft mt-8"
            >
              شروع با سایت‌ساز فروشگاهی
            </Link>
          </div>

          <div className="rounded-[1.75rem] border border-ink/8 bg-white/70 px-5 sm:px-7 backdrop-blur-sm">
            {FEATURES.map((f, i) => (
              <article key={f.title} className="feature-row grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-6">
                <h3 className="text-base font-extrabold pt-0.5">{f.title}</h3>
                <p
                  className="text-sm leading-7 text-ink/60 animate-fadeUp"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="section-anchor py-20 sm:py-28">
        <div className="container">
          <div className="max-w-2xl mb-14">
            <p className="eyebrow mb-4">تعرفه‌ها</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              دو مسیر جدا: سایت‌ساز و کارمند فروش AI
            </h2>
            <p className="text-ink/60 leading-8">
              سایت‌ساز با تعرفهٔ سالیانه و قیمت مناسب فروشگاه‌ها. کارمند فروش
              هوش مصنوعی را بعد از گفتگو و متناسب با نیازتان قیمت‌گذاری می‌کنیم.
            </p>
          </div>

          <div id="pricing-site" className="section-anchor mb-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-wide text-teal mb-2">
                  ۰۱ — سایت‌ساز
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                  تعرفهٔ سالیانه ویترین فروشگاهی
                </h3>
                <p className="mt-2 text-ink/55 leading-7 max-w-xl">
                  هزینهٔ شفاف و سالیانه برای راه‌اندازی و نگهداری فروشگاه آنلاین.
                </p>
              </div>
              <span className="rounded-xl bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal">
                پرداخت سالیانه
              </span>
            </div>
            <div className="grid gap-5 items-stretch lg:grid-cols-3">
              {SITE_BUILDER_PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>

          <div
            id="pricing-ai"
            className="section-anchor rounded-[1.75rem] border border-ink/8 bg-sand/70 p-6 sm:p-10"
          >
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-wide text-teal mb-2">
                  ۰۲ — کارمند فروش AI
                </p>
                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                  تعرفه با هماهنگی
                </h3>
                <p className="mt-2 text-ink/55 leading-7 max-w-xl">
                  قیمت نهایی را بعداً با هم صحبت می‌کنیم؛ ابتدا نیاز فروشگاه،
                  کانال‌ها و حجم گفتگو را می‌سنجیم.
                </p>
              </div>
              <span className="rounded-xl bg-ink/8 px-3 py-1.5 text-xs font-bold text-ink/70">
                قیمت توافقی
              </span>
            </div>
            <div className="grid gap-5 items-stretch md:grid-cols-2">
              {AI_EMPLOYEE_PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container">
          <div
            className="relative overflow-hidden rounded-[1.75rem] px-6 py-14 sm:px-12 text-white"
            style={{
              background:
                'radial-gradient(600px 280px at 100% 0%, rgba(31,168,160,0.35), transparent 55%), linear-gradient(125deg, #0f6e6e, #071018 64%)',
            }}
          >
            <div className="relative max-w-xl">
              <h2 className="text-3xl sm:text-[2.15rem] font-black leading-snug">
                آماده‌اید کارمند فروش AI را استخدام کنید؟
              </h2>
              <p className="mt-3 text-white/70 leading-8">
                درخواست بدهید؛ حساب ساخته می‌شود. پرداخت را تکمیل کنید و وارد
                Workspace شوید.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/request?plan=${DEFAULT_PLAN_ID}`}
                  className="btn btn-primary"
                >
                  شروع با سایت‌ساز
                </Link>
                <a href="/#pricing-ai" className="btn btn-outline-light">
                  هماهنگی کارمند AI
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/8 py-10 text-sm text-ink/45">
        <div className="container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-bold text-ink/75">
              DeloRey AI
            </p>
            <p className="mt-1">SaaS برای فروشگاه‌های آنلاین ایران</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
            <a href="/#about" className="hover:text-teal transition-colors">
              کی هستیم
            </a>
            <a href="/#features" className="hover:text-teal transition-colors">
              امکانات
            </a>
            <a href="/#pricing" className="hover:text-teal transition-colors">
              تعرفه‌ها
            </a>
            <Link href="/request" className="hover:text-teal transition-colors">
              ثبت درخواست
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
