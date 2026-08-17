import { createApiClient } from '@seloma/api-client';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export const api = createApiClient({ baseUrl: API_BASE });

export function cartSessionKey(storeSlug: string) {
  return `seloma_cart_${storeSlug}`;
}

function legacyCartSessionKey(storeSlug: string) {
  return `delorey_cart_${storeSlug}`;
}

export function getCartSessionId(storeSlug: string): string {
  if (typeof window === 'undefined') return '';
  const key = cartSessionKey(storeSlug);
  let id =
    localStorage.getItem(key) ??
    localStorage.getItem(legacyCartSessionKey(storeSlug));
  if (!id) {
    id = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  }
  localStorage.setItem(key, id);
  return id;
}

export function setCartSessionId(storeSlug: string, sessionId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(cartSessionKey(storeSlug), sessionId);
}

export function formatIrr(n: number) {
  return `${n.toLocaleString('fa-IR')} ریال`;
}
