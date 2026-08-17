'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StoreShell } from '@/components/StoreShell';
import { api, getCartSessionId, setCartSessionId } from '@/lib/api';
import { useStoreSlug, useStorefrontChrome } from '@/lib/use-storefront';
import { pageTitleClass, useStoreTheme } from '@/themes/theme-context';

const fieldClass =
  'mt-1 w-full h-11 border border-zh-300 px-3 text-[14px] bg-zh-surface outline-none focus:border-zh-primary';

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const storeSlug = useStoreSlug(params);
  return (
    <Suspense
      fallback={
        <main className="dk-container py-20 text-center text-zh-600">
          در حال بارگذاری…
        </main>
      }
    >
      <CheckoutInner storeSlug={storeSlug} />
    </Suspense>
  );
}

function CheckoutInner({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { settings, categories, error: chromeError } = useStorefrontChrome(storeSlug);
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
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);

  useEffect(() => {
    if (!storeSlug) return;
    const token = search.get('token');
    const load = async () => {
      if (token) {
        const session = await api.hydrateCheckoutSession(token);
        setCartSessionId(storeSlug, session.sessionId);
        setCheckoutToken(token);
        setSubtotal(Number(session.cart?.total ?? 0));
        return;
      }
      const cart = await api.storefrontGetCart(storeSlug, getCartSessionId(storeSlug));
      setSubtotal(Number((cart as { total?: number }).total ?? 0));
    };
    load().catch((e) => setError(String(e)));
  }, [storeSlug, search]);

  useEffect(() => {
    if (settings?.codEnabled === false && settings.onlinePaymentEnabled) {
      setPaymentMethod('online');
    }
  }, [settings]);

  async function applyDiscount() {
    setDiscountMsg(null);
    setError(null);
    if (!discountCode.trim()) {
      setDiscountAmount(0);
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
        checkoutToken: checkoutToken ?? undefined,
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
        {chromeError ?? error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  const payable = Math.max(subtotal - discountAmount, 0);
  const canCod = settings.codEnabled !== false;
  const canOnline = Boolean(settings.onlinePaymentEnabled);

  return (
    <StoreShell settings={settings} categories={categories}>
      <CheckoutForm
        storeSlug={storeSlug}
        payable={payable}
        discountAmount={discountAmount}
        error={error}
        onSubmit={onSubmit}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        address={address}
        setAddress={setAddress}
        note={note}
        setNote={setNote}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        applyDiscount={applyDiscount}
        discountMsg={discountMsg}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        canCod={canCod}
        canOnline={canOnline}
        busy={busy}
        savedAddress={savedAddress}
        savedName={savedName}
        useSaved={useSaved}
        setUseSaved={setUseSaved}
        setSavedAddress={setSavedAddress}
        setSavedName={setSavedName}
      />
    </StoreShell>
  );
}

function CheckoutForm(props: {
  storeSlug: string;
  payable: number;
  discountAmount: number;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  discountCode: string;
  setDiscountCode: (v: string) => void;
  applyDiscount: () => void;
  discountMsg: string | null;
  paymentMethod: 'cod' | 'online';
  setPaymentMethod: (v: 'cod' | 'online') => void;
  canCod: boolean;
  canOnline: boolean;
  busy: boolean;
  savedAddress: string | null;
  savedName: string | null;
  useSaved: boolean;
  setUseSaved: (v: boolean) => void;
  setSavedAddress: (v: string | null) => void;
  setSavedName: (v: string | null) => void;
}) {
  const theme = useStoreTheme();
  const radius = { borderRadius: 'var(--zh-radius)' };

  return (
    <div className="dk-container py-6 lg:py-10 max-w-2xl">
      <h1 className={`${pageTitleClass(theme)} mb-1`}>اطلاعات ارسال</h1>
      <p className="text-[14px] text-zh-600 mb-4">
        مبلغ قابل پرداخت:{' '}
        <strong className="text-zh-900 tnum">
          {props.payable.toLocaleString('fa-IR')} تومان
        </strong>
        {props.discountAmount > 0 ? (
          <span className="text-zh-600">
            {' '}
            (تخفیف {props.discountAmount.toLocaleString('fa-IR')})
          </span>
        ) : null}
      </p>
      {props.error && <p className="text-zh-pink text-[14px] mb-3">{props.error}</p>}

      <form onSubmit={props.onSubmit} className="zh-card p-6 space-y-4">
        <div>
          <label className="text-[14px] text-zh-900">نام گیرنده</label>
          <input
            className={fieldClass}
            style={radius}
            value={props.name}
            onChange={(e) => props.setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-[14px] text-zh-900">شماره موبایل</label>
          <input
            className={fieldClass}
            style={radius}
            value={props.phone}
            onChange={(e) => props.setPhone(e.target.value)}
            onBlur={async () => {
              if (!props.storeSlug || props.phone.trim().length < 8) return;
              try {
                const c = await api.storefrontLookupCustomer(
                  props.storeSlug,
                  props.phone,
                );
                if (c?.defaultAddress) {
                  props.setSavedAddress(c.defaultAddress);
                  props.setSavedName(c.name);
                  props.setName(props.name || c.name);
                  if (props.useSaved) props.setAddress(c.defaultAddress);
                } else {
                  props.setSavedAddress(null);
                }
              } catch {
                props.setSavedAddress(null);
              }
            }}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="text-[14px] text-zh-900">آدرس</label>
          {props.savedAddress ? (
            <div className="mt-2 mb-2 space-y-2 text-[14px]">
              <label className="flex items-start gap-2">
                <input
                  type="radio"
                  checked={props.useSaved}
                  onChange={() => {
                    props.setUseSaved(true);
                    props.setAddress(props.savedAddress!);
                    if (props.savedName) props.setName(props.savedName);
                  }}
                />
                <span>آدرس ثبت‌شده: {props.savedAddress}</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!props.useSaved}
                  onChange={() => props.setUseSaved(false)}
                />
                آدرس دیگری مدنظر است
              </label>
            </div>
          ) : null}
          {(!props.savedAddress || !props.useSaved) && (
            <textarea
              className="mt-1 w-full min-h-[110px] border border-zh-300 px-3 py-2 text-[14px] bg-zh-surface outline-none focus:border-zh-primary"
              style={radius}
              value={props.address}
              onChange={(e) => props.setAddress(e.target.value)}
              required={!props.savedAddress || !props.useSaved}
            />
          )}
        </div>
        <div>
          <label className="text-[14px] text-zh-900">توضیحات (اختیاری)</label>
          <input
            className={fieldClass}
            style={radius}
            value={props.note}
            onChange={(e) => props.setNote(e.target.value)}
          />
        </div>

        <div>
          <label className="text-[14px] text-zh-900">کد تخفیف</label>
          <div className="mt-1 flex gap-2">
            <input
              className={`flex-1 ${fieldClass} mt-0`}
              style={radius}
              value={props.discountCode}
              onChange={(e) => props.setDiscountCode(e.target.value)}
              placeholder="مثلاً SALE10"
            />
            <button
              type="button"
              onClick={props.applyDiscount}
              className="h-11 px-4 border border-zh-200 text-[13px] shrink-0"
              style={radius}
            >
              اعمال
            </button>
          </div>
          {props.discountMsg && (
            <p
              className={`mt-1 text-[12px] ${
                props.discountAmount > 0 ? 'text-dk-green' : 'text-zh-pink'
              }`}
            >
              {props.discountMsg}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[14px] text-zh-900">روش پرداخت</p>
          {props.canCod && (
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="radio"
                name="pay"
                checked={props.paymentMethod === 'cod'}
                onChange={() => props.setPaymentMethod('cod')}
              />
              پرداخت در محل (COD)
            </label>
          )}
          {props.canOnline && (
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="radio"
                name="pay"
                checked={props.paymentMethod === 'online'}
                onChange={() => props.setPaymentMethod('online')}
              />
              پرداخت آنلاین (زرین‌پال)
            </label>
          )}
          {!props.canCod && !props.canOnline && (
            <p className="text-[13px] text-zh-pink">
              هیچ روش پرداختی برای این فروشگاه فعال نیست.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={props.busy || (!props.canCod && !props.canOnline)}
          className="zh-btn-primary w-full"
        >
          {props.busy
            ? 'در حال ثبت…'
            : props.paymentMethod === 'online'
              ? 'ثبت و انتقال به درگاه'
              : 'ثبت سفارش و پرداخت در محل'}
        </button>
        <Link
          href={`/s/${props.storeSlug}/cart`}
          className="flex h-10 items-center justify-center border border-zh-200 text-[14px]"
          style={radius}
        >
          بازگشت به سبد
        </Link>
      </form>
    </div>
  );
}
