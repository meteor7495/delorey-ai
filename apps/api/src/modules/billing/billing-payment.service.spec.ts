import { describe, expect, it, vi } from 'vitest';
import { BillingPaymentService } from './billing-payment.service';

describe('BillingPaymentService callback replay', () => {
  it('second successful callback does not credit twice', async () => {
    const credits: string[] = [];
    let status = 'pending';
    const payment = {
      id: 'pay-1',
      tenantId: 't-a',
      kind: 'CREDIT_PURCHASE',
      status,
      amount: 1_000_000,
      authority: 'AUTH',
      providerTransactionId: null as string | null,
      idempotencyKey: 'k1',
    };

    const prisma = {
      billingPayment: {
        findUnique: vi.fn(async () => ({ ...payment, status })),
        update: vi.fn(async ({ data }: { data: { status: string; providerTransactionId?: string } }) => {
          status = data.status;
          if (data.providerTransactionId) {
            payment.providerTransactionId = data.providerTransactionId;
          }
          return { ...payment, status };
        }),
      },
      adminAuditEvent: { create: vi.fn(async () => ({})) },
    };
    const wallets = {
      credit: vi.fn(async (_tenant: string, w: { idempotencyKey?: string }) => {
        if (w.idempotencyKey && credits.includes(w.idempotencyKey)) return;
        credits.push(w.idempotencyKey ?? 'x');
      }),
    };
    const locks = {
      withLock: async (_k: string, fn: () => Promise<boolean>) => fn(),
    };

    const svc = new BillingPaymentService(
      prisma as never,
      wallets as never,
      locks as never,
      {} as never,
      {} as never,
      { get: () => undefined } as never,
    );

    expect(await svc.verifyAndCredit('pay-1', true, 'REF-1')).toBe(true);
    expect(await svc.verifyAndCredit('pay-1', true, 'REF-1')).toBe(true);
    expect(credits).toHaveLength(1);
    expect(wallets.credit).toHaveBeenCalledTimes(1);
  });

  it('failed payment does not credit', async () => {
    const wallets = { credit: vi.fn() };
    const prisma = {
      billingPayment: {
        findUnique: vi.fn(async () => ({
          id: 'pay-2',
          tenantId: 't-a',
          status: 'pending',
          kind: 'CREDIT_PURCHASE',
          amount: 1,
          idempotencyKey: 'k2',
        })),
        update: vi.fn(async () => ({})),
      },
    };
    const svc = new BillingPaymentService(
      prisma as never,
      wallets as never,
      { withLock: async (_k: string, fn: () => Promise<boolean>) => fn() } as never,
      {} as never,
      {} as never,
      { get: () => undefined } as never,
    );
    expect(await svc.verifyAndCredit('pay-2', false)).toBe(false);
    expect(wallets.credit).not.toHaveBeenCalled();
  });
});
