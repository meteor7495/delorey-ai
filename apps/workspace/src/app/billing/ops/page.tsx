'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastFromError, toastSuccess } from '@/lib/notify';
import { formatToman } from '@/lib/money';

export default function BillingOpsPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tenantId, setTenantId] = useState('');
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [margins, setMargins] = useState<{
    providerCost: number;
    customerCharge: number;
    grossMargin: number;
  } | null>(null);
  const [amount, setAmount] = useState('100000');
  const [note, setNote] = useState('اعتبار دستی');

  useEffect(() => {
    api
      .billingWallet()
      .then((w) => setAllowed(w.isPlatformAdmin))
      .catch(() => setAllowed(false));
    api
      .adminBillingMargins()
      .then((m) =>
        setMargins({
          providerCost: m.providerCost,
          customerCharge: m.customerCharge,
          grossMargin: m.grossMargin,
        }),
      )
      .catch(() => undefined);
  }, []);

  async function loadTenant(e: FormEvent) {
    e.preventDefault();
    try {
      const data = await api.adminBillingTenant(tenantId.trim());
      setOverview(data);
    } catch (err) {
      toastFromError(err);
    }
  }

  async function credit(kind: 'credit' | 'refund') {
    try {
      const body = {
        tenantId: tenantId.trim(),
        amount: Number(amount),
        description: note,
        idempotencyKey: `${kind}-${tenantId}-${Date.now()}`,
      };
      if (kind === 'credit') await api.adminBillingCredit(body);
      else await api.adminBillingRefund(body);
      toastSuccess(kind === 'credit' ? 'اعتبار اضافه شد' : 'بازگشت ثبت شد');
      const data = await api.adminBillingTenant(tenantId.trim());
      setOverview(data);
    } catch (err) {
      toastFromError(err);
    }
  }

  if (allowed === false) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--text-3)]">دسترسی مدیریت پلتفرم ندارید.</p>
      </AppShell>
    );
  }

  const wallet = (overview?.wallet ?? null) as
    | { balance?: number; available?: number }
    | null;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="عملیات مالی پلتفرم"
          description="هزینه تأمین‌کننده، شارژ مشتری و حاشیه — فقط ادمین پلتفرم"
          actions={
            <Button variant="outline" asChild>
              <Link href="/billing">کیف پول</Link>
            </Button>
          }
        />
        {margins && (
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <Card>
              <CardContent className="p-4">
                <div className="text-[var(--text-4)]">هزینه Provider</div>
                <div className="mt-1 text-lg font-bold tnum">
                  {formatToman(Math.round(margins.providerCost))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-[var(--text-4)]">شارژ مشتری</div>
                <div className="mt-1 text-lg font-bold tnum">
                  {formatToman(margins.customerCharge)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-[var(--text-4)]">حاشیه ناخالص</div>
                <div className="mt-1 text-lg font-bold tnum">
                  {formatToman(Math.round(margins.grossMargin))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>تنانت</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={loadTenant} className="flex gap-2">
              <Input
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="tenant id"
              />
              <Button type="submit">مشاهده</Button>
            </form>
            {wallet && (
              <p className="mt-3 text-sm">
                موجودی: {formatToman(Number(wallet.available ?? wallet.balance ?? 0))}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label>مبلغ تومان</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>توضیح</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={() => credit('credit')}>
                اعتبار دستی
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => credit('refund')}
              >
                بازگشت وجه
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
