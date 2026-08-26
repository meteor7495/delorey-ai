'use client';

import type { ReactNode } from 'react';
import { useWorkspaceEntitlements } from '@/shared/AppShell';
import { PageHeader } from '@/components/shared/page-header';
import { AiEmployeeLocked } from '@/components/shared/ai-employee-locked';

export function RequireAiEmployee({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description?: string;
}) {
  const { aiEmployeeEntitled } = useWorkspaceEntitlements();
  if (!aiEmployeeEntitled) {
    return (
      <div className="space-y-6">
        <PageHeader title={title} description={description} />
        <AiEmployeeLocked />
      </div>
    );
  }
  return <>{children}</>;
}
