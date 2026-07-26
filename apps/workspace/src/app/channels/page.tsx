'use client';

import { FormEvent, useEffect, useState } from 'react';
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
        `تلگرام متصل شد @${res.botUsername ?? 'bot'} · webhook: ${res.webhookUrl}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'connect failed');
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
      setMessage(
        `بله متصل شد @${res.botUsername ?? 'bot'} · webhook: ${res.webhookUrl}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'connect failed');
    }
  }

  async function onSimulateTelegram(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.simulateTelegram({ text: tgSimText });
      setMessage(
        res.duplicate
          ? 'Telegram: duplicate update نادیده گرفته شد'
          : `Telegram → ${res.decision}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'simulate failed');
    }
  }

  async function onSimulateBale(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.simulateBale({ text: baleSimText });
      setMessage(
        res.duplicate
          ? 'Bale: duplicate update نادیده گرفته شد'
          : `Bale → ${res.decision}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'simulate failed');
    }
  }

  return (
    <AppShell>
      <h1>کانال‌ها</h1>
      <p className="muted">Website · Telegram · Bale — یک مغز (Runtime)</p>

      <div className="card">
        <h3>Website Chat</h3>
        <p>
          وضعیت: <strong>{website?.status ?? '...'}</strong>
        </p>
        <p className="muted">Public key: {website?.publicKey}</p>
        <pre className="snippet">{website?.snippet}</pre>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Telegram</h3>
        <p>
          وضعیت:{' '}
          <strong>
            {telegram?.connected
              ? `${telegram.status} (@${telegram.botUsername ?? '—'})`
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
            ? 'TELEGRAM_LIVE=1 — ارسال واقعی'
            : 'حالت mock — برای تست محلی از Simulate استفاده کنید'}
        </p>

        <form onSubmit={onConnectTelegram}>
          <label>Bot token</label>
          <input
            className="input"
            dir="ltr"
            value={tgToken}
            onChange={(e) => setTgToken(e.target.value)}
            placeholder="123456:ABC... یا خالی برای mock token"
          />
          <button className="btn" type="submit">
            اتصال تلگرام
          </button>
        </form>

        {telegram?.connected && (
          <form onSubmit={onSimulateTelegram} style={{ marginTop: 16 }}>
            <label>Simulate inbound (محلی)</label>
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
        <h3>Bale</h3>
        <p>
          وضعیت:{' '}
          <strong>
            {bale?.connected
              ? `${bale.status} (@${bale.botUsername ?? '—'})`
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
            ? 'BALE_LIVE=1 — ارسال واقعی (tapi.bale.ai)'
            : 'حالت mock — برای تست محلی از Simulate استفاده کنید'}
        </p>

        <form onSubmit={onConnectBale}>
          <label>Bot token</label>
          <input
            className="input"
            dir="ltr"
            value={baleToken}
            onChange={(e) => setBaleToken(e.target.value)}
            placeholder="توکن بله · خالی برای mock"
          />
          <button className="btn" type="submit">
            اتصال بله
          </button>
        </form>

        {bale?.connected && (
          <form onSubmit={onSimulateBale} style={{ marginTop: 16 }}>
            <label>Simulate inbound (محلی)</label>
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
