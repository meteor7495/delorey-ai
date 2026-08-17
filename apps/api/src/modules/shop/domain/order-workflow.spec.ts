import { describe, expect, it } from 'vitest';
import { CommerceRuleError } from './commerce-errors';
import {
  assertTransition,
  canTransition,
  canonicalizeOrderStatus,
  initialOrderStatus,
  initialPaymentStatus,
  normalizeRejectionReason,
  shouldRestockInventory,
} from './order-workflow';

describe('canonicalizeOrderStatus', () => {
  it('maps legacy confirmed to approved', () => {
    expect(canonicalizeOrderStatus('confirmed')).toBe('approved');
  });

  it('rejects unknown statuses', () => {
    expect(() => canonicalizeOrderStatus('mystery')).toThrowError(
      CommerceRuleError,
    );
  });
});

describe('transitions', () => {
  it('lets COD pending move to approved or rejected', () => {
    expect(canTransition('pending', 'approved')).toBe(true);
    expect(canTransition('pending', 'rejected')).toBe(true);
    expect(canTransition('pending', 'shipped')).toBe(false);
  });

  it('blocks skipping admin approval after online payment', () => {
    expect(canTransition('pending_payment', 'approved')).toBe(false);
    expect(canTransition('pending_payment', 'pending_approval')).toBe(true);
    expect(canTransition('pending_approval', 'approved')).toBe(true);
  });

  it('treats confirmed as approved for outbound transitions', () => {
    expect(canTransition('confirmed', 'shipped')).toBe(true);
    expect(canTransition('confirmed', 'processing')).toBe(true);
    expect(canTransition('approved', 'shipped')).toBe(true);
  });

  it('allows processing between approved and shipped', () => {
    expect(canTransition('approved', 'processing')).toBe(true);
    expect(canTransition('processing', 'shipped')).toBe(true);
    expect(canTransition('processing', 'delivered')).toBe(false);
  });

  it('allows a successful retry after payment_failed', () => {
    expect(canTransition('payment_failed', 'pending_approval')).toBe(true);
  });

  it('throws a domain error on illegal moves', () => {
    expect(() => assertTransition('shipped', 'pending')).toThrowError(
      CommerceRuleError,
    );
  });
});

describe('rejection reason', () => {
  it('requires a real reason', () => {
    expect(() => normalizeRejectionReason('  ')).toThrowError(CommerceRuleError);
    expect(() => normalizeRejectionReason('نه')).toThrowError(CommerceRuleError);
    expect(normalizeRejectionReason('موجودی کافی نیست')).toBe(
      'موجودی کافی نیست',
    );
  });
});

describe('restock', () => {
  it('restocks when leaving an active path for cancel/reject', () => {
    expect(shouldRestockInventory('pending', 'cancelled')).toBe(true);
    expect(shouldRestockInventory('pending_approval', 'rejected')).toBe(true);
    expect(shouldRestockInventory('pending_payment', 'cancelled')).toBe(true);
  });

  it('keeps stock reserved on payment_failed so a retry can succeed', () => {
    expect(shouldRestockInventory('pending_payment', 'payment_failed')).toBe(
      false,
    );
    expect(shouldRestockInventory('payment_failed', 'cancelled')).toBe(true);
  });

  it('does not restock twice from a terminal restock status', () => {
    expect(shouldRestockInventory('cancelled', 'cancelled')).toBe(false);
    expect(shouldRestockInventory('rejected', 'cancelled')).toBe(false);
  });
});

describe('initial statuses', () => {
  it('starts COD as pending/unpaid and online as pending_payment/pending', () => {
    expect(initialOrderStatus('cod')).toBe('pending');
    expect(initialPaymentStatus('cod')).toBe('unpaid');
    expect(initialOrderStatus('online')).toBe('pending_payment');
    expect(initialPaymentStatus('online')).toBe('pending');
  });
});
