'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
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
      <div className="space-y-6">
        <PageHeader
          title="یکپارچه‌سازی / MCP"
          description="کلاینت‌ها و overrides ابزار — بازارچه کامل در فازهای بعدی"
        />
        <Card>
          <CardHeader>
            <CardTitle>کلاینت‌های MCP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.clients ?? []).map((c) => (
              <div
                key={String(c.id)}
                className="flex justify-between text-sm"
              >
                <span>{String(c.name)}</span>
                <span className="text-[var(--text-3)]">
                  {String(c.kind)} · {String(c.status)}
                </span>
              </div>
            ))}
            {!data?.clients?.length ? (
              <p className="text-sm text-[var(--text-3)]">
                هنوز کلاینت خارجی ثبت نشده. ابزارهای داخلی Runtime در دسترس‌اند.
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tool overrides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.toolOverrides ?? []).map((t) => (
              <div
                key={String(t.id)}
                className="flex justify-between text-sm"
              >
                <span>{String(t.toolName)}</span>
                <span className="text-[var(--text-3)]">
                  {t.enabled ? 'enabled' : 'disabled'} ·{' '}
                  {String(t.approvalPolicy ?? 'default')}
                </span>
              </div>
            ))}
            {!data?.toolOverrides?.length ? (
              <p className="text-sm text-[var(--text-3)]">بدون override.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
