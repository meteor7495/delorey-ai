'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

type AuditItem = {
  id: string;
  conversationId: string;
  decision: string;
  citations: unknown;
  createdAt: string;
};

type AuditDetail = Awaited<ReturnType<typeof api.getAuditTurn>>;

export default function AuditClient() {
  const router = useRouter();
  const search = useSearchParams();
  const conversationId = search.get('c') ?? undefined;
  const selectedId = search.get('t');

  const [days, setDays] = useState(7);
  const [decision, setDecision] = useState('');
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const res = await api.listAuditTurns({
      days,
      decision: decision || undefined,
      conversationId,
      limit: 50,
    });
    setItems(res.items);
    setTotal(res.total);
  }, [days, decision, conversationId]);

  useEffect(() => {
    loadList().catch((e) => setError(String(e)));
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    api
      .getAuditTurn(selectedId)
      .then(setDetail)
      .catch((e) => setError(String(e)));
  }, [selectedId]);

  function selectTurn(id: string) {
    const params = new URLSearchParams(search.toString());
    params.set('t', id);
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <AppShell>
      <h1>Ù…Ù…ÛŒØ²ÛŒ (Audit)</h1>
      <p className="muted">
        Ù†ÙˆØ¨Øªâ€ŒÙ‡Ø§ÛŒ AI Ø¨Ù‡â€ŒØµÙˆØ±Øª append-only â€” Ø¨Ø¯ÙˆÙ† prompt Ø®Ø§Ù… Â· Transparent AI
      </p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            type="button"
            className={`btn ${days === d ? '' : 'secondary'}`}
            onClick={() => setDays(d)}
          >
            {d} Ø±ÙˆØ²
          </button>
        ))}
        <select
          className="input"
          style={{ width: 'auto', margin: 0 }}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        >
          <option value="">Ù‡Ù…Ù‡ ØªØµÙ…ÛŒÙ…â€ŒÙ‡Ø§</option>
          <option value="answer_grounded">answer_grounded</option>
          <option value="answer_knowledge">answer_knowledge</option>
          <option value="recommend">recommend</option>
          <option value="order_lookup">order_lookup</option>
          <option value="escalated:*">escalated:*</option>
          <option value="answer_empty_catalog">answer_empty_catalog</option>
        </select>
        {conversationId && (
          <span className="muted" style={{ fontSize: 13 }}>
            ÙÛŒÙ„ØªØ± Ú¯ÙØªÚ¯Ùˆ: <code dir="ltr">{conversationId.slice(0, 8)}â€¦</code>{' '}
            <Link href="/audit">Ø­Ø°Ù</Link>
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1fr)',
          gap: 16,
        }}
      >
        <div className="card" style={{ padding: 0, maxHeight: '70vh', overflow: 'auto' }}>
          <div style={{ padding: 12 }} className="muted">
            {total} Ù†ÙˆØ¨Øª
          </div>
          {items.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              Ù…Ù…ÛŒØ²ÛŒâ€ŒØ§ÛŒ Ø¯Ø± Ø§ÛŒÙ† ÙÛŒÙ„ØªØ± Ù†ÛŒØ³Øª.
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectTurn(item.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: item.id === selectedId ? '#e7eef2' : 'transparent',
                padding: '10px 14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.decision}</div>
              <div className="muted" style={{ fontSize: 12 }} dir="ltr">
                {new Date(item.createdAt).toLocaleString('fa-IR')} Â·{' '}
                {item.conversationId.slice(0, 8)}
              </div>
            </button>
          ))}
        </div>

        <div className="card">
          {!detail && (
            <p className="muted">ÛŒÚ© Ù†ÙˆØ¨Øª Ø±Ø§ Ø§Ø² Ù„ÛŒØ³Øª Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.</p>
          )}
          {detail && (
            <>
              <p>
                <strong>{detail.decision}</strong>
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {new Date(detail.createdAt).toLocaleString('fa-IR')}
              </p>
              <p className="muted" style={{ fontSize: 13 }}>
                {detail.note}
              </p>
              {detail.conversation && (
                <p>
                  Ú©Ø§Ù†Ø§Ù„: {detail.conversation.channel} Â· Ù…Ø§Ù„Ú©ÛŒØª:{' '}
                  {detail.conversation.ownership}
                  {detail.conversation.escalationReason
                    ? ` Â· ${detail.conversation.escalationReason}`
                    : ''}
                </p>
              )}
              <div className="row">
                <Link
                  className="btn secondary"
                  href={`/inbox?c=${detail.conversationId}`}
                >
                  Ø¨Ø§Ø² Ú©Ø±Ø¯Ù† Inbox
                </Link>
                <Link
                  className="btn secondary"
                  href={`/audit?c=${detail.conversationId}`}
                >
                  ÙÙ‚Ø· Ø§ÛŒÙ† Ú¯ÙØªÚ¯Ùˆ
                </Link>
              </div>
              <h3 style={{ marginTop: 16 }}>Citations</h3>
              <pre
                className="snippet"
                style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}
              >
                {JSON.stringify(detail.citations, null, 2)}
              </pre>
              <h3>Ù¾ÛŒØ§Ù…â€ŒÙ‡Ø§ÛŒ Ø§Ø®ÛŒØ±</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detail.recentMessages.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#f4f6f8',
                      padding: '8px 10px',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <span className="muted">{m.role}</span>
                    <div>{m.content}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

