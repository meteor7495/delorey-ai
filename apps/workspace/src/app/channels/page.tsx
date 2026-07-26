'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  aiStateLabel,
  channelStatusLabel,
  decisionLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

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
  } | null>(null);
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
      <h1>کانال‌ها</h1>
      <p className="muted">وبسایت · تلگرام · بله — یک مغز (Runtime)</p>

      <div className="card">
        <h3>گفتگوی وبسایت</h3>
        <p>
          وضعیت:{' '}
          <strong>
            {website ? aiStateLabel(website.status) : '…'}
          </strong>
        </p>
        <p className="muted">
          کلید عمومی:{' '}
          <code dir="ltr">{website?.publicKey ?? '—'}</code>
        </p>
        <pre className="snippet">{website?.snippet}</pre>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>تلگرام</h3>
        <p>
          وضعیت:{' '}
          <strong>
            {telegram?.connected
              ? `${channelStatusLabel(String(telegram.status))} (@${telegram.botUsername ?? '—'})`
              : 'متصل نیست'}
          </strong>
        </p>
        {telegram?.webhookUrl && (
          <p className="muted" style={{ direction: 'ltr', textAlign: 'left' }}>
            {telegram.webhookUrl}
          </p>
        )}
        <p className="muted">
          {telegram?.live
            ? 'ارسال واقعی فعال است'
            : 'حالت آزمایشی — برای تست محلی از شبیه‌سازی استفاده کنید'}
        </p>

        <form onSubmit={onConnectTelegram}>
          <label>توکن ربات</label>
          <input
            className="input"
            dir="ltr"
            value={tgToken}
            onChange={(e) => setTgToken(e.target.value)}
            placeholder="123456:ABC… یا خالی برای توکن آزمایشی"
          />
          <button className="btn" type="submit">
            اتصال تلگرام
          </button>
        </form>

        {telegram?.connected && (
          <form onSubmit={onSimulateTelegram} style={{ marginTop: 16 }}>
            <label>شبیه‌سازی پیام ورودی (محلی)</label>
            <input
              className="input"
              value={tgSimText}
              onChange={(e) => setTgSimText(e.target.value)}
            />
            <button className="btn secondary" type="submit">
              شبیه‌سازی پیام
            </button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>بله</h3>
        <p>
          وضعیت:{' '}
          <strong>
            {bale?.connected
              ? `${channelStatusLabel(String(bale.status))} (@${bale.botUsername ?? '—'})`
              : 'متصل نیست'}
          </strong>
        </p>
        {bale?.webhookUrl && (
          <p className="muted" style={{ direction: 'ltr', textAlign: 'left' }}>
            {bale.webhookUrl}
          </p>
        )}
        <p className="muted">
          {bale?.live
            ? 'ارسال واقعی فعال است'
            : 'حالت آزمایشی — برای تست محلی از شبیه‌سازی استفاده کنید'}
        </p>

        <form onSubmit={onConnectBale}>
          <label>توکن ربات</label>
          <input
            className="input"
            dir="ltr"
            value={baleToken}
            onChange={(e) => setBaleToken(e.target.value)}
            placeholder="توکن بله · خالی برای آزمایشی"
          />
          <button className="btn" type="submit">
            اتصال بله
          </button>
        </form>

        {bale?.connected && (
          <form onSubmit={onSimulateBale} style={{ marginTop: 16 }}>
            <label>شبیه‌سازی پیام ورودی (محلی)</label>
            <input
              className="input"
              value={baleSimText}
              onChange={(e) => setBaleSimText(e.target.value)}
            />
            <button className="btn secondary" type="submit">
              شبیه‌سازی پیام
            </button>
          </form>
        )}
      </div>

      {message && <p style={{ color: 'var(--success)' }}>{message}</p>}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
    </AppShell>
  );
}
