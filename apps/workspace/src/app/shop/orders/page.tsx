'use client';

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
  totalAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  items: Array<{ title: string; quantity: number; lineTotal: number }>;
};

const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function ShopOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setOrders((await api.listShopOrders()) as unknown as Order[]);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="سفارش‌های ویترین"
          description="سفارش‌های ثبت‌شده از فروشگاه بومی (COD)"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

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
                        <Badge variant="outline">{o.status}</Badge>
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
                          .then(refresh)
                          .catch((err) => setError(String(err)))
                      }
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
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
