'use client';

import { toastSuccess, toastWarning, toastFromError } from '@/lib/notify';
import { useCallback, useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import type { Attribute, ProductVariant } from '@seloma/api-client';
import { api } from '@/shared/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

type Draft = { price: string; onHand: string; sku: string };

interface VariantManagerProps {
  productId: string;
  basePrice: number;
  onChanged?: () => void;
}

/**
 * Variant matrix editor. Generation and pricing rules live on the server —
 * this only collects the merchant's selections and renders what comes back.
 */
export function VariantManager({
  productId,
  basePrice,
  onChanged,
}: VariantManagerProps) {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [allAttributes, productAttributes, currentVariants] =
      await Promise.all([
        api.listShopAttributes(true),
        api.listProductAttributes(productId),
        api.listProductVariants(productId),
      ]);

    setAttributes(allAttributes);
    setAssigned(productAttributes.map((p) => p.attribute.id));
    setVariants(currentVariants);
    setDrafts(
      Object.fromEntries(
        currentVariants.map((v) => [
          v.id,
          {
            price: v.price != null ? String(v.price) : '',
            onHand: String(v.inventory?.onHand ?? 0),
            sku: v.sku,
          },
        ]),
      ),
    );

    // Pre-check the values that existing variants already use.
    const used: Record<string, string[]> = {};
    for (const variant of currentVariants) {
      for (const option of variant.options) {
        const list = used[option.attributeId] ?? [];
        if (!list.includes(option.attributeValueId)) {
          list.push(option.attributeValueId);
        }
        used[option.attributeId] = list;
      }
    }
    setSelected(used);
  }, [productId]);

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, [refresh]);

  function toggleAttribute(attributeId: string) {
    setAssigned((prev) =>
      prev.includes(attributeId)
        ? prev.filter((id) => id !== attributeId)
        : [...prev, attributeId],
    );
  }

  function toggleValue(attributeId: string, valueId: string) {
    setSelected((prev) => {
      const list = prev[attributeId] ?? [];
      return {
        ...prev,
        [attributeId]: list.includes(valueId)
          ? list.filter((id) => id !== valueId)
          : [...list, valueId],
      };
    });
  }

  async function saveAttributes() {
    setBusy(true);
    try {
      await api.setProductAttributes(productId, assigned);
      toastSuccess('ویژگی‌های محصول ذخیره شد');
      await refresh();
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    try {
      const selections = assigned
        .map((attributeId) => ({
          attributeId,
          valueIds: selected[attributeId] ?? [],
        }))
        .filter((s) => s.valueIds.length > 0);

      if (selections.length === 0) {
        toastWarning('حداقل یک مقدار ویژگی انتخاب کنید');
        return;
      }

      const result = await api.generateProductVariants(productId, {
        selections,
      });
      toastSuccess(
        `${result.created.toLocaleString('fa-IR')} تنوع ساخته شد، ${result.unchanged.toLocaleString('fa-IR')} تنوع بدون تغییر`,
      );
      await refresh();
      onChanged?.();
    } catch (err) {
      toastFromError(err, 'تولید تنوع انجام نشد');
    } finally {
      setBusy(false);
    }
  }

  async function saveVariants() {
    setBusy(true);
    try {
      const payload = variants.map((variant) => {
        const draft = drafts[variant.id];
        return {
          id: variant.id,
          sku: draft?.sku || variant.sku,
          price: draft?.price ? Number(draft.price) : null,
          onHand: draft?.onHand ? Number(draft.onHand) : 0,
        };
      });
      await api.bulkUpdateProductVariants(productId, payload);
      toastSuccess('تنوع‌ها ذخیره شد');
      await refresh();
      onChanged?.();
    } catch (err) {
      toastFromError(err, 'ذخیره تنوع‌ها انجام نشد');
    } finally {
      setBusy(false);
    }
  }

  async function removeVariant(variantId: string) {
    try {
      await api.deleteProductVariant(variantId);
      await refresh();
      onChanged?.();
    } catch (err) {
      toastFromError(err, 'حذف نشد');
    }
  }

  return (
    <div className="space-y-4 rounded-md border border-[var(--border-color)] bg-[var(--surface-2)] p-4">

      {attributes.length === 0 ? (
        <p className="text-sm text-[var(--text-3)]">
          هنوز ویژگی‌ای تعریف نشده است. ابتدا از صفحه «ویژگی‌ها» رنگ، سایز و
          مواردی از این دست را بسازید.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-xs">ویژگی‌های این محصول</Label>
            <div className="flex flex-wrap gap-2">
              {attributes.map((attribute) => (
                <button
                  key={attribute.id}
                  type="button"
                  onClick={() => toggleAttribute(attribute.id)}
                  className={
                    assigned.includes(attribute.id)
                      ? 'rounded-full border border-[var(--brand-500)] bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--brand-600)]'
                      : 'rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-3)]'
                  }
                >
                  {attribute.name}
                </button>
              ))}
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={saveAttributes}
              >
                ذخیره ویژگی‌ها
              </Button>
            </div>
          </div>

          {assigned.length > 0 && (
            <div className="space-y-3">
              {attributes
                .filter((attribute) => assigned.includes(attribute.id))
                .map((attribute) => (
                  <div key={attribute.id} className="space-y-1.5">
                    <Label className="text-xs">{attribute.name}</Label>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.length === 0 && (
                        <span className="text-xs text-[var(--text-3)]">
                          مقداری تعریف نشده
                        </span>
                      )}
                      {attribute.values.map((value) => {
                        const checked = (selected[attribute.id] ?? []).includes(
                          value.id,
                        );
                        return (
                          <button
                            key={value.id}
                            type="button"
                            onClick={() => toggleValue(attribute.id, value.id)}
                            className={
                              checked
                                ? 'inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-500)] bg-[var(--brand-50)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-600)]'
                                : 'inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-3)]'
                            }
                          >
                            {value.colorHex && (
                              <span
                                className="h-3 w-3 rounded-full border border-[var(--border-color)]"
                                style={{ background: value.colorHex }}
                              />
                            )}
                            {value.label || value.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

              <Button size="sm" disabled={busy} onClick={generate}>
                <Wand2 className="ms-1 h-4 w-4" />
                تولید تنوع‌ها
              </Button>
            </div>
          )}
        </>
      )}

      {variants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">
              {variants.length.toLocaleString('fa-IR')} تنوع
            </Label>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={saveVariants}
            >
              ذخیره تنوع‌ها
            </Button>
          </div>

          {variants.map((variant) => {
            const draft = drafts[variant.id] ?? {
              price: '',
              onHand: '0',
              sku: variant.sku,
            };
            return (
              <div
                key={variant.id}
                className="flex flex-col gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface)] p-3 lg:flex-row lg:items-end"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {variant.options.map((option) => (
                      <Badge key={option.attributeValueId} variant="outline">
                        {option.label || option.value}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-3)]">
                    قیمت مؤثر:{' '}
                    {variant.effectivePrice.toLocaleString('fa-IR')} ریال
                    {variant.price == null
                      ? ` (ارثی از ${basePrice.toLocaleString('fa-IR')})`
                      : ''}
                  </p>
                </div>
                <div className="w-full space-y-1 lg:w-40">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={draft.sku}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [variant.id]: { ...draft, sku: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="w-full space-y-1 lg:w-32">
                  <Label className="text-xs">قیمت</Label>
                  <Input
                    type="number"
                    value={draft.price}
                    placeholder="ارثی"
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [variant.id]: { ...draft, price: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="w-full space-y-1 lg:w-28">
                  <Label className="text-xs">موجودی</Label>
                  <Input
                    type="number"
                    value={draft.onHand}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [variant.id]: { ...draft, onHand: e.target.value },
                      }))
                    }
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeVariant(variant.id)}
                >
                  حذف
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
