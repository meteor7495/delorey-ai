'use client';

import { toastFromError } from '@/lib/notify';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ExternalLink,
  Package,
  Tags,
  ClipboardList,
  Boxes,
  AlertTriangle,
  Percent,
  FileText,
} from 'lucide-react';
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
      variantCount: number;
      attributeCount: number;
      activeDiscounts: number;
      publishedArticles: number;
      lowStock: number;
      outOfStock: number;
      inventoryValue: number;
    };
  } | null>(null);

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
      .catch((e) => toastFromError(e));
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="فروشگاه بومی"
          description="ویترین عمومی فروشگاه شما روی پلتفرم DeloRey"
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


        {data && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="محصولات بومی"
                value={String(data.stats.productCount)}
                description={`${data.stats.variantCount} تنوع · ${data.stats.attributeCount} ویژگی`}
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
                description={`${data.stats.pendingOrders} در انتظار`}
                icon={ClipboardList}
              />
              <StatCard
                title="ارزش انبار"
                value={data.stats.inventoryValue.toLocaleString('fa-IR')}
                icon={Boxes}
              />
              <StatCard
                title="رو به اتمام"
                value={String(data.stats.lowStock)}
                description={`${data.stats.outOfStock} ناموجود`}
                icon={AlertTriangle}
              />
              <StatCard
                title="تخفیف‌های فعال"
                value={String(data.stats.activeDiscounts)}
                icon={Percent}
              />
              <StatCard
                title="مقالات منتشرشده"
                value={String(data.stats.publishedArticles)}
                icon={FileText}
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
                    <Link href="/shop/attributes">ویژگی‌ها</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/inventory">موجودی</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/discounts">تخفیف‌ها</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/shop/articles">مقالات</Link>
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
