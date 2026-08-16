'use client';

import Link from 'next/link';
import { StoreShell } from '@/components/StoreShell';
import { api } from '@/lib/api';
import { useStorefrontChrome } from '@/lib/use-storefront';
import { pageTitleClass, useStoreTheme } from '@/themes/theme-context';
import { useEffect, useState } from 'react';

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  publishedAt: string | null;
  tags: string[];
};

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; articleSlug: string }>;
}) {
  const [storeSlug, setStoreSlug] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const { settings, categories, error: chromeError } = useStorefrontChrome(storeSlug);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ storeSlug: slug, articleSlug: aslug }) => {
      setStoreSlug(slug);
      setArticleSlug(aslug);
    });
  }, [params]);

  useEffect(() => {
    if (!storeSlug || !articleSlug) return;
    api
      .storefrontArticle(storeSlug, articleSlug)
      .then(setArticle)
      .catch((e) => setError(String(e)));
  }, [storeSlug, articleSlug]);

  if (!settings) {
    return (
      <main className="dk-container py-20 text-center text-zh-600">
        {chromeError ?? error ?? 'در حال بارگذاری…'}
      </main>
    );
  }

  if (error || !article) {
    return (
      <StoreShell settings={settings} categories={categories}>
        <div className="dk-container py-20 text-center">
          <p className="text-zh-pink mb-4">{error ?? 'مقاله پیدا نشد'}</p>
          <Link href={`/s/${storeSlug}/articles`} className="text-zh-primary">
            بازگشت به مجله
          </Link>
        </div>
      </StoreShell>
    );
  }

  return (
    <StoreShell settings={settings} categories={categories}>
      <ArticleBody storeSlug={storeSlug} article={article} />
    </StoreShell>
  );
}

function ArticleBody({
  storeSlug,
  article,
}: {
  storeSlug: string;
  article: Article;
}) {
  const theme = useStoreTheme();
  return (
    <article className="dk-container py-8 lg:py-12 max-w-3xl ms-auto me-auto">
      <p className="text-[14px] text-zh-600 mb-3">
        <Link href={`/s/${storeSlug}/articles`}>مجله</Link>
        {' / '}
        {article.title}
      </p>
      <h1 className={`${pageTitleClass(theme)} leading-tight mb-4`}>
        {article.title}
      </h1>
      {article.excerpt ? (
        <p className="text-[16px] text-zh-600 leading-8 mb-6">{article.excerpt}</p>
      ) : null}
      {article.featuredImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.featuredImageUrl}
          alt=""
          className="w-full max-h-[420px] object-cover mb-8"
          style={{ borderRadius: 'var(--zh-radius)' }}
        />
      ) : null}
      <div className="text-[16px] leading-9 text-zh-800 whitespace-pre-line">
        {article.content}
      </div>
      {article.tags.length > 0 ? (
        <div className="mt-10 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span
              key={t}
              className="bg-zh-100 px-3 py-1 text-[13px] text-zh-700"
              style={{ borderRadius: 'var(--zh-radius)' }}
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
