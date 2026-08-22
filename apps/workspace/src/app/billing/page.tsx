'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Wallet, Shield, Zap, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastFromError, toastSuccess } from '@/lib/notify';
import { formatToman } from '@/lib/money';

type WalletDto = Awaited<ReturnType<typeof api.billingWallet>>;

function BillingInner() {
  const params = useSearchParams();
  const [data, setData] = useState<WalletDto | null>(null);
  const [threshold, setThreshold] = useState('200000');
  const [recharge, setRecharge] = useState('1000000');
  const [monthlyMax, setMonthlyMax] = useState('3000000');
  const [spendLimit, setSpendLimit] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const w = await api.billingWallet();
      setData(w);
      setThreshold(String(w.autoRecharge.thresholdAmount));
      setRecharge(String(w.autoRecharge.rechargeAmount));
      setMonthlyMax(String(w.autoRecharge.monthlyLimit));
      setSpendLimit(
        w.spendingLimit.monthlyLimit != null
          ? String(w.spendingLimit.monthlyLimit)
          : '',
      );
    } catch (e) {
      toastFromError(e);
    }
  }

  useEffect(() => {
    void load();
    if (params.get('paid') === '1') toastSuccess('کیف پول شارژ شد');
    if (params.get('paid') === '0') toastFromError('پرداخت انجام نشد');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(packId: string) {
    setBusy(true);
    try {
      const res = await api.billingPurchase({
        packId,
        idempotencyKey: `ui-${packId}-${Date.now()}`,
      });
      if (res.alreadyPaid || res.status === 'paid') {
        toastSuccess('اعتبار اضافه شد');
        await load();
        return;
      }
      if (res.payUrl) window.location.href = res.payUrl;
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  async function saveAuto(enabled?: boolean) {
    setBusy(true);
    try {
      await api.billingPutAutoRecharge({
        enabled: enabled ?? data?.autoRecharge.enabled,
        thresholdAmount: Number(threshold),
        rechargeAmount: Number(recharge),
        monthlyLimit: Number(monthlyMax),
      });
      toastSuccess('شارژ خودکار ذخیره شد');
      await load();
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  async function saveLimit() {
    setBusy(true);
    try {
      await api.billingPutSpendingLimit({
        monthlyLimit: spendLimit.trim() ? Number(spendLimit) : null,
      });
      toastSuccess('سقف ماهانه ذخیره شد');
      await load();
    } catch (e) {
      toastFromError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="اعتبار سلومـا"
          description="فقط به اندازه‌ای که استفاده می‌کنید هزینه می‌پردازید — کنترل کامل هزینه با شماست."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/billing/usage">مصرف</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/billing/history">تاریخچه</Link>
              </Button>
              {data?.isPlatformAdmin && (
                <Button variant="outline" asChild>
                  <Link href="/billing/ops">عملیات پلتفرم</Link>
                </Button>
              )}
            </div>
          }
        />

        {(data?.lowBalance || data?.criticalBalance) && (
          <Card className="border-[var(--warning)]/30 bg-[var(--warning-bg)]">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
              <p className="text-sm font-medium">
                {data.criticalBalance
                  ? 'اعتبار شما تقریباً تمام شده است. لطفاً کیف پول را شارژ کنید.'
                  : 'اعتبار سلومـا شما رو به اتمام است.'}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="موجودی فعلی"
            value={data ? formatToman(data.available) : '…'}
            icon={Wallet}
          />
          <StatCard
            title="مصرف این ماه"
            value={data ? formatToman(data.monthUsage) : '…'}
            icon={Zap}
          />
          <StatCard
            title="سقف ماهانه"
            value={
              data?.spendingLimit.monthlyLimit != null
                ? formatToman(data.spendingLimit.monthlyLimit)
                : 'بدون سقف'
            }
            description={
              data?.spendingLimit.remaining != null
                ? `باقی‌مانده ${formatToman(data.spendingLimit.remaining)}`
                : undefined
            }
            icon={Shield}
          />
          <StatCard
            title="شارژ خودکار"
            value={data?.autoRecharge.enabled ? 'فعال' : 'خاموش'}
            description={
              data?.autoRecharge.enabled
                ? `زیر ${formatToman(data.autoRecharge.thresholdAmount)}`
                : 'برای جلوگیری از قطع مصرف روشن کنید'
            }
            icon={Zap}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>شارژ کیف پول</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.packs ?? []).map((p) => (
              <Button
                key={p.id}
                disabled={busy}
                variant="outline"
                className="h-auto py-3"
                onClick={() => buy(p.id)}
              >
                {p.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>شارژ خودکار</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--text-3)]">
              وقتی موجودی به آستانه برسد، مبلغ انتخابی شارژ می‌شود — تا سقف ماهانه.
            </p>
            <div className="flex items-center gap-3">
              <Button
                disabled={busy}
                variant={data?.autoRecharge.enabled ? 'default' : 'outline'}
                onClick={() => saveAuto(!(data?.autoRecharge.enabled ?? false))}
              >
                {data?.autoRecharge.enabled ? 'روشن' : 'خاموش'}
              </Button>
              {data?.autoRecharge.pausedReason && (
                <span className="text-sm text-[var(--danger)]">
                  متوقف شده: {data.autoRecharge.pausedReason}
                </span>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>وقتی موجودی کمتر از</Label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
              <div>
                <Label>خودکار اضافه شود</Label>
                <Input
                  type="number"
                  value={recharge}
                  onChange={(e) => setRecharge(e.target.value)}
                />
              </div>
              <div>
                <Label>سقف شارژ خودکار ماهانه</Label>
                <Input
                  type="number"
                  value={monthlyMax}
                  onChange={(e) => setMonthlyMax(e.target.value)}
                />
              </div>
            </div>
            <Button disabled={busy} onClick={() => saveAuto()}>
              ذخیره شارژ خودکار
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سقف هزینه ماهانه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-3)]">
              اگر مصرف به این سقف برسد، استفاده محدود می‌شود — حتی اگر شارژ خودکار روشن باشد.
            </p>
            <div className="max-w-sm">
              <Label>سقف (تومان) — خالی = بدون سقف</Label>
              <Input
                type="number"
                value={spendLimit}
                onChange={(e) => setSpendLimit(e.target.value)}
                placeholder="مثلاً ۳۰۰۰۰۰۰"
              />
            </div>
            <Button disabled={busy} onClick={saveLimit}>
              ذخیره سقف
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-sm text-[var(--text-3)]">در حال بارگذاری…</p>
        </AppShell>
      }
    >
      <BillingInner />
    </Suspense>
  );
}
