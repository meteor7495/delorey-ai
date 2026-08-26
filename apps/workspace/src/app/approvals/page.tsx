'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastFromError, toastSuccess } from '@/lib/notify';

type Approval = {
  id: string;
  title: string;
  description?: string | null;
  kind: string;
  riskLevel?: string | null;
  status: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);

  async function load() {
    const rows = (await api.listAiApprovals('pending')) as Approval[];
    setItems(rows);
  }

  useEffect(() => {
    void load().catch(console.error);
  }, []);

  async function decide(id: string, decision: 'approved' | 'rejected') {
    try {
      await api.decideAiApproval(id, decision);
      toastSuccess(decision === 'approved' ? 'تأیید شد' : 'رد شد');
      await load();
    } catch (e) {
      toastFromError(e);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="تأییدهای AI"
          description="اقدامات پرریسک در انتظار تصمیم شما"
        />
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 p-5">
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-sm text-[var(--text-3)]">
                    {a.kind} · {a.riskLevel ?? '—'} ·{' '}
                    {new Date(a.createdAt).toLocaleString('fa-IR')}
                  </p>
                  {a.description ? (
                    <p className="mt-2 text-sm text-[var(--text-2)]">
                      {a.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void decide(a.id, 'approved')}>
                    تأیید
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void decide(a.id, 'rejected')}
                  >
                    رد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!items.length ? (
            <p className="text-sm text-[var(--text-3)]">تأییدی در صف نیست.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
