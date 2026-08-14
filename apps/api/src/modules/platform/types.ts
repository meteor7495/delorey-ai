export type AiEmployeeState =
  | 'inactive'
  | 'active'
  | 'paused'
  | 'syncing'
  | 'degraded'
  | 'awaiting_human';

export type SyncHealth = 'healthy' | 'stale' | 'failed' | 'never';

export type EscalationReason =
  | 'customer_request'
  | 'blocked_topic'
  | 'low_confidence'
  | 'discount_cap'
  | 'sync_unhealthy'
  | 'skill_escalate'
  | 'operator_manual';

export type Citation =
  | { type: 'product'; sku: string; title: string; price: number }
  | {
      type: 'knowledge';
      docId: string;
      title: string;
      sourceAttribution: string;
    }
  | {
      type: 'order';
      orderNumber: string;
      status: string;
    };

export interface OrderRecord {
  id: string;
  tenantId: string;
  externalId: string;
  orderNumber: string;
  status: string;
  trackingCode: string | null;
  totalAmount: number;
  currency: string;
  customerPhoneLast4: string;
  customerEmail: string | null;
  syncedAt: string;
}

export type HandoffPacket = {
  reason: EscalationReason;
  reasonLabel: string;
  lastMessages: Array<{ role: string; content: string; createdAt: string }>;
  citations: Citation[];
  intentSummary: string | null;
  createdAt: string;
};

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerUserId: string;
  plan?: string;
  billingStatus?: string;
  createdAt: string;
}

export interface Membership {
  userId: string;
  tenantId: string;
  role: 'owner' | 'operator' | 'viewer';
}

export interface Session {
  token: string;
  userId: string;
  tenantId: string;
  expiresAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  externalId?: string | null;
  sku: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  inStock: boolean;
  description?: string;
  images: string[];
  categoryId?: string | null;
  status: string;
  source: string;
}

// ─── Commerce Core (Slice 27) ─────────────────────────────────────────

export type ProductStatus = 'draft' | 'published' | 'archived';

export type AttributeType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'color'
  | 'boolean';

export type AttributeDisplayType = 'dropdown' | 'swatch' | 'chip' | 'radio';

export interface Attribute {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: AttributeType;
  displayType: AttributeDisplayType;
  sortOrder: number;
  active: boolean;
  required: boolean;
  values?: AttributeValue[];
}

export interface AttributeValue {
  id: string;
  tenantId: string;
  attributeId: string;
  value: string;
  label: string | null;
  colorHex: string | null;
  sortOrder: number;
}

export interface VariantOption {
  attributeId: string;
  attributeName: string;
  attributeValueId: string;
  value: string;
  label: string | null;
}

export interface ProductVariant {
  id: string;
  tenantId: string;
  productId: string;
  sku: string;
  barcode: string | null;
  /** Sorted attribute value ids — stable identity of the combination. */
  optionsKey: string;
  /** Null → inherits the product base price. */
  price: number | null;
  compareAtPrice: number | null;
  costPrice: number | null;
  weightGrams: number | null;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
  options?: VariantOption[];
  inventory?: InventoryLevel | null;
}

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryLevel {
  id: string;
  tenantId: string;
  productId: string;
  /** Null → product-level stock for a product without variants. */
  variantId: string | null;
  onHand: number;
  reserved: number;
  /** onHand - reserved */
  available: number;
  lowStockThreshold: number;
  state: StockState;
}

export type InventoryTransactionType =
  | 'initial'
  | 'adjustment'
  | 'sale'
  | 'reservation'
  | 'reservation_release'
  | 'return'
  | 'restock'
  | 'correction';

export interface InventoryTransaction {
  id: string;
  tenantId: string;
  inventoryLevelId: string;
  type: InventoryTransactionType;
  quantityDelta: number;
  resultingOnHand: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  actorUserId: string | null;
  createdAt: string;
}

export type DiscountType = 'percentage' | 'fixed';

export type DiscountTargetType = 'all' | 'product' | 'category' | 'variant';

export interface DiscountTarget {
  id: string;
  discountId: string;
  targetType: DiscountTargetType;
  targetId: string | null;
}

export interface Discount {
  id: string;
  tenantId: string;
  name: string;
  /** Null → automatic discount with no coupon code. */
  code: string | null;
  type: DiscountType;
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
  targets?: DiscountTarget[];
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
  categoryId: string | null;
  tags: string[];
  status: ArticleStatus;
  authorUserId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceSettings {
  defaultCurrency: string;
  lowStockThreshold: number;
  allowNegativeInventory: boolean;
  defaultProductStatus: 'draft' | 'published';
}

export interface EmployeeGuardrails {
  blockedTopics: string[];
  discountCapPercent: number;
  restrictedMutations: {
    refund: boolean;
    cancel: boolean;
  };
  escalationRules: {
    onBlockedTopic: boolean;
    onCustomerRequest: boolean;
    onDiscountAboveCap: boolean;
  };
}

export const DEFAULT_GUARDRAILS: EmployeeGuardrails = {
  blockedTopics: ['سیاسی', 'قمار', 'شرط‌بندی'],
  discountCapPercent: 10,
  restrictedMutations: {
    refund: true,
    cancel: true,
  },
  escalationRules: {
    onBlockedTopic: true,
    onCustomerRequest: true,
    onDiscountAboveCap: true,
  },
};

export function normalizeGuardrails(raw: unknown): EmployeeGuardrails {
  const src =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const topics = Array.isArray(src.blockedTopics)
    ? src.blockedTopics.filter((t): t is string => typeof t === 'string')
    : DEFAULT_GUARDRAILS.blockedTopics;
  // Migrate legacy English default seeds → Persian (merchant-visible data)
  const topicAliases: Record<string, string> = {
    politics: 'سیاسی',
    gambling: 'قمار',
  };
  const normalizedTopics = [
    ...new Set(
      topics.map((t) => topicAliases[t.trim().toLowerCase()] ?? t.trim()),
    ),
  ].filter(Boolean);
  const mutations =
    src.restrictedMutations && typeof src.restrictedMutations === 'object'
      ? (src.restrictedMutations as Record<string, unknown>)
      : {};
  const rules =
    src.escalationRules && typeof src.escalationRules === 'object'
      ? (src.escalationRules as Record<string, unknown>)
      : {};
  const cap = Number(src.discountCapPercent);
  return {
    blockedTopics: normalizedTopics.length
      ? normalizedTopics
      : DEFAULT_GUARDRAILS.blockedTopics,
    discountCapPercent: Number.isFinite(cap)
      ? Math.max(0, Math.min(100, cap))
      : DEFAULT_GUARDRAILS.discountCapPercent,
    restrictedMutations: {
      refund: mutations.refund !== false,
      cancel: mutations.cancel !== false,
    },
    escalationRules: {
      onBlockedTopic: rules.onBlockedTopic !== false,
      onCustomerRequest: rules.onCustomerRequest !== false,
      onDiscountAboveCap: rules.onDiscountAboveCap !== false,
    },
  };
}

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  tone: string;
  language: string;
  status: AiEmployeeState;
  skills: {
    product_search: boolean;
    recommend: boolean;
    order_status: boolean;
    escalate: boolean;
  };
  guardrails: EmployeeGuardrails;
}

export interface ChannelBinding {
  id: string;
  tenantId: string;
  channel: 'website' | 'telegram' | 'bale' | 'instagram';
  status: 'connected' | 'disconnected' | 'degraded';
  publicKey: string;
  allowedOrigins: string[];
  credentialsCipher: string | null;
  webhookSecret: string | null;
  botUsername: string | null;
}

export interface Conversation {
  id: string;
  tenantId: string;
  channel: 'website' | 'telegram' | 'bale' | 'instagram';
  ownership: 'ai_owned' | 'human_owned';
  externalThreadId: string | null;
  escalationReason: EscalationReason | null;
  escalatedAt: string | null;
  handoffPacket: HandoffPacket | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  tenantId: string;
  role: 'shopper' | 'employee' | 'system' | 'operator';
  content: string;
  createdAt: string;
  citations?: Citation[];
  idempotencyKey?: string;
}

export type AuditGatewayMeter = {
  mode: 'mock' | 'live';
  providerId: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  taskClass: string;
  routeHint: string;
  fallbackReason?: string;
};

export interface AuditTurn {
  id: string;
  tenantId: string;
  conversationId: string;
  decision: string;
  citations: Citation[];
  gateway?: AuditGatewayMeter | null;
  createdAt: string;
}

export interface AdminAuditEvent {
  id: string;
  tenantId: string;
  actorUserId: string;
  action: string;
  summary: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface KnowledgeDoc {
  id: string;
  tenantId: string;
  docType: 'faq' | 'policy_override' | 'upload';
  title: string;
  bodyText: string;
  sourceAttribution: string;
  status: 'active' | 'indexing' | 'failed';
  objectKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  tenantId: string;
  knowledgeDocId: string;
  ordinal: number;
  content: string;
}

export interface StoreConnection {
  id: string;
  tenantId: string;
  platform: 'mock' | 'shopify' | 'woocommerce';
  shopDomain: string | null;
  externalShopId: string | null;
  syncHealth: SyncHealth;
  lastSyncAt: string | null;
  failureReason: string | null;
  /** Never expose cipher / token — only whether credentials exist */
  hasCredentials: boolean;
}

export const ESCALATION_LABELS: Record<EscalationReason, string> = {
  customer_request: 'درخواست مشتری برای انسان',
  blocked_topic: 'موضوع محدودشده',
  low_confidence: 'اطمینان پایین',
  discount_cap: 'بیش از سقف تخفیف',
  sync_unhealthy: 'ریسک داده همگام‌سازی',
  skill_escalate: 'ارجاع توسط مهارت',
  operator_manual: 'ارجاع دستی اپراتور',
};
