'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  employeeRoleLabel,
  employeeStatusLabel,
  operatingModeLabel,
} from '@seloma/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { RequireAiEmployee } from '@/components/shared/require-ai-employee';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmployeesPage() {
  return (
    <AppShell>
      <RequireAiEmployee
        title="دستیارهای هوشمند"
        description="دستیارهایی که بخشی از کارهای روزمره فروشگاه را انجام می‌دهند"
      >
        <EmployeesContent />
      </RequireAiEmployee>
    </AppShell>
  );
}

function EmployeesContent() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      role: string;
      name: string;
      status: string;
      operatingMode: string;
    }>
  >([]);

  useEffect(() => {
    api
      .listEmployees()
      .then(setItems)
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="دستیارهای هوشمند"
        description="دستیارهایی که بخشی از کارهای روزمره فروشگاه را انجام می‌دهند"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <Card key={e.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-1)]">{e.name}</h3>
                <span className="text-xs text-[var(--text-3)]">
                  {employeeRoleLabel(e.role)}
                </span>
              </div>
              <p className="text-sm text-[var(--text-2)]">
                وضعیت: {employeeStatusLabel(e.status)} · حالت:{' '}
                {operatingModeLabel(e.operatingMode)}
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/employees/${e.role}`}>جزئیات</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
