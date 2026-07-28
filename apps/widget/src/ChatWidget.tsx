import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createApiClient } from '@delorey/api-client';
import { aiStateLabel } from '@delorey/ui/tokens';

type ChatMsg = {
  role: 'shopper' | 'employee' | 'system' | 'operator';
  content: string;
};

type StoredSession = {
  conversationId: string;
  employeeName: string;
  aiState: string;
  messages: ChatMsg[];
};

type Props = {
  publicKey: string;
  apiBase?: string;
  /** When false, panel opens immediately (dev harness). Default: launcher. */
  launcher?: boolean;
};

function storageKey(publicKey: string) {
  return `delorey.widget.session.${publicKey.trim()}`;
}

function loadSession(publicKey: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(storageKey(publicKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.conversationId || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(publicKey: string, session: StoredSession) {
  try {
    localStorage.setItem(storageKey(publicKey), JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

function clearSession(publicKey: string) {
  try {
    localStorage.removeItem(storageKey(publicKey));
  } catch {
    /* ignore */
  }
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : '';
  if (/403/.test(msg) && /[Oo]rigin/.test(msg)) {
    return 'این دامنه برای ویجت مجاز نیست. فروشگاه باید دامنه را در کانال‌ها اضافه کند.';
  }
  if (/403/.test(msg) && /[Tt]oo many/.test(msg)) {
    return 'تعداد درخواست‌ها زیاد بود. کمی صبر کنید و دوباره بفرستید.';
  }
  if (/404/.test(msg)) {
    return 'کلید عمومی پیدا نشد. از فضای کاری → کانال‌ها کپی کنید.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'الان گفتگو در دسترس نیست. کمی بعد دوباره تلاش کنید.';
}

export function ChatWidget({
  publicKey,
  apiBase,
  launcher = true,
}: Props) {
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl:
          apiBase ??
          import.meta.env.VITE_API_BASE_URL ??
          'http://localhost:3001',
      }),
    [apiBase],
  );

  const [open, setOpen] = useState(!launcher);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('کارمند فروش');
  const [aiState, setAiState] = useState('inactive');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const humanOwned =
    aiState === 'awaiting_human' || aiState === 'paused';

  useEffect(() => {
    if (!open || !publicKey.trim()) return;
    if (conversationId) return;

    const stored = loadSession(publicKey);
    if (stored) {
      setConversationId(stored.conversationId);
      setEmployeeName(stored.employeeName);
      setAiState(stored.aiState);
      setMessages(stored.messages);
      return;
    }

    let cancelled = false;
    setBooting(true);
    setError(null);
    (async () => {
      try {
        const session = await api.createChatSession(publicKey.trim());
        if (cancelled) return;
        const welcome: ChatMsg = {
          role: 'employee',
          content: `سلام، من ${session.employee} هستم. درباره محصولات فروشگاه بپرسید.`,
        };
        setConversationId(session.conversationId);
        setEmployeeName(session.employee);
        setAiState(session.status);
        setMessages([welcome]);
        saveSession(publicKey, {
          conversationId: session.conversationId,
          employeeName: session.employee,
          aiState: session.status,
          messages: [welcome],
        });
      } catch (e) {
        if (cancelled) return;
        setError(friendlyError(e));
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

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, error, open]);

  useEffect(() => {
    if (!conversationId || !publicKey.trim()) return;
    saveSession(publicKey, {
      conversationId,
      employeeName,
      aiState,
      messages,
    });
  }, [publicKey, conversationId, employeeName, aiState, messages]);

  async function startFresh() {
    clearSession(publicKey);
    setConversationId(null);
    setMessages([]);
    setAiState('inactive');
    setError(null);
  }

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
      const role =
        res.message.role === 'system' || res.message.role === 'operator'
          ? (res.message.role as ChatMsg['role'])
          : res.ownership === 'human_owned' && res.aiState === 'awaiting_human'
            ? 'system'
            : 'employee';
      setMessages((m) => [
        ...m,
        { role, content: res.message.content },
      ]);
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      if (/404|tenant mismatch|Conversation/i.test(String(err))) {
        await startFresh();
      }
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
          aria-modal="true"
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

          {humanOwned && (
            <div className="drw-handoff" role="status">
              گفتگو به همکار انسانی وصل شد. می‌توانید پیام بگذارید؛ پاسخ از طرف
              فروشگاه می‌آید.
            </div>
          )}

          <div className="drw-messages" ref={listRef}>
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
              placeholder={
                humanOwned ? 'یادداشت برای همکار…' : 'پیام شما…'
              }
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
      {launcher && (
        <button
          type="button"
          className="drw-launcher"
          aria-label={open ? 'بستن گفتگو' : 'باز کردن گفتگو'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'بستن' : 'گفتگو'}
        </button>
      )}
    </div>
  );
}
