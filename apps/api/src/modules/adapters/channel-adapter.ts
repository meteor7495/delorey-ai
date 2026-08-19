export type SalesChannel = 'instagram' | 'telegram' | 'bale' | 'website';

export type ChannelCapabilities = {
  supportsButtons: boolean;
  supportsInlineKeyboard: boolean;
  supportsMiniApp: boolean;
  supportsProductCards: boolean;
  supportsImages: boolean;
  supportsCheckoutLink: boolean;
  supportsRichMessages: boolean;
};

export type OutboundButton = { id: string; label: string };

export type OutboundProduct = {
  title: string;
  sku: string;
  priceLabel: string;
  imageUrl?: string | null;
  url?: string | null;
};

export type NormalizedInbound = {
  tenantId: string;
  externalThreadId: string;
  text: string;
  eventId: string;
};

export type OutboundText = {
  tenantId: string;
  conversationId: string;
  text: string;
};

export interface IChannelAdapter {
  readonly channel: SalesChannel;
  capabilities(): ChannelCapabilities;
  sendMessage(input: OutboundText): Promise<void>;
  sendProduct(input: OutboundText & OutboundProduct): Promise<void>;
  sendImage(input: OutboundText & { imageUrl: string }): Promise<void>;
  sendButtons(input: OutboundText & { buttons: OutboundButton[] }): Promise<void>;
  sendCheckoutLink(input: OutboundText & { url: string }): Promise<void>;
  sendOrderStatus(input: OutboundText): Promise<void>;
}

export const CHANNEL_CAPABILITIES: Record<SalesChannel, ChannelCapabilities> = {
  instagram: {
    supportsButtons: false,
    supportsInlineKeyboard: false,
    supportsMiniApp: false,
    supportsProductCards: false,
    supportsImages: true,
    supportsCheckoutLink: true,
    supportsRichMessages: false,
  },
  telegram: {
    supportsButtons: true,
    supportsInlineKeyboard: true,
    supportsMiniApp: false,
    supportsProductCards: true,
    supportsImages: true,
    supportsCheckoutLink: true,
    supportsRichMessages: true,
  },
  bale: {
    supportsButtons: false,
    supportsInlineKeyboard: false,
    supportsMiniApp: false,
    supportsProductCards: false,
    supportsImages: true,
    supportsCheckoutLink: true,
    supportsRichMessages: false,
  },
  website: {
    supportsButtons: true,
    supportsInlineKeyboard: false,
    supportsMiniApp: false,
    supportsProductCards: true,
    supportsImages: true,
    supportsCheckoutLink: true,
    supportsRichMessages: true,
  },
};

export const START_MENU_BUTTONS: OutboundButton[] = [
  { id: 'store', label: 'فروشگاه' },
  { id: 'orders', label: 'سفارش‌های من' },
];

export function isStartCommand(text: string): boolean {
  return /^\/start(?:@\w+)?$/i.test(text.trim());
}

export function isStoreMenuText(text: string): boolean {
  return /^(?:1|فروشگاه)$/i.test(text.trim());
}

export function isOrdersMenuText(text: string): boolean {
  return /^(?:2|سفارش‌های من|سفارشات من)$/i.test(text.trim());
}

/** Buttons → numbered list when the channel cannot render a keyboard. */
export function formatButtons(
  caps: ChannelCapabilities,
  prompt: string,
  buttons: OutboundButton[],
): { text: string; replyKeyboard?: { keyboard: Array<Array<{ text: string }>>; resize_keyboard: true } } {
  if (caps.supportsButtons) {
    return {
      text: prompt,
      replyKeyboard: {
        keyboard: [buttons.map((b) => ({ text: b.label }))],
        resize_keyboard: true,
      },
    };
  }
  const lines = buttons.map((b, i) => `${i + 1}) ${b.label}`).join('\n');
  return { text: `${prompt}\n${lines}` };
}

export function formatProduct(caps: ChannelCapabilities, product: OutboundProduct): string {
  const lines = [product.title, `کد: ${product.sku}`, product.priceLabel];
  if (product.url && (caps.supportsCheckoutLink || !caps.supportsProductCards)) {
    lines.push(product.url);
  }
  if (product.imageUrl && !caps.supportsImages) {
    lines.push(product.imageUrl);
  }
  return lines.filter(Boolean).join('\n');
}

export function formatCheckoutLink(url: string): string {
  return `ادامه خرید در وب‌سایت:\n${url}`;
}

export function formatStartMenu(caps: ChannelCapabilities) {
  return formatButtons(caps, 'سلام! از منو انتخاب کنید:', START_MENU_BUTTONS);
}
