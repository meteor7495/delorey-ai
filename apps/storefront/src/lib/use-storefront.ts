'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { StoreCategory, StoreSettings } from '@/themes/types';

export function useStoreSlug(params: Promise<{ storeSlug: string }>) {
  const [storeSlug, setStoreSlug] = useState('');
  useEffect(() => {
    params.then((p) => setStoreSlug(p.storeSlug));
  }, [params]);
  return storeSlug;
}

export function useStorefrontChrome(storeSlug: string) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [widget, setWidget] = useState<{
    publicKey: string;
    apiBase: string;
    widgetBase: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeSlug) return;
    api
      .storefrontHome(storeSlug)
      .then((home) => {
        setSettings(home.settings as StoreSettings);
        setCategories((home.categories as StoreCategory[]) ?? []);
        setWidget(
          (home.widget as {
            publicKey: string;
            apiBase: string;
            widgetBase: string;
          } | null) ?? null,
        );
      })
      .catch((e) => setError(String(e)));
  }, [storeSlug]);

  return { settings, categories, widget, error };
}
