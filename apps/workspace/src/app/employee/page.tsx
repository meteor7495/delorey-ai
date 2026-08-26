'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/shared/AppShell';

/** Legacy route — Sales employee now lives under /employees/sales */
export default function EmployeePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/employees/sales');
  }, [router]);
  return (
    <AppShell>
      <p className="text-sm text-[var(--text-3)]">در حال انتقال…</p>
    </AppShell>
  );
}
