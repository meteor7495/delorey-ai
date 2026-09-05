'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ITEMS: Array<{
  key: string;
  label: string;
  hint: string;
  href: string;
}> = [
  {
    key: 'catalogReady',
    label: 'کاتالوگ فروشگاه بومی',
    hint: 'حداقل یک محصول منتشرشده',
    href: '/shop/products',
  },
  {
    key: 'channelConnected',
    label: 'اتصال تلگرام، بله یا اینستاگرام',
    hint: 'سفارش از همان کانال ثبت می‌شود',
    href: '/channels',
  },
  {
    key: 'firstOrderDone',
    label: 'اولین سفارش ویترین',
    hint: 'وب یا کانال',
    href: '/shop/orders',
  },
  {
    key: 'employeeConfigured',
    label: 'دستیار هوشمند فعال (اختیاری)',
    hint: 'پاسخ گفتگو روی همان کاتالوگ',
    href: '/employee',
  },
];

const PROMPTS = [
  'پیراهن لینن موجوده؟ قیمتش چنده؟',
  'هزینه ارسال به تهران چقدره؟',
  'وضعیت سفارش DR-1001 با موبایل 0912…1234',
  'یه هدیه زیر ۲۰۰ هزار پیشنهاد بده',
  'می‌خوام با انسان / اپراتور حرف بزنم',
];

export default function OnboardingPage() {
  const [steps, setSteps] = useState<Record<string, boolean> | null>(null);
  const [partnerReady, setPartnerReady] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [aiEmployeeEntitled, setAiEmployeeEntitled] = useState(false);

  useEffect(() => {
    Promise.all([api.workspaceMe(), api.getWebsiteChannel().catch(() => null)])
      .then(([me, ch]) => {
        setSteps((me.onboarding as Record<string, boolean>) ?? null);
        setPartnerReady(Boolean(me.partnerReady));
        setAiEmployeeEntitled(Boolean(me.aiEmployeeEntitled));
        setPublicKey(ch?.publicKey ?? null);
      })
      .catch(console.error);
  }, []);

  const visibleItems = ITEMS.filter(
    (i) => i.key !== 'employeeConfigured' || aiEmployeeEntitled,
  );
  const doneCount = visibleItems.filter((i) => Boolean(steps?.[i.key])).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="شروع کار"
          description="فروشگاه خودتان را بسازید، کانال‌ها را وصل کنید، اولین سفارش را ببینید"
          actions={
            <Badge variant={partnerReady ? 'default' : 'secondary'}>
              {partnerReady
                ? 'مسیر اصلی آماده'
                : `${doneCount} از ${visibleItems.length}`}
            </Badge>
          }
        />

        <Card>
          <CardContent className="divide-y divide-[var(--border-color)] p-0">
            {visibleItems.map((item) => {
              const done = Boolean(steps?.[item.key]);
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--success)]" />
                    ) : (
                      <Circle className="h-5 w-5 shrink-0 text-[var(--text-4)]" />
                    )}
                    <div>
                      <p
                        className={
                          done
                            ? 'font-medium text-[var(--text-2)]'
                            : 'font-semibold text-[var(--text-1)]'
                        }
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-[var(--text-3)]">{item.hint}</p>
                    </div>
                  </div>
                  <Button
                    variant={done ? 'outline' : 'default'}
                    size="sm"
                    asChild
                  >
                    <Link href={item.href}>{done ? 'مشاهده' : 'انجام'}</Link>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">نمونه سؤالات آزمایشی</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {publicKey && (
              <p className="text-sm text-[var(--text-3)]">
                کلید عمومی:{' '}
                <code dir="ltr" className="text-[var(--text-2)]">
                  {publicKey}
                </code>
                {' · '}
                <a
                  className="text-[var(--accent)] underline"
                  href="http://localhost:5173"
                  target="_blank"
                  rel="noreferrer"
                >
                  باز کردن پیش‌نمایش ویجت
                </a>
              </p>
            )}
            <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-2)]">
              {PROMPTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="text-xs text-[var(--text-3)]">
              این سؤالات را در ویجت گفتگو امتحان کنید تا پاسخ دستیار را ببینید.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
