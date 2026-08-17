import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_YES_RE,
  classifyCommerceIntent,
  extractOrderNumber,
  shoppingStateFromCheckoutStep,
} from './rule-engine';

describe('classifyCommerceIntent', () => {
  it('prefers buy phrasing over a generic سفارش lookup', () => {
    expect(classifyCommerceIntent('سفارش بده')).toBe('place_order');
    expect(classifyCommerceIntent('می‌خوام بخرم')).toBe('place_order');
    expect(classifyCommerceIntent('ثبت سفارش')).toBe('place_order');
  });

  it('classifies status tracking without treating it as checkout', () => {
    expect(classifyCommerceIntent('وضعیت سفارش')).toBe('order_lookup');
    expect(classifyCommerceIntent('پیگیری SF-ABC12')).toBe('order_lookup');
    expect(extractOrderNumber('سفارش SF-ABC12 را چک کن')).toBe('SF-ABC12');
  });

  it('classifies handoff and restricted mutations first', () => {
    expect(classifyCommerceIntent('با پشتیبان حرف بزنم')).toBe('human_request');
    expect(classifyCommerceIntent('می‌خوام استرداد وجه')).toBe('refund');
    expect(classifyCommerceIntent('لغو سفارش')).toBe('cancel_order');
  });

  it('classifies recommend / category asks', () => {
    expect(classifyCommerceIntent('یه هدیه پیشنهاد بده')).toBe('recommend');
    expect(classifyCommerceIntent('کفش می‌خوام')).toBe('recommend');
    expect(classifyCommerceIntent('کفش')).toBe('recommend');
  });

  it('returns none when no commerce rule matches', () => {
    expect(classifyCommerceIntent('ساعت کار فروشگاه؟')).toBe('none');
  });
});

describe('shoppingStateFromCheckoutStep', () => {
  it('maps the channel checkout machine onto conversation state', () => {
    expect(shoppingStateFromCheckoutStep('idle')).toBe('browsing');
    expect(shoppingStateFromCheckoutStep('awaiting_product')).toBe(
      'collecting_cart',
    );
    expect(shoppingStateFromCheckoutStep('awaiting_name')).toBe('checking_out');
    expect(shoppingStateFromCheckoutStep('awaiting_payment')).toBe(
      'awaiting_payment',
    );
  });
});

describe('checkout confirm', () => {
  it('accepts short yes replies', () => {
    expect(CHECKOUT_YES_RE.test('بله')).toBe(true);
    expect(CHECKOUT_YES_RE.test('آدرس تهران')).toBe(false);
  });
});
