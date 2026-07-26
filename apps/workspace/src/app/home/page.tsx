'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { channelStatusLabel, syncHealthLabel } from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function HomePage() {
  const [me, setMe] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    api.workspaceMe().then(setMe).catch(console.error);
  }, []);

  const attention = me?.primaryAttention as
    | { title: string; href: string }
    | null
    | undefined;

  return (
    <AppShell>
      <h1>خانه</h1>
      <p className="muted">چه چیزی نیاز به توجه دارد؟</p>
      {attention ? (
        <div className="banner">
          <strong>{attention.title}</strong>
          <div style={{ marginTop: 8 }}>
            <Link className="btn" href={attention.href}>
              ادامه
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <p>مورد فوری نیست. می‌توانید داشبورد یا گفتگوی آزمایشی را بررسی کنید.</p>
          <div className="row">
            <Link className="btn" href="/channels">
              کانال وبسایت
            </Link>
            <Link className="btn secondary" href="/onboarding">
              چک‌لیست شروع
            </Link>
          </div>
        </div>
      )}
      {me && (
        <div className="card" style={{ marginTop: 16 }}>
          <p className="muted" style={{ margin: 0 }}>
            همگام‌سازی: {syncHealthLabel(String(me.syncHealth))} · محصولات:{' '}
            {String(me.productCount)} · کانال وب:{' '}
            {channelStatusLabel(String(me.websiteChannelStatus))}
          </p>
        </div>
      )}
    </AppShell>
  );
}
