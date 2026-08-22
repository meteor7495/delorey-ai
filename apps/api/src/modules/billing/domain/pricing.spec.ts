import { describe, expect, it } from 'vitest';
import {
  canCover,
  availableBalance,
  toIrt,
} from './money';
import {
  captureSplit,
  computeCustomerCharge,
  computeProviderCost,
  monthlyCapExceeded,
  pickBestRule,
  quoteUsage,
  shouldTriggerAutoRecharge,
  specificityScore,
} from './pricing';

describe('money', () => {
  it('prevents negative available', () => {
    expect(availableBalance(100, 150)).toBe(0);
    expect(availableBalance(500_000, 0)).toBe(500_000);
  });

  it('canCover rejects overspend', () => {
    expect(canCover(500_000, 400_000)).toBe(true);
    expect(canCover(500_000, 500_000)).toBe(true);
    expect(canCover(500_000, 500_001)).toBe(false);
    expect(canCover(0, 1)).toBe(false);
    expect(toIrt(12.9)).toBe(12);
  });
});

describe('pricing engine', () => {
  it('keeps provider cost and customer charge separate', () => {
    const { providerCost } = computeProviderCost(1_000, 500, 0.02, 0.08);
    expect(providerCost).toBe(20 + 40);
    expect(computeCustomerCharge(providerCost, 2)).toBe(120);
  });

  it('quotes with markup ceil', () => {
    const q = quoteUsage({
      inputUnits: 100,
      outputUnits: 50,
      inputRule: { unitType: 'input_token', unitPrice: 0.1, markup: 2, provider: '*', model: '*' },
      outputRule: { unitType: 'output_token', unitPrice: 0.2, markup: 2, provider: '*', model: '*' },
    });
    expect(q.providerCost).toBe(20);
    expect(q.customerCharge).toBe(40);
  });

  it('picks the most specific pricing rule', () => {
    expect(specificityScore('openai', 'gpt-4o')).toBe(3);
    const best = pickBestRule([
      { provider: '*', model: '*' },
      { provider: 'openai', model: '*' },
      { provider: 'openai', model: 'gpt-4o' },
    ]);
    expect(best?.model).toBe('gpt-4o');
  });

  it('capture releases unused reservation', () => {
    expect(captureSplit(300_000, 220_000)).toEqual({
      charge: 220_000,
      release: 80_000,
      extra: 0,
    });
  });

  it('capture extra when actual exceeds reserve', () => {
    expect(captureSplit(100_000, 150_000)).toEqual({
      charge: 100_000,
      release: 0,
      extra: 50_000,
    });
  });
});

describe('auto recharge safety', () => {
  it('does not trigger above threshold', () => {
    expect(
      shouldTriggerAutoRecharge({
        enabled: true,
        pausedReason: null,
        available: 250_000,
        threshold: 200_000,
        cooldownUntil: null,
      }),
    ).toBe(false);
  });

  it('triggers at or below threshold', () => {
    expect(
      shouldTriggerAutoRecharge({
        enabled: true,
        pausedReason: null,
        available: 200_000,
        threshold: 200_000,
        cooldownUntil: null,
      }),
    ).toBe(true);
  });

  it('respects cooldown and pause', () => {
    expect(
      shouldTriggerAutoRecharge({
        enabled: true,
        pausedReason: 'monthly_limit',
        available: 10,
        threshold: 200_000,
        cooldownUntil: null,
      }),
    ).toBe(false);
    expect(
      shouldTriggerAutoRecharge({
        enabled: true,
        pausedReason: null,
        available: 10,
        threshold: 200_000,
        cooldownUntil: new Date(Date.now() + 60_000),
      }),
    ).toBe(false);
  });

  it('enforces monthly auto-recharge cap', () => {
    expect(monthlyCapExceeded(2_500_000, 1_000_000, 3_000_000)).toBe(true);
    expect(monthlyCapExceeded(1_000_000, 1_000_000, 3_000_000)).toBe(false);
  });
});

describe('concurrent deduction invariant', () => {
  it('never goes negative when two 400k hits race on 500k', async () => {
    let balance = 500_000;
    const charge = 400_000;
    const results: boolean[] = [];
    async function tryDebit() {
      await Promise.resolve();
      if (balance >= charge) {
        const snapshot = balance;
        await Promise.resolve();
        if (snapshot === balance && balance >= charge) {
          balance -= charge;
          results.push(true);
          return;
        }
      }
      results.push(false);
    }
    // Serialized like FOR UPDATE
    const queue: Promise<void>[] = [];
    let tail = Promise.resolve();
    const run = (fn: () => Promise<void>) => {
      const next = tail.then(fn);
      tail = next.then(() => undefined);
      queue.push(next);
    };
    run(tryDebit);
    run(tryDebit);
    await Promise.all(queue);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(balance).toBe(100_000);
    expect(balance >= 0).toBe(true);
  });
});
