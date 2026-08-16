'use client';

import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api } from '@/lib/api';
import { useStoreSlug, useStorefrontChrome } from '@/lib/use-storefront';
import { pageTitleClass, useStoreTheme } from '@/themes/theme-context';
import { useEffect, useState } from 'react';

type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  publishedAt: string | null;
};

export default function ArticlesPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const storeSlug = useStoreSlug(params);
  const { settings, categories, error: chromeError } = useStorefrontChrome(storeSlug);
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeSlug) return;
    api
      .storefrontArticles(storeSlug)
      .then(setArticles)
      .catch((e) => setError(String(e)));
  }, [storeSlug]);

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {chromeError ?? error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <ArticlesBody storeSlug={storeSlug} articles={articles} />
    </StoreShell>
  );
}

function ArticlesBody({
  storeSlug,
  articles,
}: {
  storeSlug: string;
  articles: ArticleCard[];
}) {
  const theme = useStoreTheme();
  const grid =
    theme === 'noir'
      ? 'grid grid-cols-1 gap-10 max-w-3xl mx-auto'
      : theme === 'regal'
        ? 'grid grid-cols-1 md:grid-cols-2 gap-10'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className="dk-container py-8 lg:py-12">
      <p className="text-[14px] text-zh-600 mb-2">مجله</p>
      <h1 className={`${pageTitleClass(theme)} mb-8`}>مجله فروشگاه</h1>
      {articles.length === 0 ? (
        <p className="py-16 text-center text-zh-600">هنوز مقاله‌ای منتشر نشده است.</p>
      ) : (
        <div className={grid}>
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/s/${storeSlug}/articles/${a.slug}`}
              className="overflow-hidden border border-zh-100 bg-zh-surface hover:shadow-dk-card"
              style={{ borderRadius: 'var(--zh-radius)' }}
            >
              {a.featuredImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.featuredImageUrl}
                  alt=""
                  className={theme === 'noir' ? 'h-72 w-full object-cover' : 'h-48 w-full object-cover'}
                />
              ) : (
                <div className="h-48 bg-zh-100" />
              )}
              <div className="p-5 space-y-2 text-right">
                <h2 className="text-[18px] text-zh-ink leading-8">{a.title}</h2>
                {a.excerpt ? (
                  <p className="text-[14px] text-zh-600 leading-7">{a.excerpt}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
