'use client';

import { toastSuccess, toastWarning, toastFromError } from '@/lib/notify';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import type { ShopCategory, ShopProduct } from '@delorey/api-client';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { VariantManager } from '@/components/shop/variant-manager';
import { ImageField } from '@/components/shop/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const selectClass =
  'flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm';

const PAGE_SIZE = 20;

export default function ShopProductsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [sort, setSort] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [variantsFor, setVariantsFor] = useState<ShopProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [onHand, setOnHand] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const refresh = useCallback(async () => {
    const [list, cats] = await Promise.all([
      api.listShopProducts({
        q: q || undefined,
        status: statusFilter || undefined,
        categoryId: categoryFilter || undefined,
        stock: stockFilter || undefined,
        sort: sort || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
      api.listShopCategories(),
    ]);
    setProducts(list.items);
    setTotal(list.total);
    setCategories(cats);
  }, [q, statusFilter, categoryFilter, stockFilter, sort, page]);

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, [refresh]);

  function resetForm() {
    setEditingId(null);
    setSku('');
    setTitle('');
    setSlug('');
    setPrice('');
    setCompareAtPrice('');
    setCostPrice('');
    setBarcode('');
    setBrand('');
    setShortDescription('');
    setDescription('');
    setTags('');
    setOnHand('');
    setLowStockThreshold('');
    setStatus('published');
    setCategoryId('');
    setImageUrl('');
    setSeoTitle('');
    setSeoDescription('');
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    resetForm();
  }

  function openEdit(p: ShopProduct) {
    if (p.source !== 'native') {
      toastWarning('محصول همگام‌سازی‌شده فقط‌خواندنی است');
      return;
    }
    setEditingId(p.id);
    setSku(p.sku);
    setTitle(p.title);
    setSlug(p.slug);
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice != null ? String(p.compareAtPrice) : '');
    setCostPrice(p.costPrice != null ? String(p.costPrice) : '');
    setBarcode(p.barcode ?? '');
    setBrand(p.brand ?? '');
    setShortDescription(p.shortDescription ?? '');
    setDescription(p.description ?? '');
    setTags(p.tags.join('، '));
    setOnHand(p.hasVariants ? '' : String(p.stock?.onHand ?? 0));
    setLowStockThreshold(
      p.stock?.lowStockThreshold != null ? String(p.stock.lowStockThreshold) : '',
    );
    setStatus(p.status === 'draft' ? 'draft' : 'published');
    setCategoryId(p.categoryId ?? '');
    setImageUrl(p.images?.[0] ?? '');
    setSeoTitle(p.seoTitle ?? '');
    setSeoDescription(p.seoDescription ?? '');
    setDialogOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const editing = products.find((p) => p.id === editingId);
    const body: Record<string, unknown> = {
      sku,
      title,
      slug: slug || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      costPrice: costPrice ? Number(costPrice) : null,
      barcode: barcode || null,
      brand: brand || null,
      shortDescription: shortDescription || null,
      description: description || null,
      tags: tags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      categoryId: categoryId || null,
      images: imageUrl ? [imageUrl] : [],
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    };

    // Stock is owned by the variants once a product has any.
    if (!editing?.hasVariants) {
      if (onHand !== '') body.onHand = Number(onHand);
      if (lowStockThreshold !== '') {
        body.lowStockThreshold = Number(lowStockThreshold);
      }
    }

    try {
      if (editingId) {
        await api.updateShopProduct(editingId, body);
        toastSuccess('محصول به‌روزرسانی شد');
      } else {
        await api.createShopProduct(body);
        toastSuccess('محصول بومی ایجاد شد');
      }
      closeDialog();
      await refresh();
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    }
  }

  async function onDelete(id: string) {
    try {
      await api.deleteShopProduct(id);
      await refresh();
    } catch (err) {
      toastFromError(err, 'حذف نشد');
    }
  }

  async function runBulk(action: 'publish' | 'draft' | 'delete' | 'category') {
    try {
      const result = await api.bulkShopProducts({
        ids: selectedIds,
        action,
        categoryId: action === 'category' ? bulkCategoryId || null : undefined,
      });
      toastSuccess(
        `${result.affected.toLocaleString('fa-IR')} محصول به‌روزرسانی شد`,
      );
      setSelectedIds([]);
      await refresh();
    } catch (err) {
      toastFromError(err, 'عملیات گروهی انجام نشد');
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const editing = products.find((p) => p.id === editingId);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="محصولات"
          description="محصولات فروشگاه بومی، تنوع‌ها، قیمت و موجودی"
          actions={
            <Button onClick={openCreate}>
              <Plus className="ms-1 h-4 w-4" />
              محصول جدید
            </Button>
          }
        />

        <FormDialog
          open={dialogOpen}
          onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
          title={editingId ? 'ویرایش محصول' : 'محصول جدید'}
          size="xl"
        >
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>عنوان</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>اسلاگ (اختیاری)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>برند</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>قیمت (ریال)</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>قیمت قبلی</Label>
              <Input
                type="number"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>قیمت تمام‌شده</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>بارکد</Label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>دسته</Label>
              <select
                className={selectClass}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>وضعیت</Label>
              <select
                className={selectClass}
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'published')
                }
              >
                <option value="published">منتشر</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>

            {editing?.hasVariants ? (
              <p className="text-xs text-[var(--text-3)] sm:col-span-2">
                موجودی این محصول توسط تنوع‌های آن مدیریت می‌شود.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>موجودی</Label>
                  <Input
                    type="number"
                    value={onHand}
                    onChange={(e) => setOnHand(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>آستانه موجودی کم</Label>
                  <Input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label>توضیح کوتاه</Label>
              <Input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>توضیح کامل</Label>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-3 text-sm leading-7"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>برچسب‌ها (با ، جدا کنید)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <ImageField
              label="تصویر محصول"
              value={imageUrl}
              onChange={setImageUrl}
            />
            <div className="space-y-1.5">
              <Label>عنوان سئو</Label>
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>توضیح سئو</Label>
              <Input
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">{editingId ? 'ذخیره' : 'ایجاد'}</Button>
              <Button type="button" variant="outline" onClick={closeDialog}>
                انصراف
              </Button>
            </div>
          </form>
        </FormDialog>

        <FormDialog
          open={!!variantsFor}
          onOpenChange={(open) => {
            if (!open) setVariantsFor(null);
          }}
          title={variantsFor ? `تنوع‌های «${variantsFor.title}»` : 'تنوع‌ها'}
          size="xl"
        >
          {variantsFor && (
            <VariantManager
              productId={variantsFor.id}
              basePrice={variantsFor.price}
              onChanged={() => {
                refresh().catch((e) => toastFromError(e));
              }}
            />
          )}
        </FormDialog>

        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[180px] flex-1 space-y-1.5">
              <Label className="text-xs">جستجو</Label>
              <Input
                value={q}
                onChange={(e) => {
                  setPage(0);
                  setQ(e.target.value);
                }}
                placeholder="عنوان، SKU، برند"
              />
            </div>
            <div className="w-36 space-y-1.5">
              <Label className="text-xs">وضعیت</Label>
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => {
                  setPage(0);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">همه</option>
                <option value="published">منتشر</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs">دسته</Label>
              <select
                className={selectClass}
                value={categoryFilter}
                onChange={(e) => {
                  setPage(0);
                  setCategoryFilter(e.target.value);
                }}
              >
                <option value="">همه</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-36 space-y-1.5">
              <Label className="text-xs">موجودی</Label>
              <select
                className={selectClass}
                value={stockFilter}
                onChange={(e) => {
                  setPage(0);
                  setStockFilter(e.target.value);
                }}
              >
                <option value="">همه</option>
                <option value="in_stock">موجود</option>
                <option value="out_of_stock">ناموجود</option>
              </select>
            </div>
            <div className="w-40 space-y-1.5">
              <Label className="text-xs">مرتب‌سازی</Label>
              <select
                className={selectClass}
                value={sort}
                onChange={(e) => {
                  setPage(0);
                  setSort(e.target.value);
                }}
              >
                <option value="">آخرین ویرایش</option>
                <option value="title_asc">عنوان (صعودی)</option>
                <option value="price_asc">قیمت (صعودی)</option>
                <option value="price_desc">قیمت (نزولی)</option>
                <option value="created_desc">جدیدترین</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <Card>
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
              <span className="text-sm text-[var(--text-2)]">
                {selectedIds.length.toLocaleString('fa-IR')} محصول انتخاب شده
              </span>
              <Button size="sm" variant="outline" onClick={() => runBulk('publish')}>
                انتشار
              </Button>
              <Button size="sm" variant="outline" onClick={() => runBulk('draft')}>
                پیش‌نویس
              </Button>
              <select
                className={`${selectClass} w-40`}
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
              >
                <option value="">بدون دسته</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBulk('category')}
              >
                تغییر دسته
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => runBulk('delete')}
              >
                حذف
              </Button>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="هنوز محصولی نیست"
            description="اولین محصول را بسازید تا ویترین و کارمند AI grounded شوند"
            action={
              <Button onClick={openCreate}>
                <Plus className="ms-1 h-4 w-4" />
                محصول جدید
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      {p.source === 'native' && (
                        <input
                          type="checkbox"
                          className="mt-1.5"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelected(p.id)}
                          aria-label={`انتخاب ${p.title}`}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[var(--text-1)]">
                            {p.title}
                          </span>
                          <Badge variant="outline">{p.source}</Badge>
                          <Badge variant="outline">{p.status}</Badge>
                          {p.hasVariants && (
                            <Badge variant="outline">
                              {(p.variantCount ?? 0).toLocaleString('fa-IR')} تنوع
                            </Badge>
                          )}
                          {!p.inStock && (
                            <Badge variant="destructive">ناموجود</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-3)]">
                          {p.sku} · {p.price.toLocaleString('fa-IR')} ریال ·
                          موجودی {(p.stock?.available ?? 0).toLocaleString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.source === 'native' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setVariantsFor(p)}
                          >
                            تنوع‌ها
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEdit(p)}
                          >
                            ویرایش
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(p.id)}
                          >
                            حذف
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
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
              onClick={() => setPage((prev) => prev + 1)}
            >
              بعدی
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
