'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

type InboxItem = {
  id: string;
  channel: string;
  ownership: string;
  escalationReason: string | null;
  preview: string | null;
  messageCount: number;
  updatedAt: string;
};

type ThreadMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export default function InboxClient() {
  const router = useRouter();
  const search = useSearchParams();
  const filter = search.get('ownership') as 'ai_owned' | 'human_owned' | null;
  const selectedId = search.get('c');

  const [items, setItems] = useState<InboxItem[]>([]);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [packet, setPacket] = useState<{
    reasonLabel: string;
    intentSummary: string | null;
    citations: Array<{
      type?: string;
      sku?: string;
      title: string;
      price?: number;
      sourceAttribution?: string;
    }>;
  } | null>(null);
  const [ownership, setOwnership] = useState('ai_owned');
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    const list = await api.listInbox(filter ?? undefined);
    setItems(list);
  }, [filter]);

  const loadThread = useCallback(async (id: string) => {
    const thread = await api.getInboxThread(id);
    setMessages(thread.messages);
    setOwnership(thread.conversation.ownership);
    setPacket(
      thread.conversation.handoffPacket
        ? {
            reasonLabel: thread.conversation.handoffPacket.reasonLabel,
            intentSummary: thread.conversation.handoffPacket.intentSummary,
            citations: thread.conversation.handoffPacket.citations,
          }
        : null,
    );
  }, []);

  useEffect(() => {
    loadList().catch((e) => setError(String(e)));
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setPacket(null);
      return;
    }
    loadThread(selectedId).catch((e) => setError(String(e)));
    const t = setInterval(() => {
      loadThread(selectedId).catch(() => undefined);
      loadList().catch(() => undefined);
    }, 4000);
    return () => clearInterval(t);
  }, [selectedId, loadThread, loadList]);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  function select(id: string) {
    const params = new URLSearchParams(search.toString());
    params.set('c', id);
    router.push(`/inbox?${params.toString()}`);
  }

  function setFilter(value: string) {
    const params = new URLSearchParams();
    if (value) params.set('ownership', value);
    if (selectedId) params.set('c', selectedId);
    router.push(`/inbox?${params.toString()}`);
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !reply.trim()) return;
    await api.inboxReply(selectedId, reply.trim());
    setReply('');
    await loadThread(selectedId);
    await loadList();
  }

  return (
    <AppShell>
      <h1>صندوق ورودی</h1>
      <p className="muted">گفتگوها · تحویل به انسان · بدون تیکت</p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="row" style={{ marginBottom: 12 }}>
        <button
          type="button"
          className={`btn ${!filter ? '' : 'secondary'}`}
          onClick={() => setFilter('')}
        >
          همه
        </button>
        <button
          type="button"
          className={`btn ${filter === 'human_owned' ? '' : 'secondary'}`}
          onClick={() => setFilter('human_owned')}
        >
          در اختیار انسان
        </button>
        <button
          type="button"
          className={`btn ${filter === 'ai_owned' ? '' : 'secondary'}`}
          onClick={() => setFilter('ai_owned')}
        >
          پاسخ‌گوی AI
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gap: 16,
          minHeight: '60vh',
        }}
      >
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {items.length === 0 && (
            <p className="muted" style={{ padding: 16 }}>
              هنوز گفتگویی نیست. از ویجت پیام بفرستید یا درخواست انسان کنید.
            </p>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                border: 'none',
                borderBottom: '1px solid var(--border)',
                background: item.id === selectedId ? '#e7eef2' : 'transparent',
                padding: '12px 14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {item.channel} ·{' '}
                {item.ownership === 'human_owned' ? 'انسان' : 'AI'}
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                {(item.preview ?? '—').slice(0, 80)}
              </div>
              {item.escalationReason && (
                <div style={{ color: 'var(--danger)', fontSize: 12 }}>
                  {item.escalationReason}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="card">
          {!selectedId && (
            <p className="muted">یک گفتگو را از لیست انتخاب کنید.</p>
          )}
          {selectedId && (
            <>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>وضعیت:</strong>{' '}
                  {ownership === 'human_owned'
                    ? 'در اختیار اپراتور'
                    : 'پاسخ‌گوی AI'}
                  {packet && (
                    <div className="muted" style={{ fontSize: 13 }}>
                      دلیل: {packet.reasonLabel}
                    </div>
                  )}
                </div>
                <div className="row">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={async () => {
                      await api.inboxTakeover(selectedId);
                      await loadThread(selectedId);
                      await loadList();
                    }}
                  >
                    تحویل بگیر
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={async () => {
                      await api.inboxRelease(selectedId);
                      await loadThread(selectedId);
                      await loadList();
                    }}
                  >
                    بازگشت به AI
                  </button>
                </div>
              </div>

              {packet && (
                <div className="banner" style={{ marginTop: 12 }}>
                  <strong>بسته زمینه handoff</strong>
                  {packet.intentSummary && (
                    <div>خلاصه: {packet.intentSummary}</div>
                  )}
                  {packet.citations?.length > 0 && (
                    <div>
                      استناد:{' '}
                      {packet.citations
                        .map((c) =>
                          c.type === 'knowledge' || c.sourceAttribution
                            ? `${c.title} (${c.sourceAttribution})`
                            : `${c.title} (${c.sku})`,
                        )
                        .join(' · ')}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  marginTop: 12,
                  maxHeight: 360,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf:
                        m.role === 'shopper' ? 'flex-start' : 'flex-end',
                      background:
                        m.role === 'shopper'
                          ? '#e8eef5'
                          : m.role === 'operator'
                            ? '#d8f3dc'
                            : m.role === 'system'
                              ? '#fff4e5'
                              : '#dcefea',
                      padding: '8px 10px',
                      borderRadius: 10,
                      maxWidth: '85%',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div className="muted" style={{ fontSize: 11 }}>
                      {m.role}
                    </div>
                    {m.content}
                  </div>
                ))}
              </div>

              <form onSubmit={onReply} className="row" style={{ marginTop: 12 }}>
                <input
                  className="input"
                  style={{ margin: 0, flex: 1 }}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="پاسخ اپراتور..."
                />
                <button className="btn" type="submit">
                  ارسال
                </button>
              </form>
              {selected && (
                <p className="muted" style={{ fontSize: 12 }}>
                  {selected.messageCount} پیام · به‌روزرسانی{' '}
                  {new Date(selected.updatedAt).toLocaleString('fa-IR')}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
