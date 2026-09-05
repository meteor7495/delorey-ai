'use client';

import { toastFromError } from '@/lib/notify';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Percent,
  RefreshCw,
  ShoppingBag,
  BookOpen,
  Wallet,
} from 'lucide-react';
import {
  channelLabel,
  decisionLabel,
  escalationLabel,
  skillLabel,
  syncHealthLabel,
} from '@seloma/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatToman } from '@/lib/money';

type Summary = Awaited<ReturnType<typeof api.analyticsSummary>>;
type Gaps = Awaited<ReturnType<typeof api.analyticsKnowledgeGaps>>;
type Revenue = Awaited<ReturnType<typeof api.analyticsRevenue>>;
type WalletDto = Awaited<ReturnType<typeof api.billingWallet>>;

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: currency === 'IRR' ? 'IRR' : currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('fa-IR')} ${currency}`;
  }
}

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [gaps, setGaps] = useState<Gaps | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [wallet, setWallet] = useState<WalletDto | null>(null);

  useEffect(() => {
    Promise.all([
      api.analyticsSummary(days),
      api.analyticsKnowledgeGaps(days),
      api.analyticsRevenue(days),
      api.billingWallet().catch(() => null),
    ])
      .then(([s, g, r, w]) => {
        setSummary(s);
        setGaps(g);
        setRevenue(r);
        setWallet(w);
      })
      .catch((e) => toastFromError(e));
  }, [days]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="پیشخوان"
          description="نتایج واقعی از گفتگو و ممیزی — بدون امتیاز وانیته"
          actions={
            <div className="flex gap-1.5">
              {[7, 14, 30].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={days === d ? 'default' : 'outline'}
                  onClick={() => setDays(d)}
                >
                  {d} روز
                </Button>
              ))}
            </div>
          }
        />

        {wallet && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>اعتبار سلومـا</CardTitle>
              <Button size="sm" asChild>
                <Link href="/billing">شارژ کیف پول</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <StatCard
                title="موجودی"
                value={formatToman(wallet.available)}
                icon={Wallet}
              />
              <StatCard
                title="مصرف این ماه"
                value={formatToman(wallet.monthUsage)}
                icon={Wallet}
              />
              <StatCard
                title="باقی‌مانده تخمینی"
                value={formatToman(wallet.estimatedRemaining)}
                description={
                  wallet.autoRecharge.enabled ? 'شارژ خودکار روشن است' : undefined
                }
                icon={Wallet}
              />
            </CardContent>
          </Card>
        )}

        {revenue && (
          <div className="grid gap-3 kpi-grid-responsive">
            <StatCard
              title="حجم فروش"
              value={formatMoney(revenue.store.gmv, revenue.store.currency)}
              description={revenue.store.note}
              icon={ShoppingBag}
            />
            <StatCard
              title="سفارش فروشگاه"
              value={revenue.store.orderCount}
              icon={ShoppingBag}
            />
            <StatCard
              title={skillLabel('recommend')}
              value={revenue.skills.recommendVolume}
              icon={MessageSquare}
            />
            <StatCard
              title="گفتگوی کمکی"
              value={revenue.skills.assistedConversations}
              description={revenue.methodology.assisted}
              icon={Percent}
            />
          </div>
        )}

        {revenue && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['website', 'وب'],
                ['telegram', 'تلگرام'],
                ['bale', 'بله'],
                ['instagram', 'اینستاگرام'],
              ] as const
            ).map(([key, label]) => {
              const row = revenue.channels[key];
              return (
                <StatCard
                  key={key}
                  title={`فروش ${label}`}
                  value={formatMoney(row.gmv, revenue.store.currency)}
                  description={`${row.orderCount} سفارش`}
                  icon={ShoppingBag}
                />
              );
            })}
          </div>
        )}

        {revenue && (
          <p className="text-xs text-[var(--text-3)]">
            مصرف (تقریبی): {revenue.usage.auditTurnCount} نوبت — {revenue.usage.note}
            {!revenue.claims.causalLiftShown && (
              <> · {revenue.methodology.noCausalLift}</>
            )}
          </p>
        )}

        {summary?.empty && (
          <Card>
            <CardContent className="p-2">
              <EmptyState
                icon={MessageSquare}
                title="هنوز داده‌ای نیست"
                description="در این بازه داده‌ای نیست — از ویجت یا کانال‌ها گفتگو بسازید. داده جعلی نشان نمی‌دهیم."
                action={
                  <Button variant="outline" asChild>
                    <Link href="/channels">کانال‌ها</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        )}

        {summary && !summary.empty && (
          <div className="grid gap-4 dash-grid-responsive">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">گفتگوها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--text-2)]">
                  کل: <strong className="tnum">{summary.conversations.total}</strong>
                  {' · '}
                  در انتظار انسان:{' '}
                  <strong className="tnum">{summary.conversations.humanOwnedOpen}</strong>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(summary.conversations.byChannel).map(([ch, n]) => (
                    <Badge key={ch} variant="secondary">
                      {channelLabel(ch)}: {n}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-3)]">
                  {summary.methodology.escalationRate}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/inbox">رفتن به صندوق ورودی</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">وضوحیت و ارجاع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--text-2)]">
                  وضوحیت:{' '}
                  <strong>
                    {summary.rates.resolutionProxy == null
                      ? '—'
                      : `${Math.round(summary.rates.resolutionProxy * 100)}%`}
                  </strong>
                  {' · '}
                  ارجاع:{' '}
                  <strong>
                    {summary.rates.escalationRate == null
                      ? '—'
                      : `${Math.round(summary.rates.escalationRate * 100)}%`}
                  </strong>
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  {summary.methodology.resolutionProxy}
                </p>
                <ul className="space-y-1 text-sm text-[var(--text-2)]">
                  {Object.keys(summary.escalationReasons).length === 0 && (
                    <li className="text-[var(--text-3)]">موردی نیست</li>
                  )}
                  {Object.entries(summary.escalationReasons).map(([r, n]) => (
                    <li key={r}>
                      {escalationLabel(r)}: {n}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">اقدامات کمکی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold tnum text-[var(--text-1)]">
                  {summary.audits.assistedActions}
                </p>
                <p className="text-xs text-[var(--text-3)]">
                  {summary.methodology.assistedActions}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">سلامت همگام‌سازی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-[var(--brand-500)]" />
                  <strong>{syncHealthLabel(String(summary.syncHealth))}</strong>
                </div>
                <p className="text-xs text-[var(--text-3)]">
                  آخرین همگام‌سازی: {summary.syncLastAt ?? '—'}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/shop">فروشگاه</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {gaps && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4" />
                شکاف‌های دانش
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[var(--text-3)]">{gaps.note}</p>
              {gaps.empty ? (
                <p className="text-sm text-[var(--text-3)]">
                  شکاف ثبت‌شده‌ای در این بازه نیست.
                </p>
              ) : (
                <ul className="space-y-2 text-sm text-[var(--text-2)]">
                  {gaps.topics.map((t, i) => (
                    <li
                      key={`${t.conversationId}-${i}`}
                      className="rounded-lg border border-[var(--border-color)] bg-[var(--surface-2)] px-3 py-2"
                    >
                      {decisionLabel(t.decision)} — {t.text}
                    </li>
                  ))}
                </ul>
              )}
              <Button size="sm" asChild>
                <Link href="/knowledge">ویرایش دانش</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
