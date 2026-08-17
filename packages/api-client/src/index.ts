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
  if (init?.body) headers.set('Content-Type', 'application/json');
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

// ── Commerce Core types ──────────────────────────────────────────────
// Shared between the workspace UI and any other consumer so nobody has to
// re-derive the shapes the API already guarantees.

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export type Paginated<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type ShopCategory = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  active: boolean;
  productCount?: number;
};

export type ProductStockSummary = {
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  tracked: boolean;
};

export type ShopProduct = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  inStock: boolean;
  description: string | null;
  images: string[];
  categoryId: string | null;
  status: string;
  source: string;
  shortDescription: string | null;
  brand: string | null;
  costPrice: number | null;
  barcode: string | null;
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  hasVariants: boolean;
  variantCount?: number;
  stock?: ProductStockSummary;
  inventoryLevelId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AttributeValue = {
  id: string;
  attributeId: string;
  value: string;
  label: string | null;
  colorHex: string | null;
  sortOrder: number;
};

export type Attribute = {
  id: string;
  name: string;
  slug: string;
  type: string;
  displayType: string;
  sortOrder: number;
  active: boolean;
  required: boolean;
  values: AttributeValue[];
};

export type VariantOption = {
  attributeId: string;
  attributeName: string;
  attributeValueId: string;
  value: string;
  label: string | null;
  colorHex?: string | null;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  optionsKey: string;
  price: number | null;
  effectivePrice: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  currency: string;
  weightGrams: number | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  options: VariantOption[];
  inventory: {
    id: string;
    onHand: number;
    reserved: number;
    available: number;
    lowStockThreshold: number;
    state: StockState;
  } | null;
};

export type InventoryLevel = {
  id: string;
  productId: string;
  variantId: string | null;
  productTitle: string | null;
  categoryId: string | null;
  sku: string | null;
  options: VariantOption[];
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  state: StockState;
  costPrice: number | null;
};

export type InventoryTransaction = {
  id: string;
  inventoryLevelId: string;
  type: string;
  quantityDelta: number;
  resultingOnHand: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  actorUserId: string | null;
  createdAt: string;
  productId: string;
  variantId: string | null;
  productTitle: string | null;
  sku: string | null;
};

export type InventorySummary = {
  productCount: number;
  variantCount: number;
  trackedCount: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
};

export type DiscountTarget = {
  id: string;
  targetType: string;
  targetId: string | null;
};

export type Discount = {
  id: string;
  name: string;
  code: string | null;
  type: 'percentage' | 'fixed';
  value: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  minCartAmount: number | null;
  maxDiscountAmount: number | null;
  priority: number;
  stackable: boolean;
  targets: DiscountTarget[];
  createdAt: string;
  updatedAt: string;
};

export type DiscountQuote = {
  productId: string | null;
  variantId: string | null;
  quantity: number;
  currency: string;
  unitPrice: number | null;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
  appliedDiscounts: Array<{
    id: string;
    name: string;
    code: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    amount: number;
  }>;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  featuredImageUrl: string | null;
  categoryId: string | null;
  tags: string[];
  status: string;
  authorUserId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShopProductFilters = {
  source?: string;
  q?: string;
  status?: string;
  categoryId?: string;
  stock?: string;
  hasVariants?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
};

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
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
    getEmployee: () =>
      request<{
        id: string;
        name: string;
        tone: string;
        language: string;
        status: string;
        skills: Record<string, boolean>;
        guardrails: {
          blockedTopics: string[];
          discountCapPercent: number;
          restrictedMutations: { refund: boolean; cancel: boolean };
          escalationRules: {
            onBlockedTopic: boolean;
            onCustomerRequest: boolean;
            onDiscountAboveCap: boolean;
          };
        };
      }>(opts, '/employee'),
    updateEmployee: (body: Record<string, unknown>) =>
      request(opts, '/employee', { method: 'PUT', body: JSON.stringify(body) }),
    updateEmployeeGuardrails: (body: {
      blockedTopics?: string[];
      discountCapPercent?: number;
      escalationRules?: {
        onBlockedTopic?: boolean;
        onCustomerRequest?: boolean;
        onDiscountAboveCap?: boolean;
      };
    }) =>
      request(opts, '/employee/guardrails', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    getStore: () => request<Record<string, unknown>>(opts, '/store'),
    mockConnectStore: () =>
      request(opts, '/store/mock-connect', { method: 'POST', body: '{}' }),
    getShopifyStatus: () =>
      request<{
        oauthReady: boolean;
        webhooksReady: boolean;
        scopes: string;
      }>(opts, '/store/shopify/status'),
    connectShopify: (body: { shopDomain: string; accessToken: string }) =>
      request<Record<string, unknown>>(opts, '/store/shopify/connect', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    startShopifyOAuth: (body: { shopDomain: string }) =>
      request<{ authorizeUrl: string }>(opts, '/store/shopify/oauth/start', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    connectWooCommerce: (body: {
      siteUrl: string;
      consumerKey: string;
      consumerSecret: string;
    }) =>
      request<Record<string, unknown>>(opts, '/store/woocommerce/connect', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    syncStore: () =>
      request<Record<string, unknown>>(opts, '/store/sync', {
        method: 'POST',
        body: '{}',
      }),
    registerStoreWebhooks: () =>
      request<{
        webhookUrl: string;
        results: Array<{ topic: string; id: number | null; error?: string }>;
      } | null>(opts, '/store/webhooks/register', {
        method: 'POST',
        body: '{}',
      }),
    /** @deprecated use registerStoreWebhooks */
    registerShopifyWebhooks: () =>
      request<{
        webhookUrl: string;
        results: Array<{ topic: string; id: number | null; error?: string }>;
      } | null>(opts, '/store/webhooks/register', {
        method: 'POST',
        body: '{}',
      }),
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
      request<{
        publicKey: string;
        snippet: string;
        status: string;
        allowedOrigins: string[];
        widgetBase?: string;
        apiBase?: string;
      }>(opts, '/channels/website'),
    updateWebsiteOrigins: (origins: string[]) =>
      request<{
        publicKey: string;
        snippet: string;
        status: string;
        allowedOrigins: string[];
      }>(opts, '/channels/website/origins', {
        method: 'PUT',
        body: JSON.stringify({ origins }),
      }),
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
    listChatMessages: (publicKey: string, conversationId: string) =>
      request<{
        messages: Array<{
          id: string;
          role: string;
          content: string;
          createdAt: string;
        }>;
        aiState: string;
        ownership: string;
      }>(opts, `/public/chat/sessions/${conversationId}/messages`, {
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
        context?: {
          shoppingState: string;
          customer: {
            id: string;
            name: string;
            phone: string;
            address: string | null;
          } | null;
          cart: {
            itemCount: number;
            items: Array<{ title: string; quantity: number }>;
          } | null;
          orders: Array<{
            id: string;
            orderNumber: string;
            status: string;
            paymentStatus: string;
            totalAmount: number;
            currency: string;
            createdAt: string;
          }>;
        };
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
    connectInstagram: (pageLabel?: string) =>
      request<{
        id: string;
        status: string;
        botUsername: string | null;
        webhookUrl: string;
        webhookSecret: string;
        live: boolean;
        note: string;
      }>(opts, '/channels/instagram/connect', {
        method: 'POST',
        body: JSON.stringify({ pageLabel }),
      }),
    getInstagramChannel: () =>
      request<{
        connected: boolean;
        status?: string;
        botUsername?: string | null;
        webhookUrl?: string;
        id?: string;
        live?: boolean;
      }>(opts, '/channels/instagram'),
    simulateInstagram: (body: { text: string; threadId?: string }) =>
      request<{
        conversationId?: string;
        decision?: string;
        reply?: string;
        duplicate?: boolean;
      }>(opts, '/channels/instagram/simulate', {
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
    analyticsRevenue: (days = 7) =>
      request<{
        rangeDays: number;
        since: string;
        empty: boolean;
        skills: {
          recommendVolume: number;
          orderLookupVolume: number;
          assistedActions: number;
          assistedConversations: number;
        };
        store: {
          orderCount: number;
          gmv: number;
          currency: string;
          note: string;
        };
        channels: {
          website: { orderCount: number; gmv: number };
          telegram: { orderCount: number; gmv: number };
          bale: { orderCount: number; gmv: number };
          instagram: { orderCount: number; gmv: number };
        };
        linkage: {
          conversationToOrderLinked: number;
          available: boolean;
          note: string;
        };
        usage: {
          auditTurnCount: number;
          costMode: string;
          note: string;
        };
        claims: {
          causalLiftShown: boolean;
          causalLiftPercent: number | null;
        };
        methodology: Record<string, string>;
      }>(opts, `/analytics/revenue?days=${days}`),
    analyticsChannels: (days = 7) =>
      request<{
        orders: Array<{ channel: string; orderCount: number; revenue: number }>;
        events: Array<{ channel: string | null; name: string; count: number }>;
      }>(opts, `/analytics/channels?days=${days}`),
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
    listAdminAudits: (query: {
      days?: number;
      action?: string;
      limit?: number;
      offset?: number;
    } = {}) => {
      const params = new URLSearchParams();
      if (query.days != null) params.set('days', String(query.days));
      if (query.action) params.set('action', query.action);
      if (query.limit != null) params.set('limit', String(query.limit));
      if (query.offset != null) params.set('offset', String(query.offset));
      const qs = params.toString();
      return request<{
        total: number;
        items: Array<{
          id: string;
          actorUserId: string;
          action: string;
          summary: string;
          payload: Record<string, unknown> | null;
          createdAt: string;
        }>;
      }>(opts, `/audit/admin${qs ? `?${qs}` : ''}`);
    },
    getAdminAudit: (id: string) =>
      request<{
        id: string;
        actorUserId: string;
        action: string;
        summary: string;
        payload: Record<string, unknown> | null;
        createdAt: string;
      }>(opts, `/audit/admin/${id}`),

    // ── Native shop CMS ──────────────────────────────────────────────
    shopOverview: () =>
      request<{
        settings: Record<string, unknown>;
        storefrontUrl: string;
        stats: {
          productCount: number;
          categoryCount: number;
          orderCount: number;
          pendingOrders: number;
          variantCount: number;
          attributeCount: number;
          activeDiscounts: number;
          publishedArticles: number;
          lowStock: number;
          outOfStock: number;
          inventoryValue: number;
        };
      }>(opts, '/shop/overview'),
    shopSettings: () =>
      request<Record<string, unknown>>(opts, '/shop/settings'),
    uploadImage: async (file: File) => {
      const headers = new Headers();
      const token = opts.getToken?.();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${opts.baseUrl}/v1/uploads`, {
        method: 'POST',
        headers,
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${text}`);
      }
      return res.json() as Promise<{ url: string; filename: string }>;
    },
    listShopThemes: () =>
      request<
        Array<{
          id: string;
          name: string;
          description: string;
          layout: string;
          defaults: { primaryColor: string; secondaryColor: string };
          swatches: { bg: string; fg: string; accent: string };
        }>
      >(opts, '/shop/themes'),
    updateShopSettings: (body: Record<string, unknown>) =>
      request<Record<string, unknown>>(opts, '/shop/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    listShopCategories: () =>
      request<ShopCategory[]>(opts, '/shop/categories'),
    createShopCategory: (body: Record<string, unknown>) =>
      request(opts, '/shop/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopCategory: (id: string, body: Record<string, unknown>) =>
      request(opts, `/shop/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopCategory: (id: string) =>
      request(opts, `/shop/categories/${id}`, { method: 'DELETE' }),
    listShopProducts: (filters: ShopProductFilters = {}) =>
      request<Paginated<ShopProduct>>(
        opts,
        `/shop/products${toQuery(filters as Record<string, unknown>)}`,
      ),
    getShopProduct: (id: string) =>
      request<ShopProduct>(opts, `/shop/products/${id}`),
    createShopProduct: (body: Record<string, unknown>) =>
      request<ShopProduct>(opts, '/shop/products', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopProduct: (id: string, body: Record<string, unknown>) =>
      request<ShopProduct>(opts, `/shop/products/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopProduct: (id: string) =>
      request(opts, `/shop/products/${id}`, { method: 'DELETE' }),
    bulkShopProducts: (body: {
      ids: string[];
      action: 'publish' | 'draft' | 'delete' | 'category';
      categoryId?: string | null;
    }) =>
      request<{ affected: number; action: string }>(opts, '/shop/products/bulk', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // ── Attributes ───────────────────────────────────────────────────
    listShopAttributes: (activeOnly?: boolean) =>
      request<Attribute[]>(
        opts,
        `/shop/attributes${activeOnly ? '?active=true' : ''}`,
      ),
    getShopAttribute: (id: string) =>
      request<Attribute>(opts, `/shop/attributes/${id}`),
    createShopAttribute: (body: Record<string, unknown>) =>
      request<Attribute>(opts, '/shop/attributes', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopAttribute: (id: string, body: Record<string, unknown>) =>
      request<Attribute>(opts, `/shop/attributes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopAttribute: (id: string) =>
      request(opts, `/shop/attributes/${id}`, { method: 'DELETE' }),
    addShopAttributeValue: (
      attributeId: string,
      body: Record<string, unknown>,
    ) =>
      request<Attribute>(opts, `/shop/attributes/${attributeId}/values`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopAttributeValue: (
      valueId: string,
      body: Record<string, unknown>,
    ) =>
      request<Attribute>(opts, `/shop/attribute-values/${valueId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopAttributeValue: (valueId: string) =>
      request<Attribute>(opts, `/shop/attribute-values/${valueId}`, {
        method: 'DELETE',
      }),
    listProductAttributes: (productId: string) =>
      request<Array<{ id: string; sortOrder: number; attribute: Attribute }>>(
        opts,
        `/shop/products/${productId}/attributes`,
      ),
    setProductAttributes: (productId: string, attributeIds: string[]) =>
      request<Array<{ id: string; sortOrder: number; attribute: Attribute }>>(
        opts,
        `/shop/products/${productId}/attributes`,
        { method: 'PUT', body: JSON.stringify({ attributeIds }) },
      ),

    // ── Variants ─────────────────────────────────────────────────────
    listProductVariants: (productId: string) =>
      request<ProductVariant[]>(opts, `/shop/products/${productId}/variants`),
    generateProductVariants: (
      productId: string,
      body: {
        selections: Array<{ attributeId: string; valueIds: string[] }>;
        removeMissing?: boolean;
      },
    ) =>
      request<{
        created: number;
        removed: number;
        unchanged: number;
        variants: ProductVariant[];
      }>(opts, `/shop/products/${productId}/variants/generate`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    createProductVariant: (productId: string, body: Record<string, unknown>) =>
      request<ProductVariant>(opts, `/shop/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    bulkUpdateProductVariants: (
      productId: string,
      variants: Array<Record<string, unknown> & { id: string }>,
    ) =>
      request<ProductVariant[]>(
        opts,
        `/shop/products/${productId}/variants/bulk`,
        { method: 'PATCH', body: JSON.stringify({ variants }) },
      ),
    getProductVariant: (variantId: string) =>
      request<ProductVariant>(opts, `/shop/variants/${variantId}`),
    updateProductVariant: (variantId: string, body: Record<string, unknown>) =>
      request<ProductVariant>(opts, `/shop/variants/${variantId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteProductVariant: (variantId: string) =>
      request(opts, `/shop/variants/${variantId}`, { method: 'DELETE' }),

    // ── Inventory ────────────────────────────────────────────────────
    shopInventorySummary: () =>
      request<InventorySummary>(opts, '/shop/inventory/summary'),
    listShopInventory: (
      filters: {
        q?: string;
        categoryId?: string;
        productId?: string;
        state?: string;
        limit?: number;
        offset?: number;
      } = {},
    ) =>
      request<Paginated<InventoryLevel>>(
        opts,
        `/shop/inventory${toQuery(filters)}`,
      ),
    listShopInventoryTransactions: (
      filters: {
        inventoryLevelId?: string;
        productId?: string;
        variantId?: string;
        limit?: number;
        offset?: number;
      } = {},
    ) =>
      request<Paginated<InventoryTransaction>>(
        opts,
        `/shop/inventory/transactions${toQuery(filters)}`,
      ),
    adjustShopInventory: (body: {
      inventoryLevelId?: string;
      productId?: string;
      variantId?: string;
      delta?: number;
      setTo?: number;
      type?: string;
      reason?: string | null;
      referenceType?: string | null;
      referenceId?: string | null;
      lowStockThreshold?: number;
    }) =>
      request<InventoryLevel>(opts, '/shop/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    setShopInventoryThreshold: (id: string, lowStockThreshold: number) =>
      request<InventoryLevel>(opts, `/shop/inventory/${id}/threshold`, {
        method: 'PATCH',
        body: JSON.stringify({ lowStockThreshold }),
      }),

    // ── Discounts ────────────────────────────────────────────────────
    listShopDiscounts: () => request<Discount[]>(opts, '/shop/discounts'),
    getShopDiscount: (id: string) =>
      request<Discount>(opts, `/shop/discounts/${id}`),
    createShopDiscount: (body: Record<string, unknown>) =>
      request<Discount>(opts, '/shop/discounts', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopDiscount: (id: string, body: Record<string, unknown>) =>
      request<Discount>(opts, `/shop/discounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopDiscount: (id: string) =>
      request(opts, `/shop/discounts/${id}`, { method: 'DELETE' }),
    validateShopDiscountCode: (code: string, subtotal?: number) =>
      request<{
        valid: boolean;
        reason: string | null;
        discount: Discount | null;
      }>(opts, '/shop/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal }),
      }),
    quoteShopDiscount: (body: {
      productId?: string;
      variantId?: string;
      quantity?: number;
      code?: string | null;
      subtotal?: number;
    }) =>
      request<DiscountQuote>(opts, '/shop/discounts/quote', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    // ── Articles ─────────────────────────────────────────────────────
    listShopArticles: (
      filters: {
        q?: string;
        status?: string;
        categoryId?: string;
        limit?: number;
        offset?: number;
      } = {},
    ) => request<Paginated<Article>>(opts, `/shop/articles${toQuery(filters)}`),
    getShopArticle: (id: string) =>
      request<Article>(opts, `/shop/articles/${id}`),
    createShopArticle: (body: Record<string, unknown>) =>
      request<Article>(opts, '/shop/articles', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopArticle: (id: string, body: Record<string, unknown>) =>
      request<Article>(opts, `/shop/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    publishShopArticle: (id: string) =>
      request<Article>(opts, `/shop/articles/${id}/publish`, {
        method: 'POST',
      }),
    unpublishShopArticle: (id: string) =>
      request<Article>(opts, `/shop/articles/${id}/unpublish`, {
        method: 'POST',
      }),
    deleteShopArticle: (id: string) =>
      request(opts, `/shop/articles/${id}`, { method: 'DELETE' }),
    listShopBanners: () =>
      request<Array<Record<string, unknown>>>(opts, '/shop/banners'),
    createShopBanner: (body: Record<string, unknown>) =>
      request(opts, '/shop/banners', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateShopBanner: (id: string, body: Record<string, unknown>) =>
      request(opts, `/shop/banners/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    deleteShopBanner: (id: string) =>
      request(opts, `/shop/banners/${id}`, { method: 'DELETE' }),
    listShopCustomers: (q?: string) =>
      request<Array<Record<string, unknown>>>(
        opts,
        `/shop/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      ),
    getShopCustomer: (id: string) =>
      request<Record<string, unknown>>(opts, `/shop/customers/${id}`),
    listShopOrders: () =>
      request<Array<Record<string, unknown>>>(opts, '/shop/orders'),
    getShopOrder: (id: string) =>
      request<Record<string, unknown>>(opts, `/shop/orders/${id}`),
    updateShopOrderStatus: (id: string, status: string) =>
      request(opts, `/shop/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    approveShopOrder: (id: string) =>
      request(opts, `/shop/orders/${id}/approve`, { method: 'POST' }),
    rejectShopOrder: (id: string, reason: string) =>
      request(opts, `/shop/orders/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),

    // ── Public storefront ────────────────────────────────────────────
    storefrontHome: (storeSlug: string) =>
      request<Record<string, unknown>>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/home`,
      ),
    storefrontArticles: (storeSlug: string) =>
      request<
        Array<{
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          featuredImageUrl: string | null;
          publishedAt: string | null;
        }>
      >(opts, `/storefront/${encodeURIComponent(storeSlug)}/articles`),
    storefrontArticle: (storeSlug: string, articleSlug: string) =>
      request<{
        id: string;
        slug: string;
        title: string;
        excerpt: string | null;
        content: string;
        featuredImageUrl: string | null;
        publishedAt: string | null;
        tags: string[];
      }>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/articles/${encodeURIComponent(articleSlug)}`,
      ),
    storefrontProducts: (
      storeSlug: string,
      query: Record<string, string> = {},
    ) => {
      const params = new URLSearchParams(query);
      const qs = params.toString();
      return request<Array<Record<string, unknown>>>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/products${qs ? `?${qs}` : ''}`,
      );
    },
    storefrontProduct: (storeSlug: string, productSlug: string) =>
      request<Record<string, unknown>>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlug)}`,
      ),
    storefrontCategories: (storeSlug: string) =>
      request<Array<Record<string, unknown>>>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/categories`,
      ),
    storefrontGetCart: (storeSlug: string, sessionId: string) =>
      request<Record<string, unknown>>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/cart?sessionId=${encodeURIComponent(sessionId)}`,
      ),
    storefrontSetCartItem: (
      storeSlug: string,
      body: {
        sessionId: string;
        productId: string;
        quantity: number;
        variantId?: string;
      },
    ) =>
      request(opts, `/storefront/${encodeURIComponent(storeSlug)}/cart`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    storefrontValidateDiscount: (
      storeSlug: string,
      body: { code: string; subtotal?: number },
    ) =>
      request<{
        valid: boolean;
        reason: string | null;
        discount: Record<string, unknown> | null;
      }>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/discounts/validate`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    storefrontCheckout: (
      storeSlug: string,
      body: {
        sessionId: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        customerNote?: string;
        discountCode?: string;
        paymentMethod?: 'cod' | 'online';
        checkoutToken?: string;
      },
    ) =>
      request<{
        orderNumber: string;
        paymentHint?: string | null;
        payUrl?: string | null;
        status?: string;
        paymentRef?: string | null;
      }>(opts, `/storefront/${encodeURIComponent(storeSlug)}/checkout`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    hydrateCheckoutSession: (token: string) =>
      request<{
        storeSlug: string;
        sessionId: string;
        channel: string;
        expiresAt: string;
        cart: { total: number };
      }>(opts, `/checkout/sessions?token=${encodeURIComponent(token)}`),
    storefrontLookupCustomer: (storeSlug: string, phone: string) =>
      request<{
        id: string;
        name: string;
        phone: string;
        defaultAddress: string | null;
      } | null>(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/customer?phone=${encodeURIComponent(phone)}`,
      ),
    storefrontRegisterCustomer: (
      storeSlug: string,
      body: {
        name: string;
        phone: string;
        address: string;
        sessionId?: string;
      },
    ) =>
      request(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/customer`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    storefrontTrackOrder: (
      storeSlug: string,
      orderNumber: string,
      phone: string,
    ) =>
      request(
        opts,
        `/storefront/${encodeURIComponent(storeSlug)}/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`,
      ),
  };
}

export type SelomaApiClient = ReturnType<typeof createApiClient>;
/** @deprecated Use SelomaApiClient. Kept for existing internal imports. */
export type DeloreyApiClient = SelomaApiClient;
