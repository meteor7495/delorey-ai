'use client';

import { useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/shared/api';
import { toastFromError } from '@/lib/notify';

export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const res = await api.uploadImage(file);
      onChange(res.url);
    } catch (err) {
      toastFromError(err, 'آپلود تصویر انجام نشد');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1.5 sm:col-span-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-16 w-16 rounded-md object-cover border border-[var(--border-color)]"
          />
        ) : (
          <div className="h-16 w-16 rounded-md border border-dashed border-[var(--border-color)] bg-[var(--surface)]" />
        )}
        <div className="flex-1 min-w-[200px] space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="آدرس تصویر یا از دکمه آپلود استفاده کنید"
          />
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'در حال آپلود…' : 'آپلود از دستگاه'}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
              >
                حذف
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
