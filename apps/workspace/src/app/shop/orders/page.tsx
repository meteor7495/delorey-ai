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
import { FormDialog } from '@/components/shared/form-dialog';

type HistoryRow = {
  id: string;
  fromStatus: string;
  toStatus: string;
  paymentStatus: string | null;
  reason: string | null;
  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  channel?: string;
  paymentMethod?: string;
  paymentRef?: string | null;
  rejectionReason?: string | null;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerNote?: string | null;
  createdAt: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
  history?: HistoryRow[];
};

const STATUS_FA: Record<string, string> = {
  draft: 'ثبت سفارش',
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  pending_approval: 'در انتظار تأیید ادمین',
  approved: 'تأییدشده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
  rejected: 'رد شده',
  payment_failed: 'پرداخت ناموفق',
};

const PAYMENT_FA: Record<string, string> = {
  unpaid: 'پرداخت‌نشده',
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  failed: 'ناموفق',
  refunded: 'بازگشت وجه',
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
  pending_approval: 'warning',
  approved: 'success',
  processing: 'info',
  shipped: 'default',
  delivered: 'secondary',
  cancelled: 'destructive',
  rejected: 'destructive',
  payment_failed: 'destructive',
};

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Order | null>(null);

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

  async function approve(id: string) {
    setBusyId(id);
    try {
      await api.approveShopOrder(id);
      toastSuccess('سفارش تأیید شد');
      await refresh();
    } catch (err) {
      toastFromError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function submitReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await api.rejectShopOrder(rejecting.id, rejectReason.trim());
      toastSuccess('سفارش رد شد');
      setRejecting(null);
      setRejectReason('');
      await refresh();
    } catch (err) {
      toastFromError(err);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleTimeline(order: Order) {
    if (expandedId === order.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(order.id);
    try {
      setDetail((await api.getShopOrder(order.id)) as unknown as Order);
    } catch (err) {
      toastFromError(err);
    }
  }

  function actionsFor(order: Order) {
    const s = order.status;
    const buttons: Array<{
      key: string;
      label: string;
      variant?: 'default' | 'outline' | 'destructive';
      run: () => void;
    }> = [];
    if (s === 'pending' || s === 'pending_approval') {
      buttons.push({ key: 'approve', label: 'تأیید', run: () => approve(order.id) });
      buttons.push({
        key: 'reject',
        label: 'رد',
        variant: 'destructive',
        run: () => {
          setRejectReason('');
          setRejecting(order);
        },
      });
    }
    if (s === 'pending_payment') {
      buttons.push({
        key: 'paid',
        label: 'ثبت پرداخت',
        run: () => setStatusOf(order.id, 'pending_approval'),
      });
      buttons.push({
        key: 'cancel',
        label: 'لغو',
        variant: 'destructive',
        run: () => setStatusOf(order.id, 'cancelled'),
      });
    }
    if (s === 'approved') {
      buttons.push({
        key: 'processing',
        label: 'آماده‌سازی',
        variant: 'outline',
        run: () => setStatusOf(order.id, 'processing'),
      });
      buttons.push({
        key: 'ship',
        label: 'ارسال شد',
        run: () => setStatusOf(order.id, 'shipped'),
      });
      buttons.push({
        key: 'cancel',
        label: 'لغو',
        variant: 'destructive',
        run: () => setStatusOf(order.id, 'cancelled'),
      });
    }
    if (s === 'processing') {
      buttons.push({
        key: 'ship',
        label: 'ارسال شد',
        run: () => setStatusOf(order.id, 'shipped'),
      });
    }
    if (s === 'shipped') {
      buttons.push({
        key: 'deliver',
        label: 'تحویل شد',
        run: () => setStatusOf(order.id, 'delivered'),
      });
    }
    if (s === 'payment_failed') {
      buttons.push({
        key: 'paid',
        label: 'ثبت پرداخت',
        run: () => setStatusOf(order.id, 'pending_approval'),
      });
      buttons.push({
        key: 'cancel',
        label: 'لغو',
        variant: 'destructive',
        run: () => setStatusOf(order.id, 'cancelled'),
      });
    }
    return buttons;
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
            {Object.entries(STATUS_FA)
              .filter(([k]) => k !== 'draft')
              .map(([k, v]) => (
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
                        <Badge
                          variant={
                            o.paymentStatus === 'paid'
                              ? 'success'
                              : o.paymentStatus === 'failed'
                                ? 'destructive'
                                : 'outline'
                          }
                        >
                          {PAYMENT_FA[o.paymentStatus ?? 'unpaid'] ?? o.paymentStatus}
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
                      {o.rejectionReason ? (
                        <p className="text-xs text-[var(--color-danger)]">
                          دلیل رد: {o.rejectionReason}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-[var(--text-4)]">
                        {new Date(o.createdAt).toLocaleString('fa-IR')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {actionsFor(o).map((a) => (
                        <Button
                          key={a.key}
                          size="sm"
                          variant={a.variant ?? 'default'}
                          disabled={busyId === o.id}
                          onClick={a.run}
                        >
                          {a.label}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleTimeline(o)}
                      >
                        {expandedId === o.id ? 'بستن تاریخچه' : 'تاریخچه'}
                      </Button>
                    </div>
                  </div>
                  <ul className="text-sm text-[var(--text-3)]">
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.title} × {i.quantity} — {i.lineTotal.toLocaleString('fa-IR')}
                      </li>
                    ))}
                  </ul>
                  {expandedId === o.id && detail?.id === o.id && detail.history?.length ? (
                    <ol className="space-y-1 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-3)]">
                      {detail.history.map((h) => (
                        <li key={h.id}>
                          {STATUS_FA[h.fromStatus] ?? h.fromStatus}
                          {' → '}
                          {STATUS_FA[h.toStatus] ?? h.toStatus}
                          {h.reason ? ` · ${h.reason}` : ''}
                          <span className="text-[var(--text-4)]">
                            {' · '}
                            {new Date(h.createdAt).toLocaleString('fa-IR')}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FormDialog
        open={!!rejecting}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
        title="رد سفارش"
        description={
          rejecting
            ? `سفارش ${rejecting.orderNumber} رد می‌شود. دلیل برای مشتری الزامی است.`
            : undefined
        }
      >
        <div className="space-y-3">
          <textarea
            className="min-h-24 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-2 text-sm"
            placeholder="مثلاً موجودی کافی نیست"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejecting(null)}>
              انصراف
            </Button>
            <Button
              variant="destructive"
              disabled={!rejecting || rejectReason.trim().length < 3 || busyId === rejecting.id}
              onClick={() => submitReject()}
            >
              رد سفارش
            </Button>
          </div>
        </div>
      </FormDialog>
    </AppShell>
  );
}
