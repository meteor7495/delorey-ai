'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopbarProps {
  title: string;
  tenantName?: string;
}

export function Topbar({ title, tenantName }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  const initials = (tenantName ?? 'د')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <header
      className="sticky top-0 z-30 h-16 shrink-0 flex items-center gap-3.5 px-4 sm:px-6 border-b border-[var(--border-color)] backdrop-saturate-[180%] backdrop-blur-xl"
      style={{ background: 'color-mix(in srgb, var(--bg) 80%, transparent)' }}
    >
      <div className="flex-1">
        <h1 className="text-[19px] font-extrabold tracking-tight text-[var(--text-1)] lg:text-[17px]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="حالت روشن/تاریک"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <div className="hidden sm:flex items-center gap-2 ms-1">
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(145deg, #2A8A8A, #0f6e6e)' }}
          >
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-bold text-[var(--text-1)]">
              {tenantName ?? 'فضای کاری'}
            </div>
            <div className="text-[11px] text-[var(--text-3)]">مدیر</div>
          </div>
        </div>
      </div>
    </header>
  );
}
