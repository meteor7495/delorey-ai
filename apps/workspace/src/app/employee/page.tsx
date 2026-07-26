'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function EmployeePage() {
  const [name, setName] = useState('');
  const [tone, setTone] = useState('');
  const [status, setStatus] = useState('active');
  const [orderStatus, setOrderStatus] = useState(true);
  const [recommend, setRecommend] = useState(true);
  const [blockedTopicsText, setBlockedTopicsText] = useState('');
  const [discountCap, setDiscountCap] = useState(10);
  const [onBlockedTopic, setOnBlockedTopic] = useState(true);
  const [onDiscountCap, setOnDiscountCap] = useState(true);
  const [saved, setSaved] = useState(false);
  const [guardSaved, setGuardSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getEmployee()
      .then((e) => {
        setName(String(e.name ?? ''));
        setTone(String(e.tone ?? ''));
        setStatus(String(e.status ?? 'active'));
        setOrderStatus(Boolean(e.skills?.order_status));
        setRecommend(e.skills?.recommend !== false);
        const g = e.guardrails;
        if (g) {
          setBlockedTopicsText((g.blockedTopics ?? []).join('\n'));
          setDiscountCap(g.discountCapPercent ?? 10);
          setOnBlockedTopic(g.escalationRules?.onBlockedTopic !== false);
          setOnDiscountCap(g.escalationRules?.onDiscountAboveCap !== false);
        }
      })
      .catch((err) => setError(String(err)));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    await api.updateEmployee({
      name,
      tone,
      status,
      skills: { order_status: orderStatus, recommend },
    });
    setSaved(true);
  }

  async function onGuardrailsSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const blockedTopics = blockedTopicsText
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    await api.updateEmployeeGuardrails({
      blockedTopics,
      discountCapPercent: Number(discountCap),
      escalationRules: {
        onBlockedTopic,
        onDiscountAboveCap: onDiscountCap,
        onCustomerRequest: true,
      },
    });
    setGuardSaved(true);
  }

  return (
    <AppShell>
      <h1>کارمند فروش</h1>
      <p className="muted">
        این تنظیمات در Runtime اعمال می‌شوند — تزئینی نیستند.
      </p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <form className="card" onSubmit={onSubmit}>
        <label>نام</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label>لحن</label>
        <input
          className="input"
          value={tone}
          onChange={(e) => setTone(e.target.value)}
        />
        <label>وضعیت</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="active">فعال</option>
          <option value="paused">متوقف</option>
          <option value="inactive">غیرفعال</option>
        </select>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={orderStatus}
            onChange={(e) => setOrderStatus(e.target.checked)}
          />
          مهارت پیگیری سفارش
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={recommend}
            onChange={(e) => setRecommend(e.target.checked)}
          />
          مهارت پیشنهاد محصول
        </label>
        <button className="btn" type="submit">
          ذخیره
        </button>
        {saved && <p style={{ color: 'var(--success)' }}>ذخیره شد.</p>}
      </form>

      <form
        className="card"
        style={{ marginTop: 16 }}
        onSubmit={onGuardrailsSubmit}
      >
        <h3>محدودیت‌های سخت</h3>
        <p className="muted" style={{ fontSize: 13 }}>
          موضوع ممنوع، سقف تخفیف، و ممنوعیت استرداد/لغو — قبل از ابزار و پاسخ
          مدل اعمال می‌شوند. خاموش کردن تحویل به انسان برای اتوماسیون نمایشی ممکن
          نیست.
        </p>
        <label>موضوع‌های ممنوع (هر خط یک عبارت)</label>
        <textarea
          className="input"
          rows={4}
          value={blockedTopicsText}
          onChange={(e) => setBlockedTopicsText(e.target.value)}
          placeholder={'سیاسی\nقمار\nشرط‌بندی'}
        />
        <label>سقف تخفیف (درصد)</label>
        <input
          className="input"
          type="number"
          min={0}
          max={100}
          value={discountCap}
          onChange={(e) => setDiscountCap(Number(e.target.value))}
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={onBlockedTopic}
            onChange={(e) => setOnBlockedTopic(e.target.checked)}
          />
          ارجاع به انسان هنگام موضوع ممنوع
        </label>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={onDiscountCap}
            onChange={(e) => setOnDiscountCap(e.target.checked)}
          />
          ارجاع هنگام تخفیف بالاتر از سقف
        </label>
        <p className="muted" style={{ fontSize: 13 }}>
          استرداد وجه و لغو سفارش همیشه مسدودند (MVP) — قابل خاموش‌کردن نیست.
        </p>
        <button className="btn" type="submit">
          ذخیره محدودیت‌ها
        </button>
        {guardSaved && (
          <p style={{ color: 'var(--success)' }}>محدودیت‌ها ذخیره شد.</p>
        )}
      </form>
    </AppShell>
  );
}
