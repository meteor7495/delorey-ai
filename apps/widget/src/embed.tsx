import { createRoot } from 'react-dom/client';
import { ChatWidget } from './ChatWidget';
import embedCss from './embed.css?inline';

declare global {
  interface Window {
    __SELOMA_EMBED__?: {
      publicKey: string;
      apiBase?: string;
    };
    /** @deprecated Prefer __SELOMA_EMBED__. Kept for already-published embed snippets. */
    __DELOREY_EMBED__?: {
      publicKey: string;
      apiBase?: string;
    };
  }
}

function resolveConfig() {
  const fromWindow = window.__SELOMA_EMBED__ ?? window.__DELOREY_EMBED__;
  if (fromWindow?.publicKey) return fromWindow;

  const nodes = document.querySelectorAll<HTMLScriptElement>(
    'script[src*="embed.js"]',
  );
  const el = nodes[nodes.length - 1];
  return {
    publicKey: el?.getAttribute('data-public-key') ?? '',
    apiBase: el?.getAttribute('data-api-base') ?? undefined,
  };
}

function ensureStyles() {
  if (
    document.getElementById('seloma-embed-css') ||
    document.getElementById('delorey-embed-css')
  ) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'seloma-embed-css';
  style.textContent = embedCss;
  document.head.appendChild(style);

  if (
    !document.querySelector(
      'link[data-seloma-font="vazirmatn"], link[data-delorey-font="vazirmatn"]',
    )
  ) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css';
    link.dataset.selomaFont = 'vazirmatn';
    document.head.appendChild(link);
  }
}

export function boot() {
  if (
    document.getElementById('seloma-widget-root') ||
    document.getElementById('delorey-widget-root')
  ) {
    return;
  }

  ensureStyles();
  const { publicKey, apiBase } = resolveConfig();
  const host = document.createElement('div');
  host.id = 'seloma-widget-root';
  document.body.appendChild(host);
  createRoot(host).render(
    <ChatWidget publicKey={publicKey} apiBase={apiBase} />,
  );
}

boot();
