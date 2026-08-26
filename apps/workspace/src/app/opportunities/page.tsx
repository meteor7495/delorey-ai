'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastFromError, toastSuccess } from '@/lib/notify';

type Opp = {
  id: string;
  type: string;
  estimatedValue: string | number;
  currency: string;
  confidence: number;
  reason: string;
  recommendedAction: string;
  status: string;
};

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opp[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    const rows = (await api.listOpportunities('open')) as Opp[];
    setItems(rows);
  }

  useEffect(() => {
    void load().catch(console.error);
  }, []);

  async function execute(id: string) {
    setBusy(true);
    try {
      await api.executeOpportunity(id);
      toastSuccess('اقدام ثبت شد');
      await load();
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="فرصت‌های درآمد"
          description="برآوردها با برچسب estimate از داده واقعی محاسبه می‌شوند"
        />
        <div className="space-y-3">
          {items.map((o) => (
            <Card key={o.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{o.reason}</p>
                  <p className="text-sm text-[var(--text-3)]">
                    {o.type} · برآورد:{' '}
                    {Number(o.estimatedValue).toLocaleString('fa-IR')}{' '}
                    {o.currency} · اطمینان:{' '}
                    {(o.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <Button disabled={busy} onClick={() => void execute(o.id)}>
                  بسپار به AI
                </Button>
              </CardContent>
            </Card>
          ))}
          {!items.length ? (
            <p className="text-sm text-[var(--text-3)]">فرصت بازی نیست.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
