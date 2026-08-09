'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ShopSettingsPage() {
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [codEnabled, setCodEnabled] = useState(true);
  const [storefrontUrl, setStorefrontUrl] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('IRR');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [allowNegativeInventory, setAllowNegativeInventory] = useState(false);
  const [defaultProductStatus, setDefaultProductStatus] = useState('draft');

  useEffect(() => {
    api
      .shopSettings()
      .then((s) => {
        setStoreName(String(s.storeName ?? ''));
        setStoreSlug(String(s.storeSlug ?? ''));
        setTagline(String(s.tagline ?? ''));
        setSupportPhone(String(s.supportPhone ?? ''));
        setCodEnabled(Boolean(s.codEnabled));
        setStorefrontUrl(String(s.storefrontUrl ?? ''));
        setDefaultCurrency(String(s.defaultCurrency ?? 'IRR'));
        setLowStockThreshold(String(s.lowStockThreshold ?? 5));
        setAllowNegativeInventory(Boolean(s.allowNegativeInventory));
        setDefaultProductStatus(String(s.defaultProductStatus ?? 'draft'));
      })
      .catch((e) => toastFromError(e));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const s = await api.updateShopSettings({
        storeName,
        storeSlug,
        tagline: tagline || null,
        supportPhone: supportPhone || null,
        codEnabled,
        defaultCurrency,
        lowStockThreshold: Number(lowStockThreshold) || 0,
        allowNegativeInventory,
        defaultProductStatus,
      });
      setStorefrontUrl(String(s.storefrontUrl ?? ''));
      setStoreSlug(String(s.storeSlug ?? storeSlug));
      toastSuccess('تنظیمات ذخیره شد');
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="تنظیمات فروشگاه"
          description="اسلاگ عمومی، COD و اطلاعات تماس"
        />

        <Card>
          <CardHeader>
            <CardTitle>عمومی</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid max-w-xl gap-3">
              <div className="space-y-1.5">
                <Label>نام فروشگاه</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>اسلاگ ویترین</Label>
                <Input
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>شعار</Label>
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>تلفن پشتیبانی</Label>
                <Input
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                />
                پرداخت در محل (COD) فعال باشد
              </label>
              <div className="pt-2">
                <p className="text-sm font-semibold text-[var(--text-1)]">
                  تنظیمات تجاری
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  پیش‌فرض‌هایی که هنگام ساخت محصول و محاسبه موجودی اعمال می‌شوند
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>واحد پول پیش‌فرض</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                  <option value="IRR">ریال</option>
                  <option value="IRT">تومان</option>
                  <option value="USD">دلار</option>
                  <option value="EUR">یورو</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>آستانه موجودی کم</Label>
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>وضعیت پیش‌فرض محصول جدید</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"
                  value={defaultProductStatus}
                  onChange={(e) => setDefaultProductStatus(e.target.value)}
                >
                  <option value="draft">پیش‌نویس</option>
                  <option value="published">منتشر</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allowNegativeInventory}
                  onChange={(e) => setAllowNegativeInventory(e.target.checked)}
                />
                اجازه موجودی منفی (فروش بیش از موجودی)
              </label>
              <Button type="submit">ذخیره</Button>
            </form>
            {storefrontUrl && (
              <p className="mt-4 text-sm text-[var(--text-3)]">
                آدرس ویترین:{' '}
                <a
                  className="font-medium text-[var(--brand-500)]"
                  href={storefrontUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {storefrontUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
