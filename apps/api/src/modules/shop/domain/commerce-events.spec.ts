import { describe, expect, it } from 'vitest';
import {
  analyticsEventForOrderStatus,
  orderStatusNotifyBody,
} from './commerce-events';

describe('analyticsEventForOrderStatus', () => {
  it('maps fulfillment statuses that merchants and shoppers care about', () => {
    expect(analyticsEventForOrderStatus('approved')).toBe('order_approved');
    expect(analyticsEventForOrderStatus('rejected')).toBe('order_rejected');
    expect(analyticsEventForOrderStatus('pending')).toBeNull();
  });
});

describe('orderStatusNotifyBody', () => {
  it('includes the rejection reason', () => {
    expect(orderStatusNotifyBody('SF-1', 'order_rejected', 'ناموجود')).toContain(
      'ناموجود',
    );
  });
});
