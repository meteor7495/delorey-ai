'use client';

import { useEffect, useState } from 'react';
import {
  approvalPolicyLabel,
  integrationStatusLabel,
  toolOverrideStateLabel,
} from '@seloma/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { RequireAiEmployee } from '@/components/shared/require-ai-employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IntegrationsPage() {
  const [data, setData] = useState<{
    clients: Array<Record<string, unknown>>;
    toolOverrides: Array<Record<string, unknown>>;
  } | null>(null);

  useEffect(() => {
    api
      .listIntegrations()
      .then((d) =>
        setData({
          clients: d.clients as Array<Record<string, unknown>>,
          toolOverrides: d.toolOverrides as Array<Record<string, unknown>>,
        }),
      )
      .catch(console.error);
  }, []);

  return (
    <AppShell>
      <RequireAiEmployee
        title="اتصال سرویس"
        description="سرویس‌های متصل و تنظیمات دسترسی دستیار"
      >
      <div className="space-y-6">
        <PageHeader
          title="اتصال سرویس"
          description="سرویس‌های متصل و تنظیمات دسترسی دستیار"
        />
        <Card>
          <CardHeader>
            <CardTitle>سرویس‌های متصل</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.clients ?? []).map((c) => (
              <div
                key={String(c.id)}
                className="flex justify-between text-sm"
              >
                <span>{String(c.name)}</span>
                <span className="text-[var(--text-3)]">
                  {String(c.kind)} · {integrationStatusLabel(String(c.status))}
                </span>
              </div>
            ))}
            {!data?.clients?.length ? (
              <p className="text-sm text-[var(--text-3)]">
                هنوز سرویس خارجی متصل نشده. ابزارهای پیش‌فرض فروشگاه در دسترس‌اند.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات دسترسی ابزارها</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.toolOverrides ?? []).map((t) => (
              <div
                key={String(t.id)}
                className="flex justify-between text-sm"
              >
                <span>{String(t.toolName)}</span>
                <span className="text-[var(--text-3)]">
                  {toolOverrideStateLabel(Boolean(t.enabled))} ·{' '}
                  {approvalPolicyLabel(String(t.approvalPolicy ?? 'default'))}
                </span>
              </div>
            ))}
            {!data?.toolOverrides?.length ? (
              <p className="text-sm text-[var(--text-3)]">
                تنظیم سفارشی ثبت نشده — همه ابزارها با پیش‌فرض کار می‌کنند.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      </RequireAiEmployee>
    </AppShell>
  );
}
