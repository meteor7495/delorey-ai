'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/shared/AppShell';
import { api } from '@/shared/api';

export default function ChannelsPage() {
  const [channel, setChannel] = useState<{
    publicKey: string;
    snippet: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    api.getWebsiteChannel().then(setChannel).catch(console.error);
  }, []);

  return (
    <AppShell>
      <h1>کانال‌ها</h1>
      <p className="muted">Slice 01: وبسایت. تلگرام و بله در sliceهای بعد.</p>
      <div className="card">
        <h3>Website Chat</h3>
        <p>
          وضعیت: <strong>{channel?.status ?? '...'}</strong>
        </p>
        <p className="muted">Public key: {channel?.publicKey}</p>
        <p>Snippet نصب:</p>
        <pre className="snippet">{channel?.snippet}</pre>
        <p className="muted">
          برای تست سریع، ویجت را روی{' '}
          <a href="http://localhost:5173" target="_blank" rel="noreferrer">
            localhost:5173
          </a>{' '}
          باز کنید و public key را وارد کنید.
        </p>
      </div>
    </AppShell>
  );
}
