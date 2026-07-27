import { Suspense } from 'react';
import StoreClient from './StoreClient';

export default function StorePage() {
  return (
    <Suspense fallback={<div className="main">در حال بارگذاری فروشگاه…</div>}>
      <StoreClient />
    </Suspense>
  );
}
