'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  employeeStatusLabel,
  operatingModeLabel,
} from '@seloma/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { RequireAiEmployee } from '@/components/shared/require-ai-employee';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toastFromError, toastSuccess } from '@/lib/notify';

type AttentionItem = {
  code: string;
  title: string;
  count: number;
  href: string;
  actionHint?: string;
  executableAction?: string | null;
};

type OpportunitySummary = {
  count: number;
  estimatedTotal: number;
  currency: string;
  estimateLabel: string;
  byType: Record<string, number>;
  items: Array<{
    id: string;
    type: string;
    estimatedValue: number;
    reason: string;
    recommendedAction: string;
  }>;
};

export default function HomePage() {
  return (
    <AppShell>
      <RequireAiEmployee
        title="پیشخوان فروش"
        description="با فعال‌سازی دستیار هوشمند در دسترس است"
      >
        <HomeContent />
      </RequireAiEmployee>
    </AppShell>
  );
}

function HomeContent() {
  const [cc, setCc] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const data = await api.getCommandCenter();
      setCc(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const attention = (cc?.attention as AttentionItem[] | undefined) ?? [];
  const opportunities = cc?.opportunities as OpportunitySummary | undefined;
  const employees =
    (cc?.employees as Array<{
      role: string;
      name: string;
      status: string;
      operatingMode: string;
    }>) ?? [];
  const recentActivity =
    (cc?.recentActivity as Array<{
      id: string;
      action: string;
      result: string;
      createdAt: string;
    }>) ?? [];

  async function runRecover() {
    setBusy(true);
    try {
      await api.recoverAbandonedCarts();
      toastSuccess('بازیابی سبدها در صف قرار گرفت');
      await load();
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  async function runOpportunity(id: string) {
    setBusy(true);
    try {
      await api.executeOpportunity(id);
      toastSuccess('اقدام دستیار ثبت شد');
      await load();
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="پیشخوان فروش"
        description="چه چیزی نیاز به توجه دارد و دستیارهای شما چه می‌کنند؟"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="موارد فوری"
          value={String(attention.length)}
          icon={AlertTriangle}
        />
        <StatCard
          title="فرصت‌های درآمد"
          value={String(opportunities?.count ?? 0)}
          icon={Sparkles}
        />
        <StatCard
          title="کارهای انجام‌شده"
          value={String(cc?.aiTasksCompleted ?? 0)}
          icon={Bot}
        />
        <StatCard
          title="برآورد فرصت (تومان)"
          value={Number(opportunities?.estimatedTotal ?? 0).toLocaleString(
            'fa-IR',
          )}
          icon={TrendingUp}
        />
      </div>

      {attention.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-[var(--text-1)]">توجه</h2>
          {attention.map((item) => (
            <Card
              key={item.code}
              className="border-[var(--warning)]/30 bg-[var(--warning-bg)]"
            >
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-[var(--text-1)]">{item.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-3)]">
                    {item.actionHint}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.executableAction === 'recover_abandoned_carts' ? (
                    <Button disabled={busy} onClick={() => void runRecover()}>
                      واگذار به دستیار
                    </Button>
                  ) : null}
                  <Button variant="outline" asChild>
                    <Link href={item.href}>مشاهده</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-[var(--text-2)]">
            مورد فوری نیست. فرصت‌ها و دستیارهای هوشمند را بررسی کنید.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">فرصت‌های درآمد</CardTitle>
            <p className="text-xs text-[var(--text-3)]">
              مقادیر برآوردی هستند و تضمین درآمد نیستند
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(opportunities?.items ?? []).slice(0, 5).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold">{o.reason}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    برآورد:{' '}
                    {Number(o.estimatedValue).toLocaleString('fa-IR')} تومان
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() => void runOpportunity(o.id)}
                >
                  واگذار به دستیار
                </Button>
              </div>
            ))}
            <Button variant="outline" asChild className="w-full">
              <Link href="/opportunities">همه فرصت‌ها</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">دستیارهای هوشمند</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {employees.map((e) => (
              <Link
                key={e.role}
                href={`/employees/${e.role}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 no-underline hover:bg-[var(--surface-2)]"
              >
                <span className="text-sm font-semibold text-[var(--text-1)]">
                  {e.name}
                </span>
                <span className="text-xs text-[var(--text-3)]">
                  {employeeStatusLabel(e.status)} ·{' '}
                  {operatingModeLabel(e.operatingMode)}
                </span>
              </Link>
            ))}
            <Button variant="outline" asChild className="mt-2 w-full">
              <Link href="/employees">مدیریت دستیارها</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">فعالیت اخیر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentActivity.slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="flex justify-between gap-2 text-sm text-[var(--text-2)]"
            >
              <span>{a.action}</span>
              <span className="text-xs text-[var(--text-3)]">
                {a.result} ·{' '}
                {new Date(a.createdAt).toLocaleTimeString('fa-IR')}
              </span>
            </div>
          ))}
          {!recentActivity.length ? (
            <p className="text-sm text-[var(--text-3)]">هنوز فعالیتی نیست.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
