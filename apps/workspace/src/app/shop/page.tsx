'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, Package, Tags, ClipboardList } from 'lucide-react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ShopOverviewPage() {
  const [data, setData] = useState<{
    storefrontUrl: string;
    settings: { storeName?: string; storeSlug?: string };
    stats: {
      productCount: number;
      categoryCount: number;
      orderCount: number;
      pendingOrders: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .shopOverview()
      .then((d) =>
        setData({
          storefrontUrl: d.storefrontUrl,
          settings: d.settings as { storeName?: string; storeSlug?: string },
          stats: d.stats,
        }),
      )
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="فروشگاه بومی"
          description="ویترین عمومی فروشگاه شما — جدا از اتصال Shopify/Woo"
          actions={
            data?.storefrontUrl ? (
              <Button asChild variant="outline">
                <a href={data.storefrontUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="ms-1 h-4 w-4" />
                  مشاهده ویترین
                </a>
              </Button>
            ) : null
          }
        />

        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}

        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="محصولات بومی"
                value={String(data.stats.productCount)}
                icon={Package}
              />
              <StatCard
                title="دسته‌ها"
                value={String(data.stats.categoryCount)}
                icon={Tags}
              />
              <StatCard
                title="سفارش‌ها"
                value={String(data.stats.orderCount)}
                icon={ClipboardList}
              />
              <StatCard
                title="در انتظار"
                value={String(data.stats.pendingOrders)}
                icon={ClipboardList}
              />
            </div>

            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm text-[var(--text-3)]">
                  نام فروشگاه:{' '}
                  <span className="font-semibold text-[var(--text-1)]">
                    {String(data.settings.storeName ?? '—')}
                  </span>
                </p>
                <p className="text-sm text-[var(--text-3)]">
                  اسلاگ عمومی:{' '}
                  <code className="rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[var(--text-1)]">
                    {String(data.settings.storeSlug ?? '—')}
                  </code>
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm">
                    <Link href="/shop/products">مدیریت محصولات</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/categories">دسته‌ها</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/orders">سفارش‌ها</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/appearance">ظاهر و بنر</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/settings">تنظیمات</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
