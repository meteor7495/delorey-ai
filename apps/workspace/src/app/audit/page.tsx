import { Suspense } from 'react';
import AuditClient from './AuditClient';

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="main">در حال بارگذاری ممیزی…</div>}>
      <AuditClient />
    </Suspense>
  );
}
