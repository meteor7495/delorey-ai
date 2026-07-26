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
    getOrders: () =>
      request<
        Array<{
          orderNumber: string;
          status: string;
          trackingCode: string | null;
          syncedAt: string;
          verifyHintPhoneLast4: string;
        }>
      >(opts, '/orders'),
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
        message: {
          content: string;
          role?: string;
          citations?: Array<{ sku: string; title: string; price: number }>;
        };
        decision: string;
        aiState: string;
        ownership?: string;
      }>(opts, `/public/chat/sessions/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
        publicKey,
      }),
    listInbox: (ownership?: 'ai_owned' | 'human_owned') =>
      request<
        Array<{
          id: string;
          channel: string;
          ownership: string;
          escalationReason: string | null;
          escalatedAt: string | null;
          preview: string | null;
          messageCount: number;
          updatedAt: string;
        }>
      >(
        opts,
        `/inbox/conversations${ownership ? `?ownership=${ownership}` : ''}`,
      ),
    getInboxThread: (id: string) =>
      request<{
        conversation: {
          id: string;
          ownership: string;
          escalationReason: string | null;
          handoffPacket: {
            reasonLabel: string;
            lastMessages: Array<{ role: string; content: string }>;
            citations: Array<{ sku: string; title: string; price: number }>;
            intentSummary: string | null;
          } | null;
        };
        messages: Array<{
          id: string;
          role: string;
          content: string;
          createdAt: string;
        }>;
      }>(opts, `/inbox/conversations/${id}`),
    inboxTakeover: (id: string) =>
      request(opts, `/inbox/conversations/${id}/takeover`, {
        method: 'POST',
        body: '{}',
      }),
    inboxRelease: (id: string) =>
      request(opts, `/inbox/conversations/${id}/release`, {
        method: 'POST',
        body: '{}',
      }),
    inboxEscalate: (id: string, reason?: string) =>
      request(opts, `/inbox/conversations/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason ?? 'operator_manual' }),
      }),
    inboxReply: (id: string, text: string) =>
      request(opts, `/inbox/conversations/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    connectTelegram: (botToken: string) =>
      request<{
        id: string;
        status: string;
        botUsername: string | null;
        webhookUrl: string;
        webhookSecret: string;
        live: boolean;
        note: string;
      }>(opts, '/channels/telegram/connect', {
        method: 'POST',
        body: JSON.stringify({ botToken }),
      }),
    getTelegramChannel: () =>
      request<{
        connected: boolean;
        status?: string;
        botUsername?: string | null;
        webhookUrl?: string;
        id?: string;
        live?: boolean;
      }>(opts, '/channels/telegram'),
    simulateTelegram: (body: {
      text: string;
      chatId?: string;
      updateId?: number;
    }) =>
      request<{
        conversationId?: string;
        decision?: string;
        reply?: string;
        duplicate?: boolean;
      }>(opts, '/channels/telegram/simulate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    connectBale: (botToken: string) =>
      request<{
        id: string;
        status: string;
        botUsername: string | null;
        webhookUrl: string;
        webhookSecret: string;
        live: boolean;
        note: string;
      }>(opts, '/channels/bale/connect', {
        method: 'POST',
        body: JSON.stringify({ botToken }),
      }),
    getBaleChannel: () =>
      request<{
        connected: boolean;
        status?: string;
        botUsername?: string | null;
        webhookUrl?: string;
        id?: string;
        live?: boolean;
      }>(opts, '/channels/bale'),
    simulateBale: (body: {
      text: string;
      chatId?: string;
      updateId?: number;
    }) =>
      request<{
        conversationId?: string;
        decision?: string;
        reply?: string;
        duplicate?: boolean;
      }>(opts, '/channels/bale/simulate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listKnowledgeDocs: () =>
      request<
        Array<{
          id: string;
          docType: string;
          title: string;
          bodyText: string;
          sourceAttribution: string;
          status: string;
          updatedAt: string;
        }>
      >(opts, '/knowledge/docs'),
    getKnowledgeIndexStatus: () =>
      request<{
        total: number;
        active: number;
        indexing: number;
        failed: number;
        mode: string;
        note: string;
      }>(opts, '/knowledge/index-status'),
    createKnowledgeDoc: (body: {
      docType: 'faq' | 'policy_override';
      title: string;
      bodyText: string;
      sourceAttribution: string;
    }) =>
      request(opts, '/knowledge/docs', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateKnowledgeDoc: (
      id: string,
      body: Partial<{
        docType: 'faq' | 'policy_override';
        title: string;
        bodyText: string;
        sourceAttribution: string;
      }>,
    ) =>
      request(opts, `/knowledge/docs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteKnowledgeDoc: (id: string) =>
      request(opts, `/knowledge/docs/${id}`, { method: 'DELETE' }),
    analyticsSummary: (days = 7) =>
      request<{
        rangeDays: number;
        empty: boolean;
        conversations: {
          total: number;
          byChannel: Record<string, number>;
          volumeByDay: Record<string, number>;
          humanOwnedOpen: number;
        };
        audits: {
          total: number;
          decisionCounts: Record<string, number>;
          resolvedTurns: number;
          escalatedTurns: number;
          assistedActions: number;
        };
        rates: {
          resolutionProxy: number | null;
          escalationRate: number | null;
        };
        escalationReasons: Record<string, number>;
        syncHealth: string;
        syncLastAt: string | null;
        methodology: Record<string, string>;
        gapDecisionCounts: Record<string, number>;
      }>(opts, `/analytics/summary?days=${days}`),
    analyticsKnowledgeGaps: (days = 7) =>
      request<{
        empty: boolean;
        topics: Array<{
          text: string;
          decision: string;
          conversationId: string;
          at: string;
        }>;
        hrefKnowledge: string;
        note: string;
      }>(opts, `/analytics/knowledge-gaps?days=${days}`),
    listAuditTurns: (query: {
      days?: number;
      decision?: string;
      conversationId?: string;
      limit?: number;
      offset?: number;
    } = {}) => {
      const params = new URLSearchParams();
      if (query.days != null) params.set('days', String(query.days));
      if (query.decision) params.set('decision', query.decision);
      if (query.conversationId)
        params.set('conversationId', query.conversationId);
      if (query.limit != null) params.set('limit', String(query.limit));
      if (query.offset != null) params.set('offset', String(query.offset));
      const qs = params.toString();
      return request<{
        total: number;
        items: Array<{
          id: string;
          conversationId: string;
          decision: string;
          citations: unknown;
          createdAt: string;
        }>;
      }>(opts, `/audit/turns${qs ? `?${qs}` : ''}`);
    },
    getAuditTurn: (id: string) =>
      request<{
        id: string;
        conversationId: string;
        decision: string;
        citations: unknown;
        createdAt: string;
        conversation: {
          id: string;
          channel: string;
          ownership: string;
          escalationReason: string | null;
        } | null;
        recentMessages: Array<{
          role: string;
          content: string;
          createdAt: string;
        }>;
        note: string;
      }>(opts, `/audit/turns/${id}`),
  };
}

export type DeloreyApiClient = ReturnType<typeof createApiClient>;
