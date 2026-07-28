'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function OnboardingPage() {
  const [steps, setSteps] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    api.workspaceMe().then((me) => {
      setSteps((me.onboarding as Record<string, boolean>) ?? null);
    });
  }, []);

  const items = [
    { key: 'storeConnected', label: 'اتصال فروشگاه', href: '/store' },
    { key: 'syncHealthy', label: 'همگام‌سازی سالم', href: '/store' },
    { key: 'employeeConfigured', label: 'پیکربندی کارمند', href: '/employee' },
    { key: 'channelConnected', label: 'اتصال کانال وب', href: '/channels' },
  ];

  const doneCount = items.filter((i) => Boolean(steps?.[i.key])).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="شروع کار"
          description="مسیر تا اولین گفتگوی grounded"
          actions={
            <Badge variant="secondary">
              {doneCount} از {items.length}
            </Badge>
          }
        />

        <Card>
          <CardContent className="divide-y divide-[var(--border-color)] p-0">
            {items.map((item) => {
              const done = Boolean(steps?.[item.key]);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-[var(--text-4)]" />
                    )}
                    <span
                      className={
                        done
                          ? 'font-medium text-[var(--text-2)]'
                          : 'font-semibold text-[var(--text-1)]'
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                  <Button variant={done ? 'outline' : 'default'} size="sm" asChild>
                    <Link href={item.href}>{done ? 'مشاهده' : 'انجام'}</Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
