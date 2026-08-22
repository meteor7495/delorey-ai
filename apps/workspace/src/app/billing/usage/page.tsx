'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toastFromError } from '@/lib/notify';
import { Activity, Calendar } from 'lucide-react';
import { formatToman } from '@/lib/money';

type Usage = Awaited<ReturnType<typeof api.billingUsage>>;

export default function BillingUsagePage() {
  const [data, setData] = useState<Usage | null>(null);

  useEffect(() => {
    api.billingUsage().then(setData).catch(toastFromError);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="مصرف اعتبار"
          description="هزینهٔ سرویس‌های سلومـا به تومان — بدون واحد توکن"
          actions={
            <Button variant="outline" asChild>
              <Link href="/billing">بازگشت به کیف پول</Link>
            </Button>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            title="امروز"
            value={data ? formatToman(data.today) : '…'}
            icon={Activity}
          />
          <StatCard
            title="این ماه"
            value={data ? formatToman(data.thisMonth) : '…'}
            icon={Calendar}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>تفکیک سرویس</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.breakdown ?? []).length === 0 && (
              <p className="text-sm text-[var(--text-3)]">هنوز مصرفی ثبت نشده.</p>
            )}
            {(data?.breakdown ?? []).map((b) => (
              <div
                key={b.service}
                className="flex items-center justify-between text-sm"
              >
                <span>{b.label}</span>
                <span className="tnum font-semibold">{formatToman(b.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>جزئیات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-[var(--text-4)]">
                    <th className="pb-2 font-medium">تاریخ</th>
                    <th className="pb-2 font-medium">سرویس</th>
                    <th className="pb-2 font-medium">هزینه</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((r) => (
                    <tr key={r.id} className="border-t border-[var(--border-color)]">
                      <td className="py-2">
                        {new Date(r.date).toLocaleString('fa-IR')}
                      </td>
                      <td>{r.label}</td>
                      <td className="tnum">{formatToman(r.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
