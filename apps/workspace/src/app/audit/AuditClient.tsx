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

type AdminItem = {
  id: string;
  actorUserId: string;
  action: string;
  summary: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
};

type AuditDetail = Awaited<ReturnType<typeof api.getAuditTurn>>;
type AdminDetail = Awaited<ReturnType<typeof api.getAdminAudit>>;

type Tab = 'turns' | 'admin';

export default function AuditClient() {
  const router = useRouter();
  const search = useSearchParams();
  const conversationId = search.get('c') ?? undefined;
  const selectedId = search.get('t');
  const selectedAdminId = search.get('a');
  const tab = (search.get('tab') as Tab) === 'admin' ? 'admin' : 'turns';

  const [days, setDays] = useState(7);
  const [decision, setDecision] = useState('');
  const [action, setAction] = useState('');
  const [items, setItems] = useState<AuditItem[]>([]);
  const [adminItems, setAdminItems] = useState<AdminItem[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [adminDetail, setAdminDetail] = useState<AdminDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    if (tab === 'admin') {
      const res = await api.listAdminAudits({
        days,
        action: action || undefined,
        limit: 50,
      });
      setAdminItems(res.items);
      setTotal(res.total);
      return;
    }
    const res = await api.listAuditTurns({
      days,
      decision: decision || undefined,
      conversationId,
      limit: 50,
    });
    setItems(res.items);
    setTotal(res.total);
  }, [days, decision, conversationId, tab, action]);

  useEffect(() => {
    loadList().catch((e) => setError(String(e)));
  }, [loadList]);

  useEffect(() => {
    if (tab !== 'turns' || !selectedId) {
      setDetail(null);
      return;
    }
    api
      .getAuditTurn(selectedId)
      .then(setDetail)
      .catch((e) => setError(String(e)));
  }, [selectedId, tab]);

  useEffect(() => {
    if (tab !== 'admin' || !selectedAdminId) {
      setAdminDetail(null);
      return;
    }
    api
      .getAdminAudit(selectedAdminId)
      .then(setAdminDetail)
      .catch((e) => setError(String(e)));
  }, [selectedAdminId, tab]);

  function setTab(next: Tab) {
    const params = new URLSearchParams();
    if (next === 'admin') params.set('tab', 'admin');
    if (conversationId && next === 'turns') params.set('c', conversationId);
    router.push(`/audit?${params.toString()}`);
  }

  function selectTurn(id: string) {
    const params = new URLSearchParams(search.toString());
    params.set('t', id);
    params.delete('a');
    params.delete('tab');
    router.push(`/audit?${params.toString()}`);
  }

  function selectAdmin(id: string) {
    const params = new URLSearchParams();
    params.set('tab', 'admin');
    params.set('a', id);
    router.push(`/audit?${params.toString()}`);
  }

  return (
    <AppShell>
      <h1>ممیزی</h1>
      <p className="muted">
        نوبت‌های AI و اقدامات ادمین — فقط‌افزودنی · شفافیت AI
      </p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="row" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={`btn ${tab === 'turns' ? '' : 'secondary'}`}
          onClick={() => setTab('turns')}
        >
          نوبت‌های AI
        </button>
        <button
          type="button"
          className={`btn ${tab === 'admin' ? '' : 'secondary'}`}
          onClick={() => setTab('admin')}
        >
          اقدامات ادمین
        </button>
      </div>

      <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
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
        {tab === 'turns' ? (
          <select
            className="input"
            style={{ width: 'auto', margin: 0 }}
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="">همه تصمیم‌ها</option>
            <option value="answer_grounded">answer_grounded</option>
            <option value="answer_knowledge">answer_knowledge</option>
            <option value="recommend">recommend</option>
            <option value="order_lookup">order_lookup</option>
            <option value="escalated:*">escalated:*</option>
            <option value="guardrail_block:*">guardrail_block:*</option>
            <option value="answer_empty_catalog">answer_empty_catalog</option>
          </select>
        ) : (
          <select
            className="input"
            style={{ width: 'auto', margin: 0 }}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="">همه اقدامات</option>
            <option value="employee.*">employee.*</option>
            <option value="knowledge.*">knowledge.*</option>
            <option value="store.*">store.*</option>
            <option value="channel.*">channel.*</option>
          </select>
        )}
        {conversationId && tab === 'turns' && (
          <span className="muted" style={{ fontSize: 13 }}>
            فیلتر گفتگو: <code dir="ltr">{conversationId.slice(0, 8)}…</code>{' '}
            <Link href="/audit">حذف</Link>
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
        <div
          className="card"
          style={{ padding: 0, maxHeight: '70vh', overflow: 'auto' }}
        >
          <div style={{ padding: 12 }} className="muted">
            {total} مورد
          </div>
          {tab === 'turns' && items.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              ممیزی‌ای در این فیلتر نیست.
            </p>
          )}
          {tab === 'admin' && adminItems.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              اقدام ادمینی در این فیلتر نیست.
            </p>
          )}
          {tab === 'turns' &&
            items.map((item) => (
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
                  background:
                    item.id === selectedId ? '#e7eef2' : 'transparent',
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {item.decision}
                </div>
                <div className="muted" style={{ fontSize: 12 }} dir="ltr">
                  {new Date(item.createdAt).toLocaleString('fa-IR')} ·{' '}
                  {item.conversationId.slice(0, 8)}
                </div>
              </button>
            ))}
          {tab === 'admin' &&
            adminItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectAdmin(item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'right',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  background:
                    item.id === selectedAdminId ? '#e7eef2' : 'transparent',
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13 }}>
                  {item.action}
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {item.summary}
                </div>
                <div className="muted" style={{ fontSize: 12 }} dir="ltr">
                  {new Date(item.createdAt).toLocaleString('fa-IR')}
                </div>
              </button>
            ))}
        </div>

        <div className="card">
          {tab === 'turns' && !detail && (
            <p className="muted">یک نوبت را از لیست انتخاب کنید.</p>
          )}
          {tab === 'admin' && !adminDetail && (
            <p className="muted">یک اقدام ادمین را انتخاب کنید.</p>
          )}
          {tab === 'turns' && detail && (
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
                  کانال: {detail.conversation.channel} · مالکیت:{' '}
                  {detail.conversation.ownership}
                  {detail.conversation.escalationReason
                    ? ` · ${detail.conversation.escalationReason}`
                    : ''}
                </p>
              )}
              <div className="row">
                <Link
                  className="btn secondary"
                  href={`/inbox?c=${detail.conversationId}`}
                >
                  باز کردن صندوق ورودی
                </Link>
                <Link
                  className="btn secondary"
                  href={`/audit?c=${detail.conversationId}`}
                >
                  فقط این گفتگو
                </Link>
              </div>
              <h3 style={{ marginTop: 16 }}>Citations</h3>
              <pre
                className="snippet"
                style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}
              >
                {JSON.stringify(detail.citations, null, 2)}
              </pre>
              <h3>پیام‌های اخیر</h3>
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
          {tab === 'admin' && adminDetail && (
            <>
              <p>
                <strong>{adminDetail.action}</strong>
              </p>
              <p>{adminDetail.summary}</p>
              <p className="muted" style={{ fontSize: 13 }}>
                {new Date(adminDetail.createdAt).toLocaleString('fa-IR')}
              </p>
              <p className="muted" style={{ fontSize: 13 }} dir="ltr">
                actor: {adminDetail.actorUserId}
              </p>
              <h3 style={{ marginTop: 16 }}>Payload</h3>
              <pre
                className="snippet"
                style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}
              >
                {JSON.stringify(adminDetail.payload, null, 2)}
              </pre>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
