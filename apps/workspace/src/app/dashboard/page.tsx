'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

type Summary = Awaited<ReturnType<typeof api.analyticsSummary>>;
type Gaps = Awaited<ReturnType<typeof api.analyticsKnowledgeGaps>>;

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gaps, setGaps] = useState<Gaps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.analyticsSummary(days),
      api.analyticsKnowledgeGaps(days),
    ])
      .then(([s, g]) => {
        setSummary(s);
        setGaps(g);
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
                  {ch}: {n}
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: 13 }}>
              {summary.methodology.escalationRate}
            </p>
            <Link className="btn secondary" href="/inbox">
              رفتن به Inbox
            </Link>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>وضوحیت و ارجاع</h3>
            <p>
              Resolution proxy:{' '}
              <strong>
                {summary.rates.resolutionProxy == null
                  ? '—'
                  : `${Math.round(summary.rates.resolutionProxy * 100)}%`}
              </strong>
              {' · '}
              Escalation rate:{' '}
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
                  {r}: {n}
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
              آخرین sync: {summary.syncLastAt ?? '—'}
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
            ویرایش Knowledge
          </Link>
        </div>
      )}
    </AppShell>
  );
}
