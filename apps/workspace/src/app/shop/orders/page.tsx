'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  channel?: string;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار تأیید',
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأیید شده',
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

const statuses = [
  'pending',
  'pending_payment',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  async function refresh() {
    setOrders((await api.listShopOrders()) as unknown as Order[]);
  }

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="سفارش‌ها"
          description="سفارش‌های وب، تلگرام، بله و اینستاگرام — همه در یک دفتر"
        />

        {orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="سفارشی نیست"
            description="وقتی مشتری از ویترین خرید کند اینجا دیده می‌شود"
          />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {o.orderNumber}{' '}
                        <Badge variant="outline">
                          {STATUS_FA[o.status] ?? o.status}
                        </Badge>{' '}
                        <Badge variant="secondary">
                          {CHANNEL_FA[o.channel ?? 'website'] ?? o.channel}
                        </Badge>
                      </p>
                      <p className="text-xs text-[var(--text-3)]">
                        {o.customerName} · {o.customerPhone} ·{' '}
                        {o.totalAmount.toLocaleString('fa-IR')} ریال
                      </p>
                      <p className="text-xs text-[var(--text-4)]">
                        {o.customerAddress}
                      </p>
                    </div>
                    <select
                      className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-2 text-sm"
                      value={o.status}
                      onChange={(e) =>
                        api
                          .updateShopOrderStatus(o.id, e.target.value)
                          .then(() => {
                            toastSuccess('وضعیت سفارش به‌روزرسانی شد');
                            return refresh();
                          })
                          .catch((err) => toastFromError(err))
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_FA[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <ul className="text-sm text-[var(--text-3)]">
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.title} × {i.quantity}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" variant="outline" onClick={() => refresh()}>
                    تازه‌سازی
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
