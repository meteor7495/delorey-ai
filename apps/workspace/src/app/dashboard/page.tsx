'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { channelLabel, escalationLabel } from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

type Summary = Awaited<ReturnType<typeof api.analyticsSummary>>;
type Gaps = Awaited<ReturnType<typeof api.analyticsKnowledgeGaps>>;
type Revenue = Awaited<ReturnType<typeof api.analyticsRevenue>>;

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: currency === 'IRR' ? 'IRR' : currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('fa-IR')} ${currency}`;
  }
}

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gaps, setGaps] = useState<Gaps | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analyticsSummary(days),
      api.analyticsKnowledgeGaps(days),
      api.analyticsRevenue(days),
    ])
      .then(([s, g, r]) => {
        setSummary(s);
        setGaps(g);
        setRevenue(r);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [days]);

  return (
    <AppShell>
      <h1>داشبورد</h1>
      <p className="muted">
        نتایج واقعی از گفتگو و audit — بدون امتیاز وانیته «خوشحالی AI»
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            type="button"
            className={`btn ${days === d ? '' : 'secondary'}`}
            onClick={() => setDays(d)}
          >
            {d} روز
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {revenue && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>درآمد و کمک فروش (صادقانه)</h3>
          <p>
            GMV فروشگاه:{' '}
            <strong>
              {formatMoney(revenue.store.gmv, revenue.store.currency)}
            </strong>
            {' · '}
            سفارش همگام: <strong>{revenue.store.orderCount}</strong>
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            {revenue.store.note}
          </p>
          <p>
            recommend: <strong>{revenue.skills.recommendVolume}</strong>
            {' · '}
            order_lookup: <strong>{revenue.skills.orderLookupVolume}</strong>
            {' · '}
            گفتگوی assisted:{' '}
            <strong>{revenue.skills.assistedConversations}</strong>
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            {revenue.methodology.assisted}
          </p>
          <p className="muted" style={{ fontSize: 13 }}>
            مصرف (proxy): {revenue.usage.auditTurnCount} نوبت —{' '}
            {revenue.usage.note}
          </p>
          {!revenue.claims.causalLiftShown && (
            <p className="muted" style={{ fontSize: 13 }}>
              {revenue.methodology.noCausalLift}
            </p>
          )}
        </div>
      )}

      {summary?.empty && (
        <div className="card">
          <p className="muted">
            در این بازه هنوز داده‌ای نیست — از ویجت یا کانال‌ها گفتگو بسازید. داده
            جعلی نشان نمی‌دهیم.
          </p>
        </div>
      )}

      {summary && !summary.empty && (
        <>
          <div className="card">
            <h3>گفتگوها</h3>
            <p>
              کل: <strong>{summary.conversations.total}</strong> · در انتظار
              انسان: <strong>{summary.conversations.humanOwnedOpen}</strong>
            </p>
            <p className="muted">بر اساس کانال:</p>
            <ul>
              {Object.entries(summary.conversations.byChannel).map(([ch, n]) => (
                <li key={ch}>
                  {channelLabel(ch)}: {n}
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: 13 }}>
              {summary.methodology.escalationRate}
            </p>
            <Link className="btn secondary" href="/inbox">
              رفتن به صندوق ورودی
            </Link>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>وضوحیت و ارجاع</h3>
            <p>
              شاخص وضوحیت:{' '}
              <strong>
                {summary.rates.resolutionProxy == null
                  ? '—'
                  : `${Math.round(summary.rates.resolutionProxy * 100)}%`}
              </strong>
              {' · '}
              نرخ ارجاع:{' '}
              <strong>
                {summary.rates.escalationRate == null
                  ? '—'
                  : `${Math.round(summary.rates.escalationRate * 100)}%`}
              </strong>
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              {summary.methodology.resolutionProxy}
            </p>
            <p className="muted">دلایل ارجاع:</p>
            <ul>
              {Object.keys(summary.escalationReasons).length === 0 && (
                <li className="muted">موردی نیست</li>
              )}
              {Object.entries(summary.escalationReasons).map(([r, n]) => (
                <li key={r}>
                  {escalationLabel(r)}: {n}
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>اقدامات کمکی (نه فروش علّی)</h3>
            <p>
              recommend + order_lookup:{' '}
              <strong>{summary.audits.assistedActions}</strong>
            </p>
            <p className="muted" style={{ fontSize: 13 }}>
              {summary.methodology.assistedActions}
            </p>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>سلامت همگام‌سازی</h3>
            <p>
              وضعیت: <strong>{summary.syncHealth}</strong>
            </p>
            <p className="muted">
              آخرین همگام‌سازی: {summary.syncLastAt ?? '—'}
            </p>
            <Link className="btn secondary" href="/store">
              فروشگاه
            </Link>
          </div>
        </>
      )}

      {gaps && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>شکاف‌های دانش</h3>
          <p className="muted" style={{ fontSize: 13 }}>
            {gaps.note}
          </p>
          {gaps.empty ? (
            <p className="muted">شکاف ثبت‌شده‌ای در این بازه نیست.</p>
          ) : (
            <ul>
              {gaps.topics.map((t, i) => (
                <li key={`${t.conversationId}-${i}`}>
                  <code>{t.decision}</code> — {t.text}
                </li>
              ))}
            </ul>
          )}
          <Link className="btn" href="/knowledge">
            ویرایش دانش
          </Link>
        </div>
      )}
    </AppShell>
  );
}
