'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  channelLabel,
  escalationLabel,
  messageRoleLabel,
  ownershipLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      <div className="space-y-4">
        <PageHeader
          title="صندوق ورودی"
          description="گفتگوها · تحویل به انسان · بدون تیکت"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={!filter ? 'default' : 'outline'}
            onClick={() => setFilter('')}
          >
            همه
          </Button>
          <Button
            size="sm"
            variant={filter === 'human_owned' ? 'default' : 'outline'}
            onClick={() => setFilter('human_owned')}
          >
            در اختیار انسان
          </Button>
          <Button
            size="sm"
            variant={filter === 'ai_owned' ? 'default' : 'outline'}
            onClick={() => setFilter('ai_owned')}
          >
            پاسخ‌گوی AI
          </Button>
        </div>

        <div className="grid min-h-[60vh] gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
          <Card className="overflow-hidden">
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              {items.length === 0 && (
                <p className="p-4 text-sm text-[var(--text-3)]">
                  هنوز گفتگویی نیست. یک کانال را فعال کنید یا گفتگوی آزمایشی بسازید.
                </p>
              )}
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(item.id)}
                  className={cn(
                    'block w-full border-b border-[var(--border-color)] px-3.5 py-3 text-start transition-colors',
                    item.id === selectedId
                      ? 'bg-[var(--brand-50)]'
                      : 'bg-transparent hover:bg-[var(--surface-hover)]',
                  )}
                >
                  <div className="text-[13px] font-semibold text-[var(--text-1)]">
                    {channelLabel(item.channel)} · {ownershipLabel(item.ownership)}
                  </div>
                  <div className="mt-0.5 text-[13px] text-[var(--text-3)]">
                    {(item.preview ?? '—').slice(0, 80)}
                  </div>
                  {item.escalationReason && (
                    <div className="mt-0.5 text-xs text-[var(--danger)]">
                      {escalationLabel(item.escalationReason)}
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              {!selectedId && (
                <p className="text-sm text-[var(--text-3)]">
                  یک گفتگو را از لیست انتخاب کنید.
                </p>
              )}
              {selectedId && (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-1)]">
                        وضعیت: {ownershipLabel(ownership)}
                      </p>
                      {packet && (
                        <p className="text-xs text-[var(--text-3)]">
                          دلیل: {packet.reasonLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await api.inboxTakeover(selectedId);
                          await loadThread(selectedId);
                          await loadList();
                        }}
                      >
                        تحویل بگیر
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await api.inboxRelease(selectedId);
                          await loadThread(selectedId);
                          await loadList();
                        }}
                      >
                        بازگشت به AI
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/audit?c=${selectedId}`}>ممیزی</a>
                      </Button>
                    </div>
                  </div>

                  {packet && (
                    <div className="rounded-[var(--r-sm)] border border-[var(--warning)]/30 bg-[var(--warning-bg)] p-3 text-sm">
                      <strong className="text-[var(--text-1)]">بسته زمینه تحویل</strong>
                      {packet.intentSummary && (
                        <div className="mt-1 text-[var(--text-2)]">
                          خلاصه: {packet.intentSummary}
                        </div>
                      )}
                      {packet.citations?.length > 0 && (
                        <div className="mt-1 text-[var(--text-3)]">
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

                  <div className="flex max-h-[360px] flex-col gap-2 overflow-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'max-w-[85%] rounded-[10px] px-2.5 py-2 text-sm whitespace-pre-wrap',
                          m.role === 'shopper'
                            ? 'self-start bg-[#e8eef5] text-[var(--text-1)] dark:bg-[rgba(59,130,246,0.15)]'
                            : m.role === 'operator'
                              ? 'self-end bg-[#d8f3dc] dark:bg-[rgba(16,185,129,0.2)]'
                              : m.role === 'system'
                                ? 'self-end bg-[var(--warning-bg)]'
                                : 'self-end bg-[var(--brand-50)]',
                        )}
                      >
                        <div className="mb-0.5 text-[11px] text-[var(--text-3)]">
                          {messageRoleLabel(m.role)}
                        </div>
                        {m.content}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={onReply} className="flex gap-2">
                    <Input
                      className="flex-1"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="پاسخ اپراتور..."
                    />
                    <Button type="submit">ارسال</Button>
                  </form>
                  {selected && (
                    <p className="text-xs text-[var(--text-3)]">
                      {selected.messageCount} پیام · به‌روزرسانی{' '}
                      {new Date(selected.updatedAt).toLocaleString('fa-IR')}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
