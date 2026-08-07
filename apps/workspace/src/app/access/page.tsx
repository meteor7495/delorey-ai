'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/shared/api';

function AccessInner() {
  const search = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = search.get('token');
    if (token) {
      setToken(token);
      router.replace('/home');
      return;
    }
    router.replace('/login');
  }, [search, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center text-sm text-[var(--text-3)]">
      در حال ورود به فضای کاری…
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center text-sm">
          …
        </div>
      }
    >
      <AccessInner />
    </Suspense>
  );
}
