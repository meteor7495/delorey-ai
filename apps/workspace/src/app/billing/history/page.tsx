'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toastFromError } from '@/lib/notify';
import { formatToman } from '@/lib/money';

type Tx = Awaited<ReturnType<typeof api.billingTransactions>>;

export default function BillingHistoryPage() {
  const [data, setData] = useState<Tx | null>(null);

  useEffect(() => {
    api.billingTransactions({ limit: 100 }).then(setData).catch(toastFromError);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="تاریخچه مالی"
          description="خرید اعتبار، شارژ خودکار، مصرف و بازگشت وجه"
          actions={
            <Button variant="outline" asChild>
              <Link href="/billing">کیف پول</Link>
            </Button>
          }
        />
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-[var(--text-4)]">
                  <th className="p-4 font-medium">تاریخ</th>
                  <th className="p-4 font-medium">نوع</th>
                  <th className="p-4 font-medium">مبلغ</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((t) => (
                  <tr key={t.id} className="border-t border-[var(--border-color)]">
                    <td className="p-4">
                      {new Date(t.date).toLocaleString('fa-IR')}
                    </td>
                    <td className="p-4">{t.label}</td>
                    <td
                      className={`p-4 tnum font-semibold ${t.amount >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
                    >
                      {t.amount >= 0 ? '+' : ''}
                      {formatToman(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.items ?? []).length === 0 && (
              <p className="p-6 text-sm text-[var(--text-3)]">تراکنشی نیست.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
