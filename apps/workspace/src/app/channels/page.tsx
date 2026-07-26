'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function ChannelsPage() {
  const [website, setWebsite] = useState<{
    publicKey: string;
    snippet: string;
    status: string;
  } | null>(null);
  const [telegram, setTelegram] = useState<{
    connected: boolean;
    status?: string;
    botUsername?: string | null;
    webhookUrl?: string;
    live?: boolean;
  } | null>(null);
  const [botToken, setBotToken] = useState('');
  const [simText, setSimText] = useState('SHIRT-001 موجوده؟');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [w, t] = await Promise.all([
      api.getWebsiteChannel(),
      api.getTelegramChannel(),
    ]);
    setWebsite(w);
    setTelegram(t);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function onConnect(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await api.connectTelegram(botToken || '0000000000:DEV_MOCK_TOKEN_SLICE03_LOCAL');
      setMessage(
        `متصل شد @${res.botUsername ?? 'bot'} · webhook: ${res.webhookUrl}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'connect failed');
    }
  }

  async function onSimulate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.simulateTelegram({ text: simText });
      setMessage(
        res.duplicate
          ? 'Duplicate update نادیده گرفته شد'
          : `Telegram simulate → ${res.decision}: ${res.reply?.slice(0, 120)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'simulate failed');
    }
  }

  return (
    <AppShell>
      <h1>کانال‌ها</h1>
      <p className="muted">Website + Telegram — یک مغز (Runtime)</p>

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

        <form onSubmit={onConnect}>
          <label>Bot token</label>
          <input
            className="input"
            dir="ltr"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="123456:ABC... یا خالی برای mock token"
          />
          <button className="btn" type="submit">
            اتصال تلگرام
          </button>
        </form>

        {telegram?.connected && (
          <form onSubmit={onSimulate} style={{ marginTop: 16 }}>
            <label>Simulate inbound (محلی)</label>
            <input
              className="input"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
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
