'use client';

import { toastFromError } from '@/lib/notify';
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormDialog } from '@/components/shared/form-dialog';

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  defaultAddress: string | null;
  orderCount?: number;
  identities?: Array<{ channel: string; externalId: string }>;
};

type CustomerDetail = CustomerRow & {
  addresses: Array<{ id: string; line: string; isDefault: boolean }>;
  identities: Array<{
    id: string;
    channel: string;
    externalId: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    channel: string;
    paymentStatus: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    items: Array<{ title: string; quantity: number; lineTotal: number }>;
  }>;
};

const CHANNEL_FA: Record<string, string> = {
  website: 'وب',
  telegram: 'تلگرام',
  bale: 'بله',
  instagram: 'اینستاگرام',
};

export default function ShopCustomersPage() {
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<CustomerDetail | null>(null);

  async function refresh(query?: string) {
    setRows((await api.listShopCustomers(query)) as unknown as CustomerRow[]);
  }

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, []);

  async function open(id: string) {
    try {
      setDetail((await api.getShopCustomer(id)) as unknown as CustomerDetail);
    } catch (err) {
      toastFromError(err);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="مشتری‌ها"
          description="یک مشتری، چند هویت کانال — سفارش‌ها در همان پرونده"
        />
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="جستجو نام یا موبایل"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => refresh(q).catch((e) => toastFromError(e))}
          >
            جستجو
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="مشتری ثبت نشده"
            description="با اولین سفارش از ویترین یا کانال‌ها اینجا ظاهر می‌شوند"
          />
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-[var(--text-3)] tnum">{c.phone}</p>
                    {c.defaultAddress ? (
                      <p className="text-xs text-[var(--text-4)]">{c.defaultAddress}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-1">
                      {(c.identities ?? []).map((i) => (
                        <Badge key={`${i.channel}-${i.externalId}`} variant="secondary">
                          {CHANNEL_FA[i.channel] ?? i.channel}
                        </Badge>
                      ))}
                      <Badge variant="outline">{c.orderCount ?? 0} سفارش</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => open(c.id)}>
                    پرونده
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <FormDialog
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        title={detail?.name ?? 'مشتری'}
        description={detail?.phone}
        size="lg"
      >
        {detail ? (
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold mb-1">هویت‌ها</p>
              {detail.identities.length === 0 ? (
                <p className="text-[var(--text-4)]">هویت کانالی ثبت نشده</p>
              ) : (
                <ul className="space-y-1">
                  {detail.identities.map((i) => (
                    <li key={`${i.channel}-${i.externalId}`}>
                      {CHANNEL_FA[i.channel] ?? i.channel}: {i.externalId}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-semibold mb-1">آدرس‌ها</p>
              {detail.addresses.length === 0 ? (
                <p className="text-[var(--text-4)]">آدرسی نیست</p>
              ) : (
                <ul className="space-y-1">
                  {detail.addresses.map((a) => (
                    <li key={a.id}>
                      {a.line}
                      {a.isDefault ? ' (پیش‌فرض)' : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-semibold mb-1">سفارش‌ها</p>
              {detail.orders.length === 0 ? (
                <p className="text-[var(--text-4)]">سفارشی نیست</p>
              ) : (
                <ul className="space-y-2">
                  {detail.orders.map((o) => (
                    <li key={o.id} className="rounded-md border border-[var(--border-color)] p-2">
                      <span className="tnum">{o.orderNumber}</span>
                      {' · '}
                      {CHANNEL_FA[o.channel] ?? o.channel}
                      {' · '}
                      {o.status}
                      {' · '}
                      {o.totalAmount.toLocaleString('fa-IR')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </FormDialog>
    </AppShell>
  );
}
