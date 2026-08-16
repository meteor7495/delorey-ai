'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { ImageField } from '@/components/shop/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
  const [dialogOpen, setDialogOpen] = useState(false);

  async function refresh() {
    setCategories(await api.listShopCategories());
  }

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, []);

  function reset() {
    setEditingId(null);
    setName('');
    setSlug('');
    setImageUrl('');
  }

  function openCreate() {
    reset();
    setDialogOpen(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setName(c.name);
    setSlug(c.slug);
    setImageUrl(c.imageUrl ?? '');
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    reset();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const body = {
        name,
        slug: slug || undefined,
        imageUrl: imageUrl || null,
      };
      if (editingId) {
        await api.updateShopCategory(editingId, body);
        toastSuccess('دسته به‌روزرسانی شد');
      } else {
        await api.createShopCategory(body);
        toastSuccess('دسته ایجاد شد');
      }
      closeDialog();
      await refresh();
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="دسته‌ها"
          description="ساختار دسته‌بندی ویترین"
          actions={
            <Button onClick={openCreate}>
              <Plus className="ms-1 h-4 w-4" />
              دسته جدید
            </Button>
          }
        />

        <FormDialog
          open={dialogOpen}
          onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
          title={editingId ? 'ویرایش دسته' : 'دسته جدید'}
        >
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>نام</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>اسلاگ</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <ImageField label="تصویر" value={imageUrl} onChange={setImageUrl} />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">{editingId ? 'ذخیره' : 'ایجاد'}</Button>
              <Button type="button" variant="outline" onClick={closeDialog}>
                انصراف
              </Button>
            </div>
          </form>
        </FormDialog>

        {categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="دسته‌ای نیست"
            action={
              <Button onClick={openCreate}>
                <Plus className="ms-1 h-4 w-4" />
                دسته جدید
              </Button>
            }
          />
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
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        api
                          .deleteShopCategory(c.id)
                          .then(refresh)
                          .catch((e) => toastFromError(e))
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
