'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
      <div className="space-y-6">
        <PageHeader
          title="کارمند فروش"
          description="این تنظیمات در Runtime اعمال می‌شوند — تزئینی نیستند."
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>پروفایل و مهارت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>نام</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>لحن</Label>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>وضعیت</Label>
                <select
                  className="flex h-9 w-full rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text-1)]"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">فعال</option>
                  <option value="paused">متوقف</option>
                  <option value="inactive">غیرفعال</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.checked)}
                />
                مهارت پیگیری سفارش
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                />
                مهارت پیشنهاد محصول
              </label>
              <div className="flex items-center gap-3">
                <Button type="submit">ذخیره</Button>
                {saved && (
                  <span className="text-sm text-[var(--success)]">ذخیره شد.</span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>محدودیت‌های سخت</CardTitle>
            <CardDescription>
              موضوع ممنوع، سقف تخفیف، و ممنوعیت استرداد/لغو — قبل از ابزار و پاسخ
              مدل اعمال می‌شوند.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onGuardrailsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>موضوع‌های ممنوع (هر خط یک عبارت)</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-1)]"
                  rows={4}
                  value={blockedTopicsText}
                  onChange={(e) => setBlockedTopicsText(e.target.value)}
                  placeholder={'سیاسی\nقمار\nشرط‌بندی'}
                />
              </div>
              <div className="space-y-1.5">
                <Label>سقف تخفیف (درصد)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountCap}
                  onChange={(e) => setDiscountCap(Number(e.target.value))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={onBlockedTopic}
                  onChange={(e) => setOnBlockedTopic(e.target.checked)}
                />
                ارجاع به انسان هنگام موضوع ممنوع
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
                <input
                  type="checkbox"
                  checked={onDiscountCap}
                  onChange={(e) => setOnDiscountCap(e.target.checked)}
                />
                ارجاع هنگام تخفیف بالاتر از سقف
              </label>
              <p className="text-xs text-[var(--text-3)]">
                استرداد وجه و لغو سفارش همیشه مسدودند (MVP) — قابل خاموش‌کردن نیست.
              </p>
              <div className="flex items-center gap-3">
                <Button type="submit">ذخیره محدودیت‌ها</Button>
                {guardSaved && (
                  <span className="text-sm text-[var(--success)]">
                    محدودیت‌ها ذخیره شد.
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
