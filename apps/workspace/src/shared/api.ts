'use client';

import { createApiClient } from '@delorey/api-client';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('delorey_token');
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('delorey_token', token);
  else localStorage.removeItem('delorey_token');
}

export const api = createApiClient({
  baseUrl: API_BASE,
  getToken,
});
