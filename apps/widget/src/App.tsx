import { FormEvent, useMemo, useState } from 'react';
import { createApiClient } from '@delorey/api-client';
import { aiStateLabel } from '@delorey/ui';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

type ChatMsg = {
  role: 'shopper' | 'employee';
  content: string;
};

export function App() {
  const api = useMemo(() => createApiClient({ baseUrl: API_BASE }), []);
  const [publicKey, setPublicKey] = useState('pk_live_');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('کارمند فروش');
  const [aiState, setAiState] = useState('inactive');
  const [text, setText] = useState('پیراهن لینن موجوده؟ قیمتش چنده؟');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function startSession() {
    setBusy(true);
    setError(null);
    try {
      const session = await api.createChatSession(publicKey.trim());
      setConversationId(session.conversationId);
      setEmployeeName(session.employee);
      setAiState(session.status);
      setMessages([
        {
          role: 'employee',
          content: `سلام، من ${session.employee} هستم. درباره محصولات فروشگاه بپرسید.`,
        },
      ]);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'نشست شروع نشد. کلید عمومی را بررسی کنید و دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!conversationId || !text.trim()) return;
    const outgoing = text.trim();
    setText('');
    setMessages((m) => [...m, { role: 'shopper', content: outgoing }]);
    setBusy(true);
    setError(null);
    try {
      const res = await api.sendChatMessage(
        publicKey.trim(),
        conversationId,
        outgoing,
      );
      setAiState(res.aiState);
      setMessages((m) => [
        ...m,
        { role: 'employee', content: res.message.content },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'الان گفتگو در دسترس نیست. کمی بعد دوباره تلاش کنید.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <h1>ویجت گفتگو DeloRey</h1>
      <p className="muted">
        کلید عمومی را از فضای کاری → کانال‌ها کپی کنید. پس از ورود، معمولاً با{' '}
        <code dir="ltr">pk_live_</code> + ۸ کاراکتر اول tenant ساخته می‌شود؛ از
        صفحهٔ کانال‌ها دقیق بردارید.
      </p>
      <div className="composer" style={{ marginBottom: 12 }}>
        <input
          value={publicKey}
          onChange={(e) => setPublicKey(e.target.value)}
          placeholder="کلید عمومی (pk_live_…)"
          dir="ltr"
          aria-label="کلید عمومی"
        />
        <button type="button" onClick={startSession} disabled={busy}>
          {busy && !conversationId ? 'در حال اتصال…' : 'شروع گفتگو'}
        </button>
      </div>
      {error && <p style={{ color: '#f97066' }}>{error}</p>}
      <div className="panel">
        <div className="header">
          <strong>{employeeName}</strong>
          <span className="muted">
            {busy ? 'در حال نوشتن…' : aiStateLabel(aiState)}
          </span>
        </div>
        <div className="messages">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.content}
            </div>
          ))}
        </div>
        <form className="composer" onSubmit={send}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="پیام شما…"
            disabled={!conversationId || busy}
            aria-label="پیام"
          />
          <button type="submit" disabled={!conversationId || busy}>
            ارسال
          </button>
        </form>
      </div>
    </div>
  );
}
