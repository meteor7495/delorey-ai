'use client';

import { toastSuccess, toastWarning, toastFromError } from '@/lib/notify';
import { useCallback, useEffect, useState } from 'react';
import { Boxes, AlertTriangle, PackageX, Wallet } from 'lucide-react';
import type {
  InventoryLevel,
  InventorySummary,
  InventoryTransaction,
  StockState,
} from '@delorey/api-client';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const selectClass =
  'flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm';

const PAGE_SIZE = 20;

const STATE_LABELS: Record<StockState, string> = {
  in_stock: 'موجود',
  low_stock: 'رو به اتمام',
  out_of_stock: 'ناموجود',
};

const TYPE_LABELS: Record<string, string> = {
  initial: 'موجودی اولیه',
  adjustment: 'اصلاح دستی',
  sale: 'فروش',
  reservation: 'رزرو',
  reservation_release: 'آزادسازی رزرو',
  return: 'مرجوعی',
  restock: 'شارژ مجدد',
  correction: 'تصحیح',
};

function stateVariant(state: StockState) {
  if (state === 'out_of_stock') return 'destructive' as const;
  return 'outline' as const;
}

export default function ShopInventoryPage() {
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [levels, setLevels] = useState<InventoryLevel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [state, setState] = useState('');

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);

  const refresh = useCallback(async () => {
    const [nextSummary, nextLevels] = await Promise.all([
      api.shopInventorySummary(),
      api.listShopInventory({
        q: q || undefined,
        state: state || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    ]);
    setSummary(nextSummary);
    setLevels(nextLevels.items);
    setTotal(nextLevels.total);
  }, [q, state, page]);

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, [refresh]);

  async function onAdjust(level: InventoryLevel, mode: 'set' | 'delta') {
    const raw = drafts[level.id];
    if (raw === undefined || raw === '') return;
    const amount = Number(raw);
    if (Number.isNaN(amount)) {
      toastWarning('مقدار وارد شده عدد نیست');
      return;
    }
    try {
      await api.adjustShopInventory({
        inventoryLevelId: level.id,
        ...(mode === 'set' ? { setTo: amount } : { delta: amount }),
        type: mode === 'set' ? 'correction' : 'adjustment',
        reason: 'ویرایش از پنل موجودی',
      });
      setDrafts((prev) => ({ ...prev, [level.id]: '' }));
      toastSuccess('موجودی به‌روزرسانی شد');
      await refresh();
      if (historyFor === level.id) await loadHistory(level.id);
    } catch (err) {
      toastFromError(err, 'به‌روزرسانی نشد');
    }
  }

  async function loadHistory(inventoryLevelId: string) {
    const result = await api.listShopInventoryTransactions({
      inventoryLevelId,
      limit: 20,
    });
    setHistory(result.items);
    setHistoryFor(inventoryLevelId);
  }

  async function toggleHistory(inventoryLevelId: string) {
    if (historyFor === inventoryLevelId) {
      setHistoryFor(null);
      setHistory([]);
      return;
    }
    try {
      await loadHistory(inventoryLevelId);
    } catch (err) {
      toastFromError(err, 'تاریخچه بارگذاری نشد');
    }
  }

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="موجودی"
          description="موجودی محصولات و تنوع‌ها با تاریخچه کامل تغییرات"
        />

        {summary && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="ردیف‌های موجودی"
              value={String(summary.trackedCount)}
              description={`${summary.productCount} محصول · ${summary.variantCount} تنوع`}
              icon={Boxes}
            />
            <StatCard
              title="رو به اتمام"
              value={String(summary.lowStock)}
              icon={AlertTriangle}
            />
            <StatCard
              title="ناموجود"
              value={String(summary.outOfStock)}
              icon={PackageX}
            />
            <StatCard
              title="ارزش انبار"
              value={summary.inventoryValue.toLocaleString('fa-IR')}
              description="بر پایه قیمت تمام‌شده"
              icon={Wallet}
            />
          </div>
        )}

        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label className="text-xs">جستجو</Label>
              <Input
                value={q}
                onChange={(e) => {
                  setPage(0);
                  setQ(e.target.value);
                }}
                placeholder="نام محصول یا SKU"
              />
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs">وضعیت</Label>
              <select
                className={selectClass}
                value={state}
                onChange={(e) => {
                  setPage(0);
                  setState(e.target.value);
                }}
              >
                <option value="">همه</option>
                <option value="in_stock">موجود</option>
                <option value="low_stock">رو به اتمام</option>
                <option value="out_of_stock">ناموجود</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {levels.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="ردیف موجودی‌ای پیدا نشد"
            description="با ساختن محصول، ردیف موجودی آن به‌صورت خودکار ایجاد می‌شود"
          />
        ) : (
          <div className="space-y-2">
            {levels.map((level) => (
              <Card key={level.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--text-1)]">
                          {level.productTitle ?? '—'}
                        </span>
                        <Badge variant={stateVariant(level.state)}>
                          {STATE_LABELS[level.state]}
                        </Badge>
                        {level.options.map((option) => (
                          <Badge key={option.attributeValueId} variant="outline">
                            {option.attributeName}: {option.label || option.value}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-3)]">
                        {level.sku} · موجود {level.available.toLocaleString('fa-IR')}{' '}
                        · انبار {level.onHand.toLocaleString('fa-IR')} · رزرو{' '}
                        {level.reserved.toLocaleString('fa-IR')} · آستانه{' '}
                        {level.lowStockThreshold.toLocaleString('fa-IR')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        className="w-24"
                        type="number"
                        value={drafts[level.id] ?? ''}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [level.id]: e.target.value,
                          }))
                        }
                        placeholder="مقدار"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAdjust(level, 'delta')}
                      >
                        اعمال تغییر
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAdjust(level, 'set')}
                      >
                        تنظیم دقیق
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleHistory(level.id)}
                      >
                        {historyFor === level.id ? 'بستن تاریخچه' : 'تاریخچه'}
                      </Button>
                    </div>
                  </div>

                  {historyFor === level.id && (
                    <div className="rounded-md border border-[var(--border-color)] bg-[var(--surface-2)] p-3">
                      {history.length === 0 ? (
                        <p className="text-xs text-[var(--text-3)]">
                          تراکنشی ثبت نشده است
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {history.map((tx) => (
                            <li
                              key={tx.id}
                              className="flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-[var(--text-2)]">
                                {TYPE_LABELS[tx.type] ?? tx.type}
                                {tx.reason ? ` · ${tx.reason}` : ''}
                              </span>
                              <span className="tnum text-[var(--text-3)]">
                                {tx.quantityDelta > 0 ? '+' : ''}
                                {tx.quantityDelta.toLocaleString('fa-IR')} →{' '}
                                {tx.resultingOnHand.toLocaleString('fa-IR')} ·{' '}
                                {new Date(tx.createdAt).toLocaleString('fa-IR')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              قبلی
            </Button>
            <span className="text-xs text-[var(--text-3)]">
              صفحه {(page + 1).toLocaleString('fa-IR')} از{' '}
              {pageCount.toLocaleString('fa-IR')}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              بعدی
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
