'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import type { Discount, ShopCategory, ShopProduct } from '@delorey/api-client';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const selectClass =
  'flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm';

type TargetScope = 'all' | 'product' | 'category';

function toDateInput(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function ShopDiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [minCartAmount, setMinCartAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [priority, setPriority] = useState('0');
  const [stackable, setStackable] = useState(false);
  const [active, setActive] = useState(true);
  const [scope, setScope] = useState<TargetScope>('all');
  const [targetId, setTargetId] = useState('');

  async function refresh() {
    const [list, productList, categoryList] = await Promise.all([
      api.listShopDiscounts(),
      api.listShopProducts({ limit: 100 }),
      api.listShopCategories(),
    ]);
    setDiscounts(list);
    setProducts(productList.items);
    setCategories(categoryList);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCode('');
    setType('percentage');
    setValue('');
    setStartsAt('');
    setEndsAt('');
    setMinCartAmount('');
    setMaxDiscountAmount('');
    setUsageLimit('');
    setPriority('0');
    setStackable(false);
    setActive(true);
    setScope('all');
    setTargetId('');
  }

  function startEdit(discount: Discount) {
    setEditingId(discount.id);
    setName(discount.name);
    setCode(discount.code ?? '');
    setType(discount.type);
    setValue(String(discount.value));
    setStartsAt(toDateInput(discount.startsAt));
    setEndsAt(toDateInput(discount.endsAt));
    setMinCartAmount(
      discount.minCartAmount != null ? String(discount.minCartAmount) : '',
    );
    setMaxDiscountAmount(
      discount.maxDiscountAmount != null
        ? String(discount.maxDiscountAmount)
        : '',
    );
    setUsageLimit(discount.usageLimit != null ? String(discount.usageLimit) : '');
    setPriority(String(discount.priority));
    setStackable(discount.stackable);
    setActive(discount.active);

    const target = discount.targets[0];
    if (!target || target.targetType === 'all') {
      setScope('all');
      setTargetId('');
    } else {
      setScope(target.targetType as TargetScope);
      setTargetId(target.targetId ?? '');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const body = {
      name,
      code: code.trim() || null,
      type,
      value: Number(value),
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      minCartAmount: minCartAmount ? Number(minCartAmount) : null,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      priority: Number(priority) || 0,
      stackable,
      active,
      targets:
        scope === 'all'
          ? [{ targetType: 'all' }]
          : [{ targetType: scope, targetId }],
    };

    try {
      if (editingId) {
        await api.updateShopDiscount(editingId, body);
        setMessage('تخفیف به‌روزرسانی شد');
      } else {
        await api.createShopDiscount(body);
        setMessage('تخفیف ایجاد شد');
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره نشد');
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await api.deleteShopDiscount(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف نشد');
    }
  }

  function describeTargets(discount: Discount) {
    if (discount.targets.length === 0) return 'همه محصولات';
    return discount.targets
      .map((target) => {
        if (target.targetType === 'all') return 'همه محصولات';
        if (target.targetType === 'product') {
          return (
            products.find((p) => p.id === target.targetId)?.title ?? 'یک محصول'
          );
        }
        if (target.targetType === 'category') {
          return (
            categories.find((c) => c.id === target.targetId)?.name ?? 'یک دسته'
          );
        }
        return 'یک تنوع';
      })
      .join('، ');
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="تخفیف‌ها"
          description="قوانین تخفیف که هم ویترین و هم کارمند AI از همین‌جا قیمت نهایی را می‌گیرند"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش تخفیف' : 'تخفیف جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نام</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>کد (خالی = خودکار)</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="NOWRUZ1404"
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع</Label>
                <select
                  className={selectClass}
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as 'percentage' | 'fixed')
                  }
                >
                  <option value="percentage">درصدی</option>
                  <option value="fixed">مبلغ ثابت</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{type === 'percentage' ? 'درصد' : 'مبلغ (ریال)'}</Label>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>شروع</Label>
                <Input
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>پایان</Label>
                <Input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>حداقل مبلغ سبد</Label>
                <Input
                  type="number"
                  value={minCartAmount}
                  onChange={(e) => setMinCartAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>سقف تخفیف</Label>
                <Input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>محدودیت استفاده</Label>
                <Input
                  type="number"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>اولویت</Label>
                <Input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>دامنه</Label>
                <select
                  className={selectClass}
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as TargetScope);
                    setTargetId('');
                  }}
                >
                  <option value="all">همه محصولات</option>
                  <option value="product">یک محصول</option>
                  <option value="category">یک دسته</option>
                </select>
              </div>
              {scope !== 'all' && (
                <div className="space-y-1.5">
                  <Label>{scope === 'product' ? 'محصول' : 'دسته'}</Label>
                  <select
                    className={selectClass}
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    required
                  >
                    <option value="">انتخاب کنید</option>
                    {(scope === 'product' ? products : categories).map((item) => (
                      <option key={item.id} value={item.id}>
                        {'title' in item ? item.title : item.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={stackable}
                    onChange={(e) => setStackable(e.target.checked)}
                  />
                  قابل ترکیب با تخفیف‌های دیگر
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  فعال
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">{editingId ? 'ذخیره' : 'ایجاد'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    انصراف
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {discounts.length === 0 ? (
          <EmptyState
            icon={Percent}
            title="هنوز تخفیفی ثبت نشده"
            description="اولین قانون تخفیف را بسازید تا در ویترین و پاسخ‌های AI اعمال شود"
          />
        ) : (
          <div className="space-y-2">
            {discounts.map((discount) => (
              <Card key={discount.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-1)]">
                        {discount.name}
                      </span>
                      <Badge variant="outline">
                        {discount.type === 'percentage'
                          ? `${discount.value.toLocaleString('fa-IR')}٪`
                          : `${discount.value.toLocaleString('fa-IR')} ریال`}
                      </Badge>
                      {discount.code && (
                        <Badge variant="outline">کد {discount.code}</Badge>
                      )}
                      {discount.stackable && (
                        <Badge variant="outline">ترکیب‌پذیر</Badge>
                      )}
                      {!discount.active && (
                        <Badge variant="destructive">غیرفعال</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-3)]">
                      {describeTargets(discount)} · اولویت{' '}
                      {discount.priority.toLocaleString('fa-IR')} · استفاده‌شده{' '}
                      {discount.usedCount.toLocaleString('fa-IR')}
                      {discount.usageLimit != null
                        ? ` از ${discount.usageLimit.toLocaleString('fa-IR')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(discount)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(discount.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
