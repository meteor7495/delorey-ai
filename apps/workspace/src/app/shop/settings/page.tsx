'use client';

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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
      })
      .catch((e) => setError(String(e)));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const s = await api.updateShopSettings({
        storeName,
        storeSlug,
        tagline: tagline || null,
        supportPhone: supportPhone || null,
        codEnabled,
      });
      setStorefrontUrl(String(s.storefrontUrl ?? ''));
      setStoreSlug(String(s.storeSlug ?? storeSlug));
      setMessage('تنظیمات ذخیره شد');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="تنظیمات فروشگاه"
          description="اسلاگ عمومی، COD و اطلاعات تماس"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}

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
