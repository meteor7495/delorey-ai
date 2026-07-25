'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { AiStateChip } from '@delorey/ui';
import { api, getToken, setToken } from '@/shared/api';

const links = [
  { href: '/home', label: 'خانه' },
  { href: '/onboarding', label: 'شروع کار' },
  { href: '/store', label: 'فروشگاه' },
  { href: '/employee', label: 'کارمند فروش' },
  { href: '/channels', label: 'کانال‌ها' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState('inactive');
  const [tenantName, setTenantName] = useState('Workspace');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api
      .workspaceMe()
      .then((me) => {
        setStatus(String(me.employeeStatus ?? 'inactive'));
        const tenant = me.tenant as { name?: string } | undefined;
        if (tenant?.name) setTenantName(tenant.name);
      })
      .catch(() => {
        setToken(null);
        router.replace('/login');
      });
  }, [router, pathname]);

  return (
    <div className="shell">
      <aside className="nav">
        <div style={{ fontWeight: 700, marginBottom: 8 }}>DeloRey</div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
          {tenantName}
        </div>
        <AiStateChip state={status} />
        <div style={{ height: 8 }} />
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <button
          className="btn secondary"
          style={{ marginTop: 'auto' }}
          type="button"
          onClick={() => {
            setToken(null);
            router.push('/login');
          }}
        >
          خروج
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
