'use client';

import { FormEvent, useEffect, useState } from 'react';
import { SlidersHorizontal, Trash2, Plus } from 'lucide-react';
import type { Attribute } from '@delorey/api-client';
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

const TYPE_LABELS: Record<string, string> = {
  select: 'انتخابی',
  multi_select: 'چندانتخابی',
  color: 'رنگ',
  text: 'متن',
  number: 'عدد',
  boolean: 'بله/خیر',
};

const DISPLAY_LABELS: Record<string, string> = {
  dropdown: 'کشویی',
  swatch: 'نمونه رنگ',
  chip: 'چیپ',
  radio: 'رادیویی',
};

export default function ShopAttributesPage() {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('select');
  const [displayType, setDisplayType] = useState('dropdown');
  const [required, setRequired] = useState(false);
  const [active, setActive] = useState(true);

  const [valueDrafts, setValueDrafts] = useState<
    Record<string, { value: string; colorHex: string }>
  >({});

  async function refresh() {
    setAttributes(await api.listShopAttributes());
  }

  useEffect(() => {
    refresh().catch((e) => setError(String(e)));
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setType('select');
    setDisplayType('dropdown');
    setRequired(false);
    setActive(true);
  }

  function startEdit(attribute: Attribute) {
    setEditingId(attribute.id);
    setName(attribute.name);
    setType(attribute.type);
    setDisplayType(attribute.displayType);
    setRequired(attribute.required);
    setActive(attribute.active);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const body = { name, type, displayType, required, active };
      if (editingId) {
        await api.updateShopAttribute(editingId, body);
        setMessage('ویژگی به‌روزرسانی شد');
      } else {
        await api.createShopAttribute(body);
        setMessage('ویژگی ایجاد شد');
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
      await api.deleteShopAttribute(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حذف نشد');
    }
  }

  async function onAddValue(attributeId: string) {
    const draft = valueDrafts[attributeId];
    if (!draft?.value.trim()) return;
    setError(null);
    try {
      await api.addShopAttributeValue(attributeId, {
        value: draft.value.trim(),
        colorHex: draft.colorHex || null,
      });
      setValueDrafts((prev) => ({
        ...prev,
        [attributeId]: { value: '', colorHex: '' },
      }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مقدار اضافه نشد');
    }
  }

  async function onDeleteValue(valueId: string) {
    setError(null);
    try {
      await api.deleteShopAttributeValue(valueId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مقدار حذف نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="ویژگی‌ها"
          description="ویژگی‌هایی مثل رنگ و سایز که تنوع محصولات از آن‌ها ساخته می‌شود"
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {message && <p className="text-sm text-[var(--success)]">{message}</p>}

        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'ویرایش ویژگی' : 'ویژگی جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>نام</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً رنگ"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع</Label>
                <select
                  className={selectClass}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {Object.entries(TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>نمایش در ویترین</Label>
                <select
                  className={selectClass}
                  value={displayType}
                  onChange={(e) => setDisplayType(e.target.value)}
                >
                  {Object.entries(DISPLAY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={required}
                    onChange={(e) => setRequired(e.target.checked)}
                  />
                  الزامی
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

        {attributes.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="هنوز ویژگی‌ای تعریف نشده"
            description="ویژگی بسازید تا بتوانید برای محصولات تنوع تولید کنید"
          />
        ) : (
          <div className="space-y-3">
            {attributes.map((attribute) => {
              const draft = valueDrafts[attribute.id] ?? {
                value: '',
                colorHex: '',
              };
              return (
                <Card key={attribute.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[var(--text-1)]">
                          {attribute.name}
                        </span>
                        <Badge variant="outline">
                          {TYPE_LABELS[attribute.type] ?? attribute.type}
                        </Badge>
                        <Badge variant="outline">
                          {DISPLAY_LABELS[attribute.displayType] ??
                            attribute.displayType}
                        </Badge>
                        {attribute.required && (
                          <Badge variant="outline">الزامی</Badge>
                        )}
                        {!attribute.active && (
                          <Badge variant="destructive">غیرفعال</Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(attribute)}
                        >
                          ویرایش
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(attribute.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {attribute.values.length === 0 && (
                        <span className="text-xs text-[var(--text-3)]">
                          هنوز مقداری ثبت نشده
                        </span>
                      )}
                      {attribute.values.map((value) => (
                        <span
                          key={value.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--surface-2)] px-2.5 py-1 text-xs"
                        >
                          {value.colorHex && (
                            <span
                              className="h-3 w-3 rounded-full border border-[var(--border-color)]"
                              style={{ background: value.colorHex }}
                            />
                          )}
                          {value.label || value.value}
                          <button
                            type="button"
                            onClick={() => onDeleteValue(value.id)}
                            className="text-[var(--text-3)] hover:text-[var(--danger)]"
                            aria-label="حذف مقدار"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[160px] flex-1 space-y-1.5">
                        <Label className="text-xs">مقدار جدید</Label>
                        <Input
                          value={draft.value}
                          onChange={(e) =>
                            setValueDrafts((prev) => ({
                              ...prev,
                              [attribute.id]: {
                                ...draft,
                                value: e.target.value,
                              },
                            }))
                          }
                          placeholder="مثلاً مشکی"
                        />
                      </div>
                      {attribute.displayType === 'swatch' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">رنگ</Label>
                          <Input
                            type="color"
                            className="w-16 p-1"
                            value={draft.colorHex || '#000000'}
                            onChange={(e) =>
                              setValueDrafts((prev) => ({
                                ...prev,
                                [attribute.id]: {
                                  ...draft,
                                  colorHex: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddValue(attribute.id)}
                      >
                        <Plus className="ms-1 h-4 w-4" />
                        افزودن
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
