import { describe, expect, it } from 'vitest';
import {
  CHANNEL_CAPABILITIES,
  formatButtons,
  formatCheckoutLink,
  formatProduct,
  formatStartMenu,
  isOrdersMenuText,
  isStartCommand,
  isStoreMenuText,
} from './channel-adapter';

describe('channel capabilities', () => {
  it('treats Instagram checkout link as the purchase path and downgrades keyboards', () => {
    const ig = CHANNEL_CAPABILITIES.instagram;
    expect(ig.supportsCheckoutLink).toBe(true);
    expect(ig.supportsInlineKeyboard).toBe(false);
    const menu = formatStartMenu(ig);
    expect(menu.text).toContain('1) فروشگاه');
    expect(menu.replyKeyboard).toBeUndefined();
  });

  it('gives Telegram a reply keyboard instead of numbered text', () => {
    const menu = formatStartMenu(CHANNEL_CAPABILITIES.telegram);
    expect(menu.replyKeyboard?.keyboard[0]?.map((b) => b.text)).toEqual([
      'فروشگاه',
      'سفارش‌های من',
    ]);
  });

  it('downgrades a product card to title + price + link', () => {
    const text = formatProduct(CHANNEL_CAPABILITIES.bale, {
      title: 'کفش',
      sku: 'SH-01',
      priceLabel: '۱۲۰٬۰۰۰ تومان',
      url: 'https://shop.example/p/1',
    });
    expect(text).toContain('SH-01');
    expect(text).toContain('https://shop.example/p/1');
  });
});

describe('menu text', () => {
  it('recognizes /start and menu labels', () => {
    expect(isStartCommand('/start')).toBe(true);
    expect(isStartCommand('/start@seloma_bot')).toBe(true);
    expect(isStoreMenuText('فروشگاه')).toBe(true);
    expect(isOrdersMenuText('سفارش‌های من')).toBe(true);
    expect(isStoreMenuText('می‌خوام بخرم')).toBe(false);
  });

  it('formats a checkout URL as plain text', () => {
    expect(formatCheckoutLink('https://x/c')).toContain('https://x/c');
  });

  it('numbers buttons when the channel has no keyboard', () => {
    const formatted = formatButtons(
      CHANNEL_CAPABILITIES.bale,
      'انتخاب کنید',
      [{ id: 'a', label: 'بله' }],
    );
    expect(formatted.text).toBe('انتخاب کنید\n1) بله');
  });
});
