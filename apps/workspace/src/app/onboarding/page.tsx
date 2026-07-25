'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

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

  return (
    <AppShell>
      <h1>شروع کار</h1>
      <p className="muted">مسیر تا اولین گفتگوی grounded</p>
      <div className="card">
        {items.map((item) => {
          const done = Boolean(steps?.[item.key]);
          return (
            <div
              key={item.key}
              className="row"
              style={{
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>
                {done ? '✓' : '○'} {item.label}
              </span>
              <Link href={item.href}>{done ? 'مشاهده' : 'انجام'}</Link>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
