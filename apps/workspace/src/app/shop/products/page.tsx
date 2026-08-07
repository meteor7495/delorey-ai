'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  inStock: boolean;
  description?: string | null;
  status: string;
  source: string;
  categoryId?: string | null;
  images?: string[];
};

type Category = { id: string; name: string };

export default function ShopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sku, setSku] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [description, setDescription] = useState('');
  const [inStock, setInStock] = useState(true);
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  async function refresh() {
    const [list, cats] = await Promise.all([
      api.listShopProducts(),
      api.listShopCategories(),
    ]);
    setProducts(list as unknown as Product[]);
    setCategories(cats);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditingId(null);
    setSku('');
    setTitle('');
    setSlug('');
    setPrice('');
    setCompareAtPrice('');
    setDescription('');
    setInStock(true);
    setStatus('published');
    setCategoryId('');
    setImageUrl('');
  }

  function startEdit(p: Product) {
    if (p.source !== 'native') {
      setError('محصول همگام‌سازی‌شده فقط‌خواندنی است');
      return;
    }
    setEditingId(p.id);
    setSku(p.sku);
    setTitle(p.title);
    setSlug(p.slug);
    setPrice(String(p.price));
    setCompareAtPrice(p.compareAtPrice != null ? String(p.compareAtPrice) : '');
    setDescription(p.description ?? '');
    setInStock(p.inStock);
    setStatus(p.status === 'draft' ? 'draft' : 'published');
    setCategoryId(p.categoryId ?? '');
    setImageUrl(p.images?.[0] ?? '');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const body = {
      sku,
      title,
      slug: slug || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      description: description || null,
      inStock,
      status,
      categoryId: categoryId || null,
      images: imageUrl ? [imageUrl] : [],
    };
    try {
      if (editingId) {
        await api.updateShopProduct(editingId, body);
        setMessage('محصول به‌روزرسانی شد');
      } else {
        await api.createShopProduct(body);
        setMessage('محصول بومی ایجاد شد');
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
      await api.deleteShopProduct(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="محصولات"
          description="محصولات بومی قابل ویرایش‌اند؛ محصولات Shopify/Woo فقط‌خواندنی‌اند"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش محصول' : 'محصول جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>عنوان</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>اسلاگ (اختیاری)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
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
                <Label>دسته</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label>توضیح</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>آدرس تصویر</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                  />
                  موجود
                </label>
                <select
                  className="h-9 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'draft' | 'published')
                  }
                >
                  <option value="published">منتشر</option>
                  <option value="draft">پیش‌نویس</option>
                </select>
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

        {products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="هنوز محصولی نیست"
            description="اولین محصول بومی را بسازید یا از Shopify/Woo همگام کنید"
          />
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-1)]">
                        {p.title}
                      </span>
                      <Badge variant="outline">{p.source}</Badge>
                      <Badge variant="outline">{p.status}</Badge>
                      {!p.inStock && <Badge variant="destructive">ناموجود</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-3)]">
                      {p.sku} · {p.price.toLocaleString('fa-IR')} ریال
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {p.source === 'native' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
