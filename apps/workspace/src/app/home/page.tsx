'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Package, Radio, RefreshCw } from 'lucide-react';
import { channelStatusLabel, syncHealthLabel } from '@seloma/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const [me, setMe] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.workspaceMe().then(setMe).catch(console.error);
  }, []);

  const attention = me?.primaryAttention as
    | { title: string; href: string }
    | null
    | undefined;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="خانه"
          description="چه چیزی نیاز به توجه دارد؟"
        />

        {attention ? (
          <Card className="border-[var(--warning)]/30 bg-[var(--warning-bg)]">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--warning)]/15">
                  <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-1)]">{attention.title}</p>
                  <p className="mt-0.5 text-sm text-[var(--text-3)]">
                    برای ادامه، اقدام زیر را انجام دهید
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href={attention.href}>ادامه</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-4 p-5">
              <p className="text-sm text-[var(--text-2)]">
                مورد فوری نیست. می‌توانید داشبورد یا گفتگوی آزمایشی را بررسی کنید.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/channels">کانال وبسایت</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/onboarding">مسیر design partner</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {me && (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              title="همگام‌سازی"
              value={syncHealthLabel(String(me.syncHealth))}
              icon={RefreshCw}
            />
            <StatCard
              title="محصولات"
              value={String(me.productCount ?? 0)}
              icon={Package}
            />
            <StatCard
              title="کانال وب"
              value={channelStatusLabel(String(me.websiteChannelStatus))}
              icon={Radio}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
