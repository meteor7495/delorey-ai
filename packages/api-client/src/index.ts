export type ApiClientOptions = {
  baseUrl: string;
  getToken?: () => string | null;
};

async function request<T>(
  opts: ApiClientOptions,
  path: string,
  init?: RequestInit & { publicKey?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  const token = opts.getToken?.();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.publicKey) headers.set('x-public-key', init.publicKey);

  const res = await fetch(`${opts.baseUrl}/v1${path}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function createApiClient(opts: ApiClientOptions) {
  return {
    signup: (body: { email: string; password: string; workspaceName: string }) =>
      request<{ token: string; tenant: { id: string; name: string } }>(opts, '/auth/signup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ token: string; tenant: { id: string; name: string } }>(opts, '/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    workspaceMe: () => request<Record<string, unknown>>(opts, '/workspace/me'),
    getEmployee: () => request<Record<string, unknown>>(opts, '/employee'),
    updateEmployee: (body: Record<string, unknown>) =>
      request(opts, '/employee', { method: 'PUT', body: JSON.stringify(body) }),
    getStore: () => request<Record<string, unknown>>(opts, '/store'),
    mockConnectStore: () =>
      request(opts, '/store/mock-connect', { method: 'POST', body: '{}' }),
    getProducts: () => request<unknown[]>(opts, '/catalog/products'),
    getWebsiteChannel: () =>
      request<{ publicKey: string; snippet: string; status: string }>(
        opts,
        '/channels/website',
      ),
    createChatSession: (publicKey: string) =>
      request<{ conversationId: string; employee: string; status: string }>(
        opts,
        '/public/chat/sessions',
        { method: 'POST', body: JSON.stringify({ publicKey }), publicKey },
      ),
    sendChatMessage: (publicKey: string, conversationId: string, text: string) =>
      request<{
        message: { content: string; citations?: Array<{ sku: string; title: string; price: number }> };
        decision: string;
        aiState: string;
      }>(opts, `/public/chat/sessions/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
        publicKey,
      }),
  };
}

export type DeloreyApiClient = ReturnType<typeof createApiClient>;
