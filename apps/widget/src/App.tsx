import { useState } from 'react';
import { ChatWidget } from './ChatWidget';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

/**
 * Local harness — paste public key from Workspace → کانال‌ها.
 * Production merchants use /embed.js on the storefront.
 */
export function App() {
  const [publicKey, setPublicKey] = useState('pk_live_');
  const [activeKey, setActiveKey] = useState('');

  return (
    <div className="page">
      <h1>ویجت گفتگو سِلوما</h1>
      <p className="muted">
        کلید عمومی را از فضای کاری → کانال‌ها کپی کنید. برای تست embed، اسکریپت
        کانال‌ها را در یک HTML محلی بگذارید.
      </p>
      <div className="composer" style={{ marginBottom: 12 }}>
        <input
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="کلید عمومی (pk_live_…)"
          dir="ltr"
          aria-label="کلید عمومی"
        />
        <button
          type="button"
          onClick={() => setActiveKey(publicKey.trim())}
        >
          نمایش ویجت
        </button>
      </div>
      {activeKey ? (
        <ChatWidget publicKey={activeKey} apiBase={API_BASE} />
      ) : (
        <p className="muted">پس از ورود کلید، «نمایش ویجت» را بزنید.</p>
      )}
    </div>
  );
}
