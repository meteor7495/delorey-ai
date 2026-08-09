'use client';

import { toastFromError } from '@/lib/notify';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  adminActionLabel,
  channelLabel,
  decisionLabel,
  escalationLabel,
  messageRoleLabel,
  ownershipLabel,
} from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    loadList().catch((e) => toastFromError(e));
  }, [loadList]);

  useEffect(() => {
    if (tab !== 'turns' || !selectedId) {
      setDetail(null);
      return;
    }
    api
      .getAuditTurn(selectedId)
      .then(setDetail)
      .catch((e) => toastFromError(e));
  }, [selectedId, tab]);

  useEffect(() => {
    if (tab !== 'admin' || !selectedAdminId) {
      setAdminDetail(null);
      return;
    }
    api
      .getAdminAudit(selectedAdminId)
      .then(setAdminDetail)
      .catch((e) => toastFromError(e));
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
      <div className="space-y-4">
        <PageHeader
          title="ممیزی"
          description="نوبت‌های کارمند فروش و اقدامات ادمین — فقط‌افزودنی · شفافیت"
        />

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={tab === 'turns' ? 'default' : 'outline'}
            onClick={() => setTab('turns')}
          >
            نوبت‌های کارمند
          </Button>
          <Button
            size="sm"
            variant={tab === 'admin' ? 'default' : 'outline'}
            onClick={() => setTab('admin')}
          >
            اقدامات ادمین
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d} روز
            </Button>
          ))}
          {tab === 'turns' ? (
            <select
              className="h-8 rounded-[var(--r-xs)] border border-[var(--border-color)] bg-[var(--surface)] px-2 text-xs"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <option value="">همه تصمیم‌ها</option>
              <option value="answer_grounded">{decisionLabel('answer_grounded')}</option>
              <option value="answer_knowledge">{decisionLabel('answer_knowledge')}</option>
              <option value="recommend">{decisionLabel('recommend')}</option>
              <option value="order_lookup">{decisionLabel('order_lookup')}</option>
              <option value="escalated:*">{decisionLabel('escalated:*')}</option>
              <option value="guardrail_block:*">{decisionLabel('guardrail_block:*')}</option>
              <option value="answer_empty_catalog">
                {decisionLabel('answer_empty_catalog')}
              </option>
            </select>
          ) : (
            <select
              className="h-8 rounded-[var(--r-xs)] border border-[var(--border-color)] bg-[var(--surface)] px-2 text-xs"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              <option value="">همه اقدامات</option>
              <option value="employee.*">{adminActionLabel('employee.*')}</option>
              <option value="knowledge.*">{adminActionLabel('knowledge.*')}</option>
              <option value="store.*">{adminActionLabel('store.*')}</option>
              <option value="channel.*">{adminActionLabel('channel.*')}</option>
            </select>
          )}
          {conversationId && tab === 'turns' && (
            <span className="text-xs text-[var(--text-3)]">
              فیلتر گفتگو: <code dir="ltr">{conversationId.slice(0, 8)}…</code>{' '}
              <Link href="/audit" className="text-[var(--brand-500)]">
                حذف
              </Link>
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardContent className="max-h-[70vh] overflow-auto p-0">
              <div className="border-b border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-3)]">
                {total} مورد
              </div>
              {tab === 'turns' && items.length === 0 && (
                <p className="p-4 text-sm text-[var(--text-3)]">
                  ممیزی‌ای در این فیلتر نیست.
                </p>
              )}
              {tab === 'admin' && adminItems.length === 0 && (
                <p className="p-4 text-sm text-[var(--text-3)]">
                  اقدام ادمینی در این فیلتر نیست.
                </p>
              )}
              {tab === 'turns' &&
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTurn(item.id)}
                    className={cn(
                      'block w-full border-b border-[var(--border-color)] px-3.5 py-2.5 text-start',
                      item.id === selectedId
                        ? 'bg-[var(--brand-50)]'
                        : 'hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    <div className="text-[13px] font-semibold text-[var(--text-1)]">
                      {decisionLabel(item.decision)}
                    </div>
                    <div className="text-xs text-[var(--text-3)]" dir="ltr">
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
                    className={cn(
                      'block w-full border-b border-[var(--border-color)] px-3.5 py-2.5 text-start',
                      item.id === selectedAdminId
                        ? 'bg-[var(--brand-50)]'
                        : 'hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    <div className="text-[13px] font-semibold text-[var(--text-1)]">
                      {adminActionLabel(item.action)}
                    </div>
                    <div className="text-xs text-[var(--text-3)]">{item.summary}</div>
                    <div className="text-xs text-[var(--text-3)]" dir="ltr">
                      {new Date(item.createdAt).toLocaleString('fa-IR')}
                    </div>
                  </button>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-5">
              {tab === 'turns' && !detail && (
                <p className="text-sm text-[var(--text-3)]">
                  یک نوبت را از لیست انتخاب کنید.
                </p>
              )}
              {tab === 'admin' && !adminDetail && (
                <p className="text-sm text-[var(--text-3)]">
                  یک اقدام ادمین را انتخاب کنید.
                </p>
              )}
              {tab === 'turns' && detail && (
                <>
                  <p className="font-semibold text-[var(--text-1)]">
                    {decisionLabel(detail.decision)}
                  </p>
                  <p className="text-xs text-[var(--text-3)]">
                    {new Date(detail.createdAt).toLocaleString('fa-IR')}
                  </p>
                  <p className="text-xs text-[var(--text-3)]">{detail.note}</p>
                  {detail.conversation && (
                    <p className="text-sm text-[var(--text-2)]">
                      کانال: {channelLabel(detail.conversation.channel)} · مالکیت:{' '}
                      {ownershipLabel(detail.conversation.ownership)}
                      {detail.conversation.escalationReason
                        ? ` · ${escalationLabel(detail.conversation.escalationReason)}`
                        : ''}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/inbox?c=${detail.conversationId}`}>
                        باز کردن صندوق ورودی
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/audit?c=${detail.conversationId}`}>
                        فقط این گفتگو
                      </Link>
                    </Button>
                  </div>
                  <h3 className="pt-2 text-sm font-bold">استنادها</h3>
                  <pre
                    dir="ltr"
                    className="overflow-x-auto rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface-3)] p-3 text-xs whitespace-pre-wrap"
                  >
                    {JSON.stringify(detail.citations, null, 2)}
                  </pre>
                  <h3 className="text-sm font-bold">پیام‌های اخیر</h3>
                  <div className="flex flex-col gap-2">
                    {detail.recentMessages.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-[var(--surface-3)] px-2.5 py-2 text-[13px]"
                      >
                        <span className="text-[var(--text-3)]">
                          {messageRoleLabel(m.role)}
                        </span>
                        <div>{m.content}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {tab === 'admin' && adminDetail && (
                <>
                  <p className="font-semibold text-[var(--text-1)]">
                    {adminActionLabel(adminDetail.action)}
                  </p>
                  <p className="text-sm text-[var(--text-2)]">{adminDetail.summary}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    {new Date(adminDetail.createdAt).toLocaleString('fa-IR')}
                  </p>
                  <p className="text-xs text-[var(--text-3)]" dir="ltr">
                    عامل: {adminDetail.actorUserId}
                  </p>
                  <h3 className="pt-2 text-sm font-bold">جزئیات</h3>
                  <pre
                    dir="ltr"
                    className="overflow-x-auto rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface-3)] p-3 text-xs whitespace-pre-wrap"
                  >
                    {JSON.stringify(adminDetail.payload, null, 2)}
                  </pre>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
