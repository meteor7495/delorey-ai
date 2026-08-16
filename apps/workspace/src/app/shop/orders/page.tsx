'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  channel?: string;
  paymentMethod?: string;
  paymentRef?: string | null;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNote?: string | null;
  createdAt: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأیید / پرداخت‌شده',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
};

const CHANNEL_FA: Record<string, string> = {
  website: 'وب',
  telegram: 'تلگرام',
  bale: 'بله',
  instagram: 'اینستاگرام',
};

const PAY_FA: Record<string, string> = {
  cod: 'پرداخت در محل',
  online: 'آنلاین',
};

const STATUS_BADGE: Record<
  string,
  'warning' | 'info' | 'success' | 'secondary' | 'destructive' | 'default'
> = {
  pending: 'warning',
  pending_payment: 'info',
  confirmed: 'success',
  shipped: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
};

const NEXT_ACTIONS: Record<string, Array<{ status: string; label: string; variant?: 'default' | 'outline' | 'destructive' }>> = {
  pending: [
    { status: 'confirmed', label: 'تأیید سفارش' },
    { status: 'cancelled', label: 'لغو', variant: 'destructive' },
  ],
  pending_payment: [
    { status: 'confirmed', label: 'ثبت پرداخت' },
    { status: 'cancelled', label: 'لغو', variant: 'destructive' },
  ],
  confirmed: [
    { status: 'shipped', label: 'ارسال شد' },
    { status: 'cancelled', label: 'لغو', variant: 'destructive' },
  ],
  shipped: [{ status: 'delivered', label: 'تحویل شد' }],
  delivered: [],
  cancelled: [],
};

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setOrders((await api.listShopOrders()) as unknown as Order[]);
  }

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim();
    return orders.filter((o) => {
      if (status !== 'all' && o.status !== status) return false;
      if (channel !== 'all' && (o.channel ?? 'website') !== channel) return false;
      if (!needle) return true;
      return (
        o.orderNumber.includes(needle) ||
        o.customerPhone.includes(needle) ||
        o.customerName.includes(needle)
      );
    });
  }, [orders, q, status, channel]);

  async function setStatusOf(id: string, next: string) {
    setBusyId(id);
    try {
      await api.updateShopOrderStatus(id, next);
      toastSuccess('وضعیت سفارش به‌روزرسانی شد');
      await refresh();
    } catch (err) {
      toastFromError(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="سفارش‌ها"
          description="سفارش‌های وب، تلگرام، بله و اینستاگرام — همه در یک دفتر"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="جستجو: شماره سفارش، نام یا موبایل"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(STATUS_FA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-2 text-sm"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="all">همه کانال‌ها</option>
            {Object.entries(CHANNEL_FA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => refresh()}>
            تازه‌سازی
          </Button>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="سفارشی نیست"
            description="وقتی مشتری از ویترین یا کانال‌ها خرید کند اینجا دیده می‌شود"
          />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[var(--text-3)]">موردی با این فیلتر پیدا نشد.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <Card key={o.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold flex flex-wrap items-center gap-1.5">
                        <span className="tnum">{o.orderNumber}</span>
                        <Badge variant={STATUS_BADGE[o.status] ?? 'outline'}>
                          {STATUS_FA[o.status] ?? o.status}
                        </Badge>
                        <Badge variant="secondary">
                          {CHANNEL_FA[o.channel ?? 'website'] ?? o.channel}
                        </Badge>
                        <Badge variant="outline">
                          {PAY_FA[o.paymentMethod ?? 'cod'] ?? o.paymentMethod}
                        </Badge>
                      </p>
                      <p className="text-xs text-[var(--text-3)]">
                        {o.customerName} · {o.customerPhone} ·{' '}
                        {o.totalAmount.toLocaleString('fa-IR')} ریال
                        {o.paymentRef ? ` · رسید ${o.paymentRef}` : ''}
                      </p>
                      <p className="text-xs text-[var(--text-4)]">{o.customerAddress}</p>
                      {o.customerNote ? (
                        <p className="text-xs text-[var(--text-4)]">یادداشت: {o.customerNote}</p>
                      ) : null}
                      <p className="text-[11px] text-[var(--text-4)]">
                        {new Date(o.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(NEXT_ACTIONS[o.status] ?? []).map((a) => (
                        <Button
                          key={a.status}
                          size="sm"
                          variant={a.variant ?? 'default'}
                          disabled={busyId === o.id}
                          onClick={() => setStatusOf(o.id, a.status)}
                        >
                          {a.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <ul className="text-sm text-[var(--text-3)]">
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.title} × {i.quantity} — {i.lineTotal.toLocaleString('fa-IR')}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
