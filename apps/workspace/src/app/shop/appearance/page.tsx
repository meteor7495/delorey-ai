'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { ImageField } from '@/components/shop/image-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
  sortOrder: number;
  active: boolean;
};

export default function ShopAppearancePage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [href, setHref] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ef4056');
  const [secondaryColor, setSecondaryColor] = useState('#0c0c0c');
  const [themeId, setThemeId] = useState('zi-home');
  const [themes, setThemes] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      defaults: { primaryColor: string; secondaryColor: string };
      swatches: { bg: string; fg: string; accent: string };
    }>
  >([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  async function refresh() {
    const [b, s, packs] = await Promise.all([
      api.listShopBanners(),
      api.shopSettings(),
      api.listShopThemes().catch(() => []),
    ]);
    setBanners(b as unknown as Banner[]);
    setSettings(s);
    setThemes(packs);
    setPrimaryColor(String(s.primaryColor ?? '#ef4056'));
    setSecondaryColor(String(s.secondaryColor ?? '#0c0c0c'));
    setThemeId(String(s.themeId ?? 'zi-home'));
    setLogoUrl(String(s.logoUrl ?? ''));
  }

  useEffect(() => {
    refresh().catch((e) => toastFromError(e));
  }, []);

  function resetBannerForm() {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setHref('');
  }

  function openBannerCreate() {
    resetBannerForm();
    setBannerDialogOpen(true);
  }

  function closeBannerDialog() {
    setBannerDialogOpen(false);
    resetBannerForm();
  }

  async function saveColors(e: FormEvent) {
    e.preventDefault();
    try {
      await api.updateShopSettings({
        themeId,
        primaryColor,
        secondaryColor,
        logoUrl: logoUrl || null,
      });
      toastSuccess('ظاهر ذخیره شد');
      await refresh();
    } catch (err) {
      toastFromError(err, 'ذخیره نشد');
    }
  }

  async function addBanner(e: FormEvent) {
    e.preventDefault();
    try {
      await api.createShopBanner({
        title,
        subtitle: subtitle || null,
        imageUrl: imageUrl || null,
        href: href || null,
        active: true,
      });
      closeBannerDialog();
      toastSuccess('بنر افزوده شد');
      await refresh();
    } catch (err) {
      toastFromError(err, 'بنر ذخیره نشد');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="ظاهر و بنر"
          description="تم ویترین را عوض کنید — محصولات، سفارش‌ها و بنرها سر جایشان می‌مانند"
          actions={
            <Button onClick={openBannerCreate}>
              <Plus className="ms-1 h-4 w-4" />
              بنر جدید
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>تم فروشگاه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--text-3)]">
              هر تم فقط ظاهر ویترین را عوض می‌کند. کاتالوگ و سفارش‌ها دست نمی‌خورند.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {themes.map((pack) => {
                const selected = themeId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setThemeId(pack.id);
                      setPrimaryColor(pack.defaults.primaryColor);
                      setSecondaryColor(pack.defaults.secondaryColor);
                    }}
                    className={`rounded-xl border p-3 text-start transition ${
                      selected
                        ? 'border-[var(--brand-500)] ring-2 ring-[var(--brand-500)]/30'
                        : 'border-[var(--line-1,#e5e7eb)] hover:border-[var(--brand-400)]'
                    }`}
                  >
                    <div
                      className="mb-3 h-16 overflow-hidden rounded-lg border"
                      style={{
                        background: pack.swatches.bg,
                        borderColor: pack.swatches.fg,
                      }}
                    >
                      <div className="flex h-full">
                        <div
                          className="w-1/3"
                          style={{ background: pack.swatches.accent }}
                        />
                        <div
                          className="w-2/3 p-2 text-[10px] font-semibold"
                          style={{ color: pack.swatches.fg }}
                        >
                          {pack.name}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">{pack.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-3)]">
                      {pack.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <form onSubmit={saveColors} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>رنگ اصلی</Label>
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>رنگ ثانویه</Label>
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
              <ImageField label="لوگو" value={logoUrl} onChange={setLogoUrl} />
              <Button type="submit">ذخیره ظاهر</Button>
            </form>
            {settings?.storefrontUrl ? (
              <p className="mt-3 text-xs text-[var(--text-3)]">
                ویترین:{' '}
                <a
                  className="text-[var(--brand-500)]"
                  href={String(settings.storefrontUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {String(settings.storefrontUrl)}
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <FormDialog
          open={bannerDialogOpen}
          onOpenChange={(open) =>
            open ? setBannerDialogOpen(true) : closeBannerDialog()
          }
          title="بنر جدید"
          size="lg"
        >
          <form onSubmit={addBanner} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>عنوان</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>زیرعنوان</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </div>
            <ImageField label="تصویر بنر" value={imageUrl} onChange={setImageUrl} />
            <div className="space-y-1.5">
              <Label>لینک</Label>
              <Input value={href} onChange={(e) => setHref(e.target.value)} />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">افزودن بنر</Button>
              <Button type="button" variant="outline" onClick={closeBannerDialog}>
                انصراف
              </Button>
            </div>
          </form>
        </FormDialog>

        <div className="space-y-2">
          {banners.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    {b.subtitle || '—'} · {b.active ? 'فعال' : 'غیرفعال'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    api
                      .deleteShopBanner(b.id)
                      .then(() => {
                        toastSuccess('بنر حذف شد');
                        return refresh();
                      })
                      .catch((e) => toastFromError(e))
                  }
                >
                  حذف
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
