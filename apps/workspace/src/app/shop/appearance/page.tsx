'use client';

import { toastSuccess, toastFromError } from '@/lib/notify';
import { FormEvent, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
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
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  async function refresh() {
    const [b, s] = await Promise.all([
      api.listShopBanners(),
      api.shopSettings(),
    ]);
    setBanners(b as unknown as Banner[]);
    setSettings(s);
    setPrimaryColor(String(s.primaryColor ?? '#ef4056'));
    setSecondaryColor(String(s.secondaryColor ?? '#0c0c0c'));
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
          description="رنگ‌ها و بنرهای صفحهٔ اول ویترین"
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
          <CardContent>
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label>لوگو (URL)</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
              </div>
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
            <div className="space-y-1.5">
              <Label>تصویر</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
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
