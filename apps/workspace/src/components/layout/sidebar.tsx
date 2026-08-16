'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  LayoutDashboard,
  ListChecks,
  Store,
  Bot,
  Radio,
  Inbox,
  BookOpen,
  ShieldCheck,
  LogOut,
  Sparkles,
  ShoppingBag,
  Package,
  Tags,
  ClipboardList,
  Palette,
  Settings,
  ChevronDown,
  SlidersHorizontal,
  Boxes,
  Percent,
  FileText,
} from 'lucide-react';
import { AiStateChip } from '@seloma/ui';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { setToken } from '@/shared/api';

type NavLeaf = { href: string; icon: typeof Home; label: string };

const primaryNav: NavLeaf[] = [
  { href: '/home', icon: Home, label: 'خانه' },
  { href: '/dashboard', icon: LayoutDashboard, label: 'داشبورد' },
  { href: '/onboarding', icon: ListChecks, label: 'شروع کار' },
];

const shopNav: NavLeaf[] = [
  { href: '/shop', icon: ShoppingBag, label: 'نمای کلی' },
  { href: '/shop/products', icon: Package, label: 'محصولات' },
  { href: '/shop/attributes', icon: SlidersHorizontal, label: 'ویژگی‌ها' },
  { href: '/shop/inventory', icon: Boxes, label: 'موجودی' },
  { href: '/shop/discounts', icon: Percent, label: 'تخفیف‌ها' },
  { href: '/shop/categories', icon: Tags, label: 'دسته‌ها' },
  { href: '/shop/articles', icon: FileText, label: 'مقالات' },
  { href: '/shop/orders', icon: ClipboardList, label: 'سفارش‌ها' },
  { href: '/channels', icon: Radio, label: 'کانال‌ها' },
  { href: '/shop/appearance', icon: Palette, label: 'ظاهر و بنر' },
  { href: '/shop/settings', icon: Settings, label: 'تنظیمات فروشگاه' },
];

const aiNav: NavLeaf[] = [
  { href: '/employee', icon: Bot, label: 'کارمند فروش' },
  { href: '/inbox', icon: Inbox, label: 'صندوق ورودی' },
  { href: '/knowledge', icon: BookOpen, label: 'دانش' },
  { href: '/audit', icon: ShieldCheck, label: 'ممیزی' },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/home' || href === '/dashboard' || href === '/shop') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavLeaf; pathname: string }) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'relative flex items-center gap-[11px] w-full px-3 py-[9px] rounded-[9px] text-[13.5px] font-semibold transition-all duration-150 no-underline',
        active
          ? 'bg-[rgba(15,110,110,0.28)] text-white'
          : 'bg-transparent text-[#94A3B8] hover:bg-[rgba(255,255,255,0.05)] hover:text-white',
      )}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.9} />
      <span className="flex-1 text-start">{item.label}</span>
      {active && (
        <span className="absolute start-[-10px] top-1/2 -translate-y-1/2 w-[3px] h-[18px] bg-[var(--brand-400)] rounded-full" />
      )}
    </Link>
  );
}

interface SidebarProps {
  tenantName: string;
  employeeStatus: string;
}

export function Sidebar({ tenantName, employeeStatus }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const aiOpenDefault = aiNav.some((i) => isActivePath(pathname, i.href));
  const [aiOpen, setAiOpen] = useState(aiOpenDefault);

  function handleLogout() {
    setToken(null);
    router.push('/login');
  }

  return (
    <aside
      className="hidden lg:flex w-[264px] shrink-0 flex-col sticky top-0 h-screen z-50 border-e border-[rgba(255,255,255,0.07)]"
      style={{ background: 'linear-gradient(180deg, #0E1729 0%, #0A101D 100%)' }}
    >
      <div className="px-[18px] pt-[18px] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0 shadow-[0_4px_12px_rgba(15,110,110,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]"
            style={{ background: 'linear-gradient(145deg, #2A8A8A, #0f6e6e)' }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-[17px] tracking-tight text-white">
              سِلوما
            </div>
            <div className="text-[9.5px] tracking-[0.18em] text-white/45 font-semibold">
              COMMERCE
            </div>
          </div>
        </div>
      </div>

      <div className="px-3.5 pb-3.5">
        <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[11px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)]">
          <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.07)] grid place-items-center shrink-0">
            <Store size={16} color="#5BA8A8" />
          </div>
          <div className="text-start flex-1 min-w-0">
            <div className="text-[13px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {tenantName}
            </div>
            <div className="text-[10.5px] text-white/40">فضای کاری فروش</div>
          </div>
        </div>
        <div className="mt-2.5 px-1">
          <AiStateChip state={employeeStatus} />
        </div>
      </div>

      <nav className="px-2.5 flex flex-col gap-0.5 flex-1 overflow-y-auto pb-3">
        <div className="text-[10.5px] font-bold tracking-[0.1em] text-white/30 px-[12px] pb-2 pt-1.5 uppercase">
          منوی اصلی
        </div>
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="text-[10.5px] font-bold tracking-[0.1em] text-white/30 px-[12px] pb-2 pt-4 uppercase">
          فروشگاه
        </div>
        {shopNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <div className="pt-4">
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="flex w-full items-center gap-2 px-[12px] pb-2 text-[10.5px] font-bold tracking-[0.1em] text-white/30 uppercase hover:text-white/50"
          >
            <span className="flex-1 text-start">کارمند هوش مصنوعی</span>
            <ChevronDown
              size={14}
              className={cn('transition-transform', aiOpen && 'rotate-180')}
            />
          </button>
          {aiOpen &&
            aiNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
        </div>
      </nav>

      <div className="p-2.5 border-t border-[rgba(255,255,255,0.07)]">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="flex items-center gap-[11px] w-full px-3 py-[9px] h-auto rounded-[9px] text-[#64748B] text-[13.5px] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#94A3B8] justify-start"
        >
          <LogOut size={18} strokeWidth={1.9} />
          <span className="flex-1 text-start">خروج</span>
        </Button>
      </div>
    </aside>
  );
}
