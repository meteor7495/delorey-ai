'use client';

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
  const [tgToken, setTgToken] = useState('');
  const [baleToken, setBaleToken] = useState('');
  const [tgSimText, setTgSimText] = useState('SHIRT-001 موجوده؟');
  const [baleSimText, setBaleSimText] = useState('پیراهن لینن موجوده؟');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [w, t, b] = await Promise.all([
      api.getWebsiteChannel(),
      api.getTelegramChannel(),
      api.getBaleChannel(),
    ]);
    setWebsite(w);
    setOriginsText((w.allowedOrigins ?? []).join('\n'));
    setTelegram(t);
    setBale(b);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function onConnectTelegram(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await api.connectTelegram(
        tgToken || '0000000000:DEV_MOCK_TOKEN_SLICE03_LOCAL',
      );
      setMessage(
        `تلگرام متصل شد @${res.botUsername ?? 'bot'} · وب‌هوک آماده است`,
      );
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'اتصال تلگرام برقرار نشد. توکن را بررسی کنید و دوباره تلاش کنید.',
      );
    }
  }

  async function onConnectBale(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await api.connectBale(
        baleToken || '0000000000:DEV_MOCK_TOKEN_SLICE04_BALE',
      );
      setMessage(`بله متصل شد @${res.botUsername ?? 'bot'} · وب‌هوک آماده است`);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'اتصال بله برقرار نشد. توکن را بررسی کنید و دوباره تلاش کنید.',
      );
    }
  }

  async function onSimulateTelegram(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.simulateTelegram({ text: tgSimText });
      setMessage(
        res.duplicate
          ? 'تلگرام: به‌روزرسانی تکراری نادیده گرفته شد'
          : `تلگرام → ${decisionLabel(String(res.decision))}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'شبیه‌سازی تلگرام ناموفق بود.',
      );
    }
  }

  async function onSimulateBale(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.simulateBale({ text: baleSimText });
      setMessage(
        res.duplicate
          ? 'بله: به‌روزرسانی تکراری نادیده گرفته شد'
          : `بله → ${decisionLabel(String(res.decision))}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'شبیه‌سازی بله ناموفق بود.',
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="کانال‌ها"
          description="وبسایت · تلگرام · بله — یک مغز (Runtime)"
        />
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

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
              <code dir="ltr">&lt;/body&gt;</code> فروشگاه بگذارید. دامنه فروشگاه
              باید در لیست مجاز باشد (مثلاً{' '}
              <code dir="ltr">https://your-shop.myshopify.com</code>).
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setMessage(null);
                try {
                  const origins = originsText
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                  const res = await api.updateWebsiteOrigins(origins);
                  setWebsite(res);
                  setOriginsText(res.allowedOrigins.join('\n'));
                  setMessage('دامنه‌های مجاز ویجت ذخیره شد.');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'ذخیره دامنه‌ها ناموفق بود.',
                  );
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
      </div>
    </AppShell>
  );
}
