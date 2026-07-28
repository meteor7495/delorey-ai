'use client';

import { FormEvent, useEffect, useState } from 'react';
import { knowledgeDocTypeLabel, knowledgeStatusLabel } from '@delorey/ui';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

type KnowledgeDoc = {
  id: string;
  docType: string;
  title: string;
  bodyText: string;
  sourceAttribution: string;
  status: string;
  updatedAt: string;
};

type IndexStatus = {
  total: number;
  active: number;
  indexing: number;
  failed: number;
  mode: string;
  note: string;
};

export default function KnowledgePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [index, setIndex] = useState<IndexStatus | null>(null);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [sourceAttribution, setSourceAttribution] = useState('سیاست فروشگاه');
  const [docType, setDocType] = useState<'faq' | 'policy_override'>('faq');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    const [list, status] = await Promise.all([
      api.listKnowledgeDocs(),
      api.getKnowledgeIndexStatus(),
    ]);
    setDocs(list);
    setIndex(status);
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setBodyText('');
    setSourceAttribution('سیاست فروشگاه');
    setDocType('faq');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (editingId) {
        await api.updateKnowledgeDoc(editingId, {
          title,
          bodyText,
          sourceAttribution,
          docType,
        });
        setMessage('به‌روزرسانی شد و دوباره ایندکس شد');
      } else {
        await api.createKnowledgeDoc({
          docType,
          title,
          bodyText,
          sourceAttribution,
        });
        setMessage('پرسش متداول ذخیره و ایندکس شد');
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره نشد. دوباره تلاش کنید.');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="دانش فروشگاه"
          description="پرسش‌های متداول و سیاست‌ها با ذکر منبع — ایندکس کلیدواژه‌ای"
        />

        {index && (
          <Card className="border-[var(--brand-400)]/20 bg-[var(--brand-50)]">
            <CardContent className="space-y-1 p-4">
              <p className="text-sm font-semibold text-[var(--text-1)]">
                وضعیت ایندکس: {index.note}
              </p>
              <p className="text-xs text-[var(--text-3)]">
                حالت: {index.mode === 'keyword' ? 'کلیدواژه' : index.mode} · فعال:{' '}
                {index.active} · در حال ایندکس: {index.indexing} · ناموفق:{' '}
                {index.failed}
              </p>
            </CardContent>
          </Card>
        )}

        {message && <p className="text-sm text-[var(--success)]">{message}</p>}
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'ویرایش سند' : 'افزودن پرسش متداول / سیاست'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>نوع</Label>
                <select
                  className="flex h-9 w-full rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"
                  value={docType}
                  onChange={(e) =>
                    setDocType(e.target.value as 'faq' | 'policy_override')
                  }
                >
                  <option value="faq">پرسش متداول</option>
                  <option value="policy_override">سیاست / بازنویسی</option>
                </select>
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
                <Label>متن</Label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-[var(--r-sm)] border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>منبع</Label>
                <Input
                  value={sourceAttribution}
                  onChange={(e) => setSourceAttribution(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? 'ذخیره' : 'افزودن'}</Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    انصراف
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>اسناد</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {docs.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="سندی نیست"
                description="دمو معمولاً دو پرسش متداول پیش‌فرض دارد."
              />
            ) : (
              <div className="divide-y divide-[var(--border-color)]">
                {docs.map((d) => (
                  <div key={d.id} className="space-y-2 px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--text-1)]">{d.title}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="secondary">
                            {knowledgeDocTypeLabel(d.docType)}
                          </Badge>
                          <Badge variant="outline">
                            {knowledgeStatusLabel(d.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(d.id);
                            setTitle(d.title);
                            setBodyText(d.bodyText);
                            setSourceAttribution(d.sourceAttribution);
                            setDocType(
                              d.docType === 'policy_override'
                                ? 'policy_override'
                                : 'faq',
                            );
                          }}
                        >
                          ویرایش
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await api.deleteKnowledgeDoc(d.id);
                            await refresh();
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-2)]">{d.bodyText}</p>
                    <p className="text-xs text-[var(--text-3)]">
                      منبع: {d.sourceAttribution}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
