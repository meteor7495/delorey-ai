'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { aiStateLabel, channelStatusLabel, decisionLabel } from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type BotChannelStatus = {
  connected: boolean;
  status?: string;
  botUsername?: string | null;
  webhookUrl?: string;
  live?: boolean;
} | null;

export default function ChannelsPage() {
  const [website, setWebsite] = useState<{
    publicKey: string;
    snippet: string;
    status: string;
    allowedOrigins?: string[];
  } | null>(null);
  const [originsText, setOriginsText] = useState('');
  const [telegram, setTelegram] = useState<BotChannelStatus>(null);
  const [bale, setBale] = useState<BotChannelStatus>(null);
  const [instagram, setInstagram] = useState<BotChannelStatus>(null);
  const [tgToken, setTgToken] = useState('');
  const [baleToken, setBaleToken] = useState('');
  const [tgSimText, setTgSimText] = useState('SHIRT-001 موجوده؟');
  const [baleSimText, setBaleSimText] = useState('پیراهن لینن موجوده؟');
  const [igSimText, setIgSimText] = useState('میخوام بخرم SHIRT-001');

  async function refresh() {
    const [w, t, b, i] = await Promise.all([
      api.getWebsiteChannel(),
      api.getTelegramChannel(),
      api.getBaleChannel(),
      api.getInstagramChannel(),
    ]);
    setWebsite(w);
    setOriginsText((w.allowedOrigins ?? []).join('\n'));
    setTelegram(t);
    setBale(b);
    setInstagram(i);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function onConnectTelegram(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.connectTelegram(
        tgToken || '0000000000:DEV_MOCK_TOKEN_SLICE03_LOCAL',
      );
      toastSuccess(
        `تلگرام متصل شد @${res.botUsername ?? 'bot'} · وب‌هوک آماده است`,
      );
      await refresh();
    } catch (err) {
      toastFromError(err, 'اتصال تلگرام برقرار نشد. توکن را بررسی کنید و دوباره تلاش کنید.');
    }
  }

  async function onConnectBale(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.connectBale(
        baleToken || '0000000000:DEV_MOCK_TOKEN_SLICE04_BALE',
      );
      toastSuccess(`بله متصل شد @${res.botUsername ?? 'bot'} · وب‌هوک آماده است`);
      await refresh();
    } catch (err) {
      toastFromError(err, 'اتصال بله برقرار نشد. توکن را بررسی کنید و دوباره تلاش کنید.');
    }
  }

  async function onSimulateTelegram(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.simulateTelegram({ text: tgSimText });
      toastSuccess(
        res.duplicate
          ? 'تلگرام: به‌روزرسانی تکراری نادیده گرفته شد'
          : `تلگرام → ${decisionLabel(String(res.decision))}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      toastFromError(err, 'شبیه‌سازی تلگرام ناموفق بود.');
    }
  }

  async function onSimulateBale(e: FormEvent) {
    e.preventDefault();
    try {
      const res = await api.simulateBale({ text: baleSimText });
      toastSuccess(
        res.duplicate
          ? 'بله: به‌روزرسانی تکراری نادیده گرفته شد'
          : `بله → ${decisionLabel(String(res.decision))}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      toastFromError(err, 'شبیه‌سازی بله ناموفق بود.');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="کانال‌ها"
          description="وب · تلگرام · بله · اینستاگرام — سفارش روی همان فروشگاه"
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>گفتگوی وبسایت</CardTitle>
              <Badge>
                {website ? aiStateLabel(website.status) : '…'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-3)]">
              کلید عمومی:{' '}
              <code dir="ltr" className="text-[var(--text-2)]">
                {website?.publicKey ?? '—'}
              </code>
            </p>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface-3)] p-3 text-xs text-[var(--text-2)]"
            >
              {website?.snippet}
            </pre>
            <p className="text-xs text-[var(--text-3)]">
              اسکریپت را قبل از{' '}
              <code dir="ltr">&lt;/body&gt;</code> بگذارید. دامنه ویترین
              (مثلاً{' '}
              <code dir="ltr">http://localhost:3020</code>) باید در لیست مجاز باشد.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const origins = originsText
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const res = await api.updateWebsiteOrigins(origins);
                  setWebsite(res);
                  setOriginsText(res.allowedOrigins.join('\n'));
                  toastSuccess('دامنه‌های مجاز ویجت ذخیره شد.');
                } catch (err) {
                  toastFromError(err, 'ذخیره دامنه‌ها ناموفق بود.');
                }
              }}
              className="space-y-3 border-t border-[var(--border-color)] pt-4"
            >
              <div className="space-y-1.5">
                <Label>دامنه‌های مجاز (هر خط یک Origin)</Label>
                <textarea
                  dir="ltr"
                  className="min-h-[96px] w-full rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface-3)] p-3 text-xs text-[var(--text-2)]"
                  value={originsText}
                  onChange={(e) => setOriginsText(e.target.value)}
                  placeholder={'http://localhost:5173\nhttps://example.com'}
                />
              </div>
              <Button type="submit" variant="outline">
                ذخیره دامنه‌ها
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تلگرام</CardTitle>
            <CardDescription>
              {telegram?.connected
                ? `${channelStatusLabel(String(telegram.status))} (@${telegram.botUsername ?? '—'})`
                : 'متصل نیست'}
              {' · '}
              {telegram?.live
                ? 'ارسال واقعی فعال است'
                : 'حالت آزمایشی — برای تست محلی از شبیه‌سازی استفاده کنید'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {telegram?.webhookUrl && (
              <p className="text-xs text-[var(--text-3)]" dir="ltr">
                {telegram.webhookUrl}
              </p>
            )}
            <form onSubmit={onConnectTelegram} className="space-y-3">
              <div className="space-y-1.5">
                <Label>توکن ربات</Label>
                <Input
                  dir="ltr"
                  value={tgToken}
                  onChange={(e) => setTgToken(e.target.value)}
                  placeholder="123456:ABC… یا خالی برای توکن آزمایشی"
                />
              </div>
              <Button type="submit">اتصال تلگرام</Button>
            </form>
            {telegram?.connected && (
              <form onSubmit={onSimulateTelegram} className="space-y-3 border-t border-[var(--border-color)] pt-4">
                <div className="space-y-1.5">
                  <Label>شبیه‌سازی پیام ورودی (محلی)</Label>
                  <Input
                    value={tgSimText}
                    onChange={(e) => setTgSimText(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline">
                  شبیه‌سازی پیام
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>بله</CardTitle>
            <CardDescription>
              {bale?.connected
                ? `${channelStatusLabel(String(bale.status))} (@${bale.botUsername ?? '—'})`
                : 'متصل نیست'}
              {' · '}
              {bale?.live
                ? 'ارسال واقعی فعال است'
                : 'حالت آزمایشی — برای تست محلی از شبیه‌سازی استفاده کنید'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bale?.webhookUrl && (
              <p className="text-xs text-[var(--text-3)]" dir="ltr">
                {bale.webhookUrl}
              </p>
            )}
            <form onSubmit={onConnectBale} className="space-y-3">
              <div className="space-y-1.5">
                <Label>توکن ربات</Label>
                <Input
                  dir="ltr"
                  value={baleToken}
                  onChange={(e) => setBaleToken(e.target.value)}
                  placeholder="توکن بله · خالی برای آزمایشی"
                />
              </div>
              <Button type="submit">اتصال بله</Button>
            </form>
            {bale?.connected && (
              <form onSubmit={onSimulateBale} className="space-y-3 border-t border-[var(--border-color)] pt-4">
                <div className="space-y-1.5">
                  <Label>شبیه‌سازی پیام ورودی (محلی)</Label>
                  <Input
                    value={baleSimText}
                    onChange={(e) => setBaleSimText(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline">
                  شبیه‌سازی پیام
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اینستاگرام</CardTitle>
            <CardDescription>
              {instagram?.connected
                ? `${channelStatusLabel(String(instagram.status))} (${instagram.botUsername ?? 'صفحه'})`
                : 'متصل نیست'}
              {' · '}
              {instagram?.live
                ? 'ارسال واقعی BoxAPI فعال است'
                : 'حالت آزمایشی — شبیه‌سازی محلی'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {instagram?.webhookUrl && (
              <p className="text-xs text-[var(--text-3)]" dir="ltr">
                {instagram.webhookUrl}
              </p>
            )}
            <Button
              type="button"
              onClick={async () => {
                try {
                  await api.connectInstagram('صفحه فروشگاه');
                  toastSuccess('اینستاگرام متصل شد');
                  await refresh();
                } catch (err) {
                  toastFromError(err, 'اتصال اینستاگرام برقرار نشد.');
                }
              }}
            >
              اتصال اینستاگرام
            </Button>
            {instagram?.connected && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const res = await api.simulateInstagram({ text: igSimText });
                    toastSuccess(
                      res.duplicate
                        ? 'اینستاگرام: پیام تکراری'
                        : `اینستاگرام → ${decisionLabel(String(res.decision))}: ${res.reply?.slice(0, 120)}`,
                    );
                  } catch (err) {
                    toastFromError(err, 'شبیه‌سازی اینستاگرام ناموفق بود.');
                  }
                }}
                className="space-y-3 border-t border-[var(--border-color)] pt-4"
              >
                <div className="space-y-1.5">
                  <Label>شبیه‌سازی دایرکت (محلی)</Label>
                  <Input
                    value={igSimText}
                    onChange={(e) => setIgSimText(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="outline">
                  شبیه‌سازی پیام
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
