'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Tags } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Category = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export default function ShopCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setCategories(await api.listShopCategories());
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function reset() {
    setEditingId(null);
    setName('');
    setSlug('');
    setImageUrl('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        name,
        slug: slug || undefined,
        imageUrl: imageUrl || null,
      };
      if (editingId) await api.updateShopCategory(editingId, body);
      else await api.createShopCategory(body);
      reset();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader title="دسته‌ها" description="ساختار دسته‌بندی ویترین" />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش دسته' : 'دسته جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نام</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>اسلاگ</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>تصویر</Label>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'ذخیره' : 'ایجاد'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={reset}>
                    انصراف
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {categories.length === 0 ? (
          <EmptyState icon={Tags} title="دسته‌ای نیست" />
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-[var(--text-3)]">{c.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(c.id);
                        setName(c.name);
                        setSlug(c.slug);
                        setImageUrl(c.imageUrl ?? '');
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        api
                          .deleteShopCategory(c.id)
                          .then(refresh)
                          .catch((e) => setError(String(e)))
                      }
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
