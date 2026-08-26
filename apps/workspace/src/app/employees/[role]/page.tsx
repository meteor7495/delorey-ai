'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toastFromError, toastSuccess } from '@/lib/notify';

export default function EmployeeDetailPage() {
  const params = useParams();
  const role = String(params.role ?? 'sales');
  const [employee, setEmployee] = useState<Record<string, unknown> | null>(
    null,
  );
  const [activity, setActivity] = useState<{
    events: unknown[];
    performance: Record<string, unknown>;
  } | null>(null);
  const [mode, setMode] = useState('copilot');
  const [status, setStatus] = useState('active');

  async function load() {
    const [emp, act] = await Promise.all([
      api.getEmployeeByRole(role),
      api.getEmployeeActivity(role),
    ]);
    setEmployee(emp);
    setMode(String(emp.operatingMode ?? 'copilot'));
    setStatus(String(emp.status ?? 'inactive'));
    setActivity({
      events: act.events,
      performance: act.performance,
    });
  }

  useEffect(() => {
    void load().catch(console.error);
  }, [role]);

  async function save() {
    try {
      await api.updateEmployeeByRole(role, {
        operatingMode: mode,
        status,
      });
      toastSuccess('ذخیره شد');
      await load();
    } catch (e) {
      toastFromError(e);
    }
  }

  const permissions = (employee?.permissions as string[]) ?? [];
  const goals = (employee?.goals as string[]) ?? [];
  const perf = activity?.performance ?? {};

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title={String(employee?.name ?? 'کارمند AI')}
          description={`نقش: ${role}`}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>پیکربندی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm">
                وضعیت
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="inactive">inactive</option>
                </select>
              </label>
              <label className="block text-sm">
                حالت عملیاتی
                <select
                  className="mt-1 w-full rounded-md border px-3 py-2"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="copilot">copilot</option>
                  <option value="assistant">assistant</option>
                  <option value="autopilot">autopilot</option>
                </select>
              </label>
              <p className="text-xs text-[var(--text-3)]">
                {String(employee?.instructions ?? '')}
              </p>
              <Button onClick={() => void save()}>ذخیره</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>عملکرد (۳۰ روز)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>موفق: {String(perf.successfulActions ?? 0)}</p>
              <p>ناموفق: {String(perf.failedActions ?? 0)}</p>
              <p>در انتظار تأیید: {String(perf.pendingApprovals ?? 0)}</p>
              <p>
                نرخ اتوماسیون:{' '}
                {Number(perf.automationRate ?? 0).toLocaleString('fa-IR', {
                  style: 'percent',
                  maximumFractionDigits: 0,
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>مجوزها و اهداف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {permissions.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-[var(--surface-2)] px-2 py-1 text-xs"
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {goals.map((g) => (
                <span
                  key={g}
                  className="rounded-md border px-2 py-1 text-xs text-[var(--text-2)]"
                >
                  {g}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>فعالیت اخیر</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {((activity?.events as Array<Record<string, unknown>>) ?? [])
              .slice(0, 15)
              .map((ev) => (
                <div
                  key={String(ev.id)}
                  className="flex justify-between text-sm text-[var(--text-2)]"
                >
                  <span>{String(ev.action)}</span>
                  <span className="text-xs">{String(ev.result)}</span>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
