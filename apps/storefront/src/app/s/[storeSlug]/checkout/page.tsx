'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api, getCartSessionId } from '@/lib/api';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const router = useRouter();
  const [storeSlug, setStoreSlug] = useState('');
  const [settings, setSettings] = useState<{
    storeName: string;
    storeSlug: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string | null;
    supportPhone?: string | null;
    codEnabled?: boolean;
    onlinePaymentEnabled?: boolean;
  } | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [subtotal, setSubtotal] = useState(0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMsg, setDiscountMsg] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [useSaved, setUseSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    params.then(async ({ storeSlug: slug }) => {
      setStoreSlug(slug);
      try {
        const sessionId = getCartSessionId(slug);
        const [home, cart] = await Promise.all([
          api.storefrontHome(slug),
          api.storefrontGetCart(slug, sessionId),
        ]);
        const s = home.settings as NonNullable<typeof settings>;
        setSettings(s);
        setCategories(
          (home.categories as Array<{ id: string; name: string; slug: string }>) ??
            [],
        );
        setSubtotal(Number((cart as { total?: number }).total ?? 0));
        if (s.codEnabled === false && s.onlinePaymentEnabled) {
          setPaymentMethod('online');
        }
      } catch (e) {
        setError(String(e));
      }
    });
  }, [params]);

  async function applyDiscount() {
    setDiscountMsg(null);
    setError(null);
    if (!discountCode.trim()) {
      setDiscountAmount(0);
      setDiscountMsg(null);
      return;
    }
    try {
      const res = await api.storefrontValidateDiscount(storeSlug, {
        code: discountCode.trim(),
        subtotal,
      });
      if (!res.valid) {
        setDiscountAmount(0);
        setDiscountMsg(
          res.reason === 'not_found'
            ? 'کد تخفیف پیدا نشد'
            : 'کد تخفیف قابل اعمال نیست',
        );
        return;
      }
      const d = res.discount as {
        type?: string;
        value?: number;
        maxDiscountAmount?: number | null;
      } | null;
      if (!d) {
        setDiscountAmount(0);
        return;
      }
      let amount =
        d.type === 'percentage'
          ? (subtotal * Number(d.value ?? 0)) / 100
          : Number(d.value ?? 0);
      if (d.maxDiscountAmount != null) {
        amount = Math.min(amount, Number(d.maxDiscountAmount));
      }
      amount = Math.min(Math.max(amount, 0), subtotal);
      setDiscountAmount(amount);
      setDiscountMsg('کد تخفیف اعمال شد');
    } catch (e) {
      setDiscountAmount(0);
      setDiscountMsg(e instanceof Error ? e.message : 'خطا در بررسی کد');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const order = await api.storefrontCheckout(storeSlug, {
        sessionId: getCartSessionId(storeSlug),
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
        customerNote: note || undefined,
        discountCode: discountCode.trim() || undefined,
        paymentMethod,
      });
      if (order.payUrl) {
        window.location.href = order.payUrl;
        return;
      }
      const q = new URLSearchParams({
        orderNumber: order.orderNumber,
        phone,
      });
      if (order.paymentHint) q.set('hint', order.paymentHint);
      router.push(`/s/${storeSlug}/track?${q.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت سفارش نشد');
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  const payable = Math.max(subtotal - discountAmount, 0);
  const canCod = settings.codEnabled !== false;
  const canOnline = Boolean(settings.onlinePaymentEnabled);

  return (
    <StoreShell settings={settings} categories={categories}>
      <div className="dk-container py-6 lg:py-8 max-w-2xl">
        <h1 className="text-[20px] text-zh-900 mb-1">اطلاعات ارسال</h1>
        <p className="text-[14px] text-zh-600 mb-4">
          مبلغ قابل پرداخت:{' '}
          <strong className="text-zh-900 tnum">
            {payable.toLocaleString('fa-IR')} تومان
          </strong>
          {discountAmount > 0 ? (
            <span className="text-zh-600">
              {' '}
              (تخفیف {discountAmount.toLocaleString('fa-IR')})
            </span>
          ) : null}
        </p>
        {error && <p className="text-zh-pink text-[14px] mb-3">{error}</p>}

        <form onSubmit={onSubmit} className="zh-card p-6 space-y-4">
          {[
            {
              label: 'نام گیرنده',
              value: name,
              set: setName,
              required: true,
            },
            {
              label: 'شماره موبایل',
              value: phone,
              set: setPhone,
              required: true,
            },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-[14px] text-zh-900">{f.label}</label>
              <input
                className="mt-1 w-full h-11 rounded-dk border border-zh-300 px-3 text-[14px] outline-none focus:border-zh-primary"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                onBlur={
                  f.label.includes('موبایل')
                    ? async () => {
                        if (!storeSlug || phone.trim().length < 8) return;
                        try {
                          const c = await api.storefrontLookupCustomer(
                            storeSlug,
                            phone,
                          );
                          if (c?.defaultAddress) {
                            setSavedAddress(c.defaultAddress);
                            setSavedName(c.name);
                            setName((n) => n || c.name);
                            if (useSaved) setAddress(c.defaultAddress);
                          } else {
                            setSavedAddress(null);
                          }
                        } catch {
                          setSavedAddress(null);
                        }
                      }
                    : undefined
                }
                required={f.required}
                minLength={f.label.includes('موبایل') ? 8 : undefined}
              />
            </div>
          ))}
          <div>
            <label className="text-[14px] text-zh-900">آدرس</label>
            {savedAddress ? (
              <div className="mt-2 mb-2 space-y-2 text-[14px]">
                <label className="flex items-start gap-2">
                  <input
                    type="radio"
                    checked={useSaved}
                    onChange={() => {
                      setUseSaved(true);
                      setAddress(savedAddress);
                      if (savedName) setName(savedName);
                    }}
                  />
                  <span>آدرس ثبت‌شده: {savedAddress}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!useSaved}
                    onChange={() => setUseSaved(false)}
                  />
                  آدرس دیگری مدنظر است
                </label>
              </div>
            ) : null}
            {(!savedAddress || !useSaved) && (
            <textarea
              className="mt-1 w-full min-h-[110px] rounded-dk border border-zh-300 px-3 py-2 text-[14px] outline-none focus:border-zh-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={!savedAddress || !useSaved}
            />
            )}
          </div>
          <div>
            <label className="text-[14px] text-zh-900">توضیحات (اختیاری)</label>
            <input
              className="mt-1 w-full h-11 rounded-dk border border-zh-300 px-3 text-[14px] outline-none focus:border-zh-primary"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[14px] text-zh-900">کد تخفیف</label>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 h-11 rounded-dk border border-zh-300 px-3 text-[14px] outline-none focus:border-zh-primary"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="مثلاً SALE10"
              />
              <button
                type="button"
                onClick={applyDiscount}
                className="h-11 px-4 rounded-dk border border-zh-200 text-[13px] shrink-0"
              >
                اعمال
              </button>
            </div>
            {discountMsg && (
              <p
                className={`mt-1 text-[12px] ${
                  discountAmount > 0 ? 'text-dk-green' : 'text-zh-pink'
                }`}
              >
                {discountMsg}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[14px] text-zh-900">روش پرداخت</p>
            {canCod && (
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                پرداخت در محل (COD)
              </label>
            )}
            {canOnline && (
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                />
                پرداخت آنلاین (درگاه به‌زودی — ثبت سفارش در انتظار پرداخت)
              </label>
            )}
            {!canCod && !canOnline && (
              <p className="text-[13px] text-zh-pink">
                هیچ روش پرداختی برای این فروشگاه فعال نیست.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || (!canCod && !canOnline)}
            className="zh-btn-primary w-full"
          >
            {busy
              ? 'در حال ثبت…'
              : paymentMethod === 'online'
                ? 'ثبت سفارش (در انتظار پرداخت)'
                : 'ثبت سفارش و پرداخت در محل'}
          </button>
          <Link
            href={`/s/${storeSlug}/cart`}
            className="flex h-10 items-center justify-center rounded-dk border border-zh-200 text-[14px]"
          >
            بازگشت به سبد
          </Link>
        </form>
      </div>
    </StoreShell>
  );
}
