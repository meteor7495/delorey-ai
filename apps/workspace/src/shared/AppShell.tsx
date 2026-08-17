'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { api, getToken, setToken } from '@/shared/api';

const titleMap: Record<string, string> = {
  '/home': 'خانه',
  '/dashboard': 'داشبورد',
  '/onboarding': 'شروع کار',
  '/shop/products': 'محصولات',
  '/shop/attributes': 'ویژگی‌ها',
  '/shop/inventory': 'موجودی',
  '/shop/discounts': 'تخفیف‌ها',
  '/shop/articles': 'مقالات',
  '/shop/categories': 'دسته‌ها',
  '/shop/orders': 'سفارش‌ها',
  '/shop/customers': 'مشتری‌ها',
  '/shop/appearance': 'ظاهر و بنر',
  '/shop/settings': 'تنظیمات فروشگاه',
  '/shop': 'فروشگاه بومی',
  '/employee': 'کارمند فروش',
  '/channels': 'کانال‌ها',
  '/inbox': 'صندوق ورودی',
  '/knowledge': 'دانش',
  '/audit': 'ممیزی',
};

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('inactive');
  const [tenantName, setTenantName] = useState('فضای کاری');

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
        setReady(true);
      })
      .catch(() => {
        setToken(null);
        router.replace('/login');
      });
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[var(--bg)] text-[var(--text-3)] text-sm">
        در حال بارگذاری…
      </div>
    );
  }

  const title =
    Object.entries(titleMap).find(([path]) =>
      path === '/home' || path === '/dashboard'
        ? pathname === path
        : pathname === path || pathname.startsWith(`${path}/`),
    )?.[1] ?? 'فضای کاری';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg)] app-shell">
      <Sidebar tenantName={tenantName} employeeStatus={status} />

      <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <Topbar title={title} tenantName={tenantName} />
        <div className="flex-1 overflow-y-auto bg-[var(--bg)] overscroll-contain mobile-content-pad pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="mx-auto w-full max-w-[1100px] p-4 sm:p-6 fade-up">
            {children}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
