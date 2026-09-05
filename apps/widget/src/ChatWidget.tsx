import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createApiClient } from '@seloma/api-client';
import { aiStateLabel } from '@seloma/ui/tokens';

type ChatMsg = {
  id?: string;
  role: 'shopper' | 'employee' | 'system' | 'operator';
  content: string;
};

type ServerChatMessage = {
  id: string;
  role: string;
  content: string;
};

function welcomeMessage(employeeName: string): ChatMsg {
  return {
    role: 'employee',
    content: `سلام، من ${employeeName} هستم. درباره محصولات فروشگاه بپرسید.`,
  };
}

function mapServerRole(role: string): ChatMsg['role'] {
  if (
    role === 'shopper' ||
    role === 'system' ||
    role === 'operator' ||
    role === 'employee'
  ) {
    return role;
  }
  return 'employee';
}

function mergeThread(
  server: ServerChatMessage[],
  employeeName: string,
  pendingShopper: string | null,
): ChatMsg[] {
  const mapped: ChatMsg[] = server.map((m) => ({
    id: m.id,
    role: mapServerRole(m.role),
    content: m.content,
  }));
  if (
    pendingShopper &&
    !mapped.some((m) => m.role === 'shopper' && m.content === pendingShopper)
  ) {
    mapped.push({ role: 'shopper', content: pendingShopper });
  }
  if (mapped.length === 0) return [welcomeMessage(employeeName)];
  return mapped;
}

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
  return `seloma.widget.session.${publicKey.trim()}`;
}

function legacyStorageKey(publicKey: string) {
  return `delorey.widget.session.${publicKey.trim()}`;
}

function loadSession(publicKey: string): StoredSession | null {
  try {
    const raw =
      localStorage.getItem(storageKey(publicKey)) ??
      localStorage.getItem(legacyStorageKey(publicKey));
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
    localStorage.removeItem(legacyStorageKey(publicKey));
  } catch {
    /* quota / private mode */
  }
}

function clearSession(publicKey: string) {
  try {
    localStorage.removeItem(storageKey(publicKey));
    localStorage.removeItem(legacyStorageKey(publicKey));
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
  const [employeeName, setEmployeeName] = useState('دستیار هوشمند');
  const [aiState, setAiState] = useState('inactive');
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pendingShopperRef = useRef<string | null>(null);
  const employeeNameRef = useRef(employeeName);
  employeeNameRef.current = employeeName;

  const humanOwned =
    aiState === 'awaiting_human' || aiState === 'paused';

  const applyThread = useCallback(
    (server: ServerChatMessage[], nextAiState: string) => {
      setAiState(nextAiState);
      setMessages(
        mergeThread(
          server,
          employeeNameRef.current,
          pendingShopperRef.current,
        ),
      );
    },
    [],
  );

  const pullThread = useCallback(async () => {
    if (!conversationId || !publicKey.trim()) return;
    const res = await api.listChatMessages(publicKey.trim(), conversationId);
    const pending = pendingShopperRef.current;
    if (
      pending &&
      res.messages.some((m) => m.role === 'shopper' && m.content === pending)
    ) {
      pendingShopperRef.current = null;
    }
    applyThread(res.messages, res.aiState);
  }, [api, applyThread, conversationId, publicKey]);

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
        const welcome = welcomeMessage(session.employee);
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

  useEffect(() => {
    if (!open || !conversationId || !publicKey.trim()) return;
    let cancelled = false;
    const tick = async () => {
      try {
        await pullThread();
      } catch {
        if (cancelled) return;
      }
    };
    void tick();
    const intervalMs = humanOwned ? 2500 : 4000;
    const timer = window.setInterval(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, conversationId, publicKey, humanOwned, pullThread]);

  async function startFresh() {
    pendingShopperRef.current = null;
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
    pendingShopperRef.current = outgoing;
    setMessages((m) => [...m, { role: 'shopper', content: outgoing }]);
    setBusy(true);
    setError(null);
    try {
      await api.sendChatMessage(publicKey.trim(), conversationId, outgoing);
      await pullThread();
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
              <div key={m.id ?? `local-${i}`} className={`drw-bubble drw-${m.role}`}>
                {m.role === 'operator' && (
                  <div className="drw-author">همکار فروشگاه</div>
                )}
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
