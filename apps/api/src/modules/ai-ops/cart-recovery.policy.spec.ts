import { describe, expect, it } from 'vitest';
import { normalizeGuardrails, DEFAULT_GUARDRAILS } from '../platform/types';

describe('cart recovery guardrails', () => {
  it('defaults frequency and abandon hours', () => {
    const g = normalizeGuardrails({});
    expect(g.cartAbandonHours).toBe(DEFAULT_GUARDRAILS.cartAbandonHours);
    expect(g.cartRecoveryMaxPerWeek).toBe(
      DEFAULT_GUARDRAILS.cartRecoveryMaxPerWeek,
    );
  });

  it('clamps abandon hours and recovery max', () => {
    const g = normalizeGuardrails({
      cartAbandonHours: 999,
      cartRecoveryMaxPerWeek: 99,
    });
    expect(g.cartAbandonHours).toBe(168);
    expect(g.cartRecoveryMaxPerWeek).toBe(10);
  });

  it('never disables refund/cancel via normalize alone when missing', () => {
    const g = normalizeGuardrails({
      restrictedMutations: { refund: false, cancel: false },
    });
    // normalize treats !== false as true for safety defaults on missing keys;
    // explicit false is respected here — EmployeeService still forces true on save
    expect(g.restrictedMutations.refund).toBe(false);
    expect(g.restrictedMutations.cancel).toBe(false);
  });
});
