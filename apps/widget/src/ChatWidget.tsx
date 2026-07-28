import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createApiClient } from '@delorey/api-client';
import { aiStateLabel } from '@delorey/ui';

type ChatMsg = {
  role: 'shopper' | 'employee' | 'system';
  content: string;
};

type Props = {
  publicKey: string;
  apiBase?: string;
};

export function ChatWidget({ publicKey, apiBase }: Props) {
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBase ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
      }),
    [apiBase],
  );

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('کارمند فروش');
  const [aiState, setAiState] = useState('inactive');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    if (!open || conversationId || !publicKey.trim()) return;
    let cancelled = false;
    setBooting(true);
    setError(null);
    (async () => {
      try {
        const session = await api.createChatSession(publicKey.trim());
        if (cancelled) return;
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
        if (cancelled) return;
        setError(
          e instanceof Error
            ? e.message
            : 'نشست شروع نشد. کلید عمومی یا دامنه را بررسی کنید.',
        );
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, publicKey, api]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!conversationId || !text.trim() || busy) return;
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

  if (!publicKey.trim()) {
    return (
      <div className="drw-root" dir="rtl">
        <div className="drw-error-banner">کلید عمومی ویجت تنظیم نشده است.</div>
      </div>
    );
  }

  return (
    <div className="drw-root" dir="rtl">
      {open && (
        <div
          className="drw-panel"
          role="dialog"
          aria-label="گفتگو با فروشنده"
        >
          <div className="drw-header">
            <div>
              <strong>{employeeName}</strong>
              <div className="drw-muted">
                {booting || busy
                  ? 'در حال نوشتن…'
                  : aiStateLabel(aiState)}
              </div>
            </div>
            <button
              type="button"
              className="drw-icon-btn"
              aria-label="بستن"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="drw-messages">
            {messages.map((m, i) => (
              <div key={i} className={`drw-bubble drw-${m.role}`}>
                {m.content}
              </div>
            ))}
            {error && <div className="drw-error">{error}</div>}
          </div>
          <form className="drw-composer" onSubmit={send}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="پیام شما…"
              disabled={!conversationId || busy || booting}
              aria-label="پیام"
            />
            <button
              type="submit"
              disabled={!conversationId || busy || booting || !text.trim()}
            >
              ارسال
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="drw-launcher"
        aria-label={open ? 'بستن گفتگو' : 'باز کردن گفتگو'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'بستن' : 'گفتگو'}
      </button>
    </div>
  );
}
