'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import type { Article, ShopCategory } from '@delorey/api-client';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FormDialog } from '@/components/shared/form-dialog';
import { ImageField } from '@/components/shop/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const selectClass =
  'flex h-9 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشرشده',
  archived: 'بایگانی',
};

export default function ShopArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const refresh = useCallback(async () => {
    const [list, categoryList] = await Promise.all([
      api.listShopArticles({
        q: q || undefined,
        status: statusFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
      api.listShopCategories(),
    ]);
    setArticles(list.items);
    setTotal(list.total);
    setCategories(categoryList);
  }, [q, statusFilter, page]);

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, [refresh]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setExcerpt('');
    setContent('');
    setFeaturedImageUrl('');
    setCategoryId('');
    setTags('');
    setStatus('draft');
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

  async function openEdit(id: string) {
    try {
      const article = await api.getShopArticle(id);
      setEditingId(article.id);
      setTitle(article.title);
      setSlug(article.slug);
      setExcerpt(article.excerpt ?? '');
      setContent(article.content ?? '');
      setFeaturedImageUrl(article.featuredImageUrl ?? '');
      setCategoryId(article.categoryId ?? '');
      setTags(article.tags.join('، '));
      setStatus(article.status);
      setSeoTitle(article.seoTitle ?? '');
      setSeoDescription(article.seoDescription ?? '');
      setDialogOpen(true);
    } catch (err) {
      toastFromError(err, 'مقاله بارگذاری نشد');
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    const body = {
      title,
      slug: slug || undefined,
      excerpt: excerpt || null,
      content,
      featuredImageUrl: featuredImageUrl || null,
      categoryId: categoryId || null,
      tags: tags
        .split(/[,،]/)
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    };

    try {
      if (editingId) {
        await api.updateShopArticle(editingId, body);
        toastSuccess('مقاله به‌روزرسانی شد');
      } else {
        await api.createShopArticle(body);
        toastSuccess('مقاله ایجاد شد');
      }
      closeDialog();
      await refresh();
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    }
  }

  async function togglePublish(article: Article) {
    try {
      if (article.status === 'published') {
        await api.unpublishShopArticle(article.id);
        toastSuccess('انتشار لغو شد');
      } else {
        await api.publishShopArticle(article.id);
        toastSuccess('مقاله منتشر شد');
      }
      await refresh();
    } catch (err) {
      toastFromError(err, 'تغییر وضعیت انجام نشد');
    }
  }

  async function onDelete(id: string) {
    try {
      await api.deleteShopArticle(id);
      toastSuccess('مقاله حذف شد');
      await refresh();
    } catch (err) {
      toastFromError(err, 'حذف نشد');
    }
  }

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="مقالات"
          description="محتوای فروشگاه — راهنمای خرید، معرفی محصول و مطالب سئو"
          actions={
            <Button onClick={openCreate}>
              <Plus className="ms-1 h-4 w-4" />
              مقاله جدید
            </Button>
          }
        />

        <FormDialog
          open={dialogOpen}
          onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
          title={editingId ? 'ویرایش مقاله' : 'مقاله جدید'}
          size="xl"
        >
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
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
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">پیش‌نویس</option>
                <option value="published">منتشرشده</option>
                <option value="archived">بایگانی</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>خلاصه</Label>
              <Input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>متن مقاله</Label>
              <textarea
                className="min-h-[180px] w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-3 text-sm leading-7"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن کامل مقاله…"
              />
            </div>
            <ImageField
              label="تصویر شاخص"
              value={featuredImageUrl}
              onChange={setFeaturedImageUrl}
            />
            <div className="space-y-1.5">
              <Label>برچسب‌ها (با ، جدا کنید)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
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
                placeholder="عنوان یا برچسب"
              />
            </div>
            <div className="w-40 space-y-1.5">
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
                <option value="draft">پیش‌نویس</option>
                <option value="published">منتشرشده</option>
                <option value="archived">بایگانی</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {articles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="هنوز مقاله‌ای نیست"
            description="مقالات به کارمند AI کمک می‌کنند به سوال‌های محتوایی هم پاسخ بدهد"
            action={
              <Button onClick={openCreate}>
                <Plus className="ms-1 h-4 w-4" />
                مقاله جدید
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {articles.map((article) => (
              <Card key={article.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-1)]">
                        {article.title}
                      </span>
                      <Badge variant="outline">
                        {STATUS_LABELS[article.status] ?? article.status}
                      </Badge>
                      {article.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-3)]">
                      {article.excerpt || article.slug}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePublish(article)}
                    >
                      {article.status === 'published' ? 'لغو انتشار' : 'انتشار'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(article.id)}
                    >
                      ویرایش
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(article.id)}
                    >
                      حذف
                    </Button>
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
