'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Inbox,
  Store,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/home', icon: Home, label: 'خانه', exact: true },
  { href: '/dashboard', icon: LayoutDashboard, label: 'داشبورد' },
  { href: '/inbox', icon: Inbox, label: 'صندوق' },
  { href: '/store', icon: Store, label: 'فروشگاه' },
  { href: '/onboarding', icon: MoreHorizontal, label: 'بیشتر' },
];

const morePaths = [
  '/onboarding',
  '/employee',
  '/channels',
  '/knowledge',
  '/audit',
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border-color)] bg-[var(--surface)]/95 backdrop-blur-xl"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      aria-label="منوی موبایل"
    >
      <div className="grid grid-cols-5 h-[56px]">
        {tabs.map(({ href, icon: Icon, label, exact }) => {
          const active = exact
            ? pathname === href
            : href === '/onboarding'
              ? morePaths.some((p) => pathname.startsWith(p))
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold no-underline min-h-[44px]',
                active ? 'text-[var(--brand-500)]' : 'text-[var(--text-4)]',
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
