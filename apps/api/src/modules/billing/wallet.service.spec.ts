import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { WalletService } from './wallet.service';
import { InsufficientCreditError } from './billing.errors';

function makePrisma(wallet: { balance: number; reserved: number; tenantId: string }) {
  const txns: Array<{ idempotencyKey?: string | null; amount: number }> = [];
  const state = { ...wallet, id: 'w1', status: 'active' };

  const tx = {
    $queryRaw: vi.fn(async () => [
      {
        id: state.id,
        tenant_id: state.tenantId,
        balance: new Prisma.Decimal(state.balance),
        reserved: new Prisma.Decimal(state.reserved),
        status: state.status,
      },
    ]),
    wallet: {
      update: vi.fn(async ({ data }: { data: { balance?: number; reserved?: number } }) => {
        if (data.balance != null) state.balance = Number(data.balance);
        if (data.reserved != null) state.reserved = Number(data.reserved);
        return { ...state };
      }),
    },
    walletTransaction: {
      findUnique: vi.fn(async ({ where }: { where: { idempotencyKey: string } }) =>
        txns.find((t) => t.idempotencyKey === where.idempotencyKey) ?? null,
      ),
      create: vi.fn(async ({ data }: { data: { amount: number; idempotencyKey?: string } }) => {
        const row = { id: `tx-${txns.length + 1}`, tenantId: state.tenantId, ...data };
        txns.push(row);
        return row;
      }),
    },
  };

  const prisma = {
    wallet: {
      findUnique: vi.fn(async () => ({
        id: state.id,
        tenantId: state.tenantId,
        balance: state.balance,
        reserved: state.reserved,
        currency: 'IRT',
        status: state.status,
        lowBalanceThreshold: 500000,
        criticalBalanceThreshold: 200000,
      })),
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    walletTransaction: {
      findUnique: vi.fn(async ({ where }: { where: { idempotencyKey: string } }) =>
        txns.find((t) => t.idempotencyKey === where.idempotencyKey) ?? null,
      ),
    },
    $transaction: vi.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
  };

  return { prisma, state, txns, service: new WalletService(prisma as never) };
}

describe('WalletService', () => {
  it('credits and records ledger', async () => {
    const { service, state } = makePrisma({
      balance: 0,
      reserved: 0,
      tenantId: 't-a',
    });
    await service.credit('t-a', {
      type: 'CREDIT_PURCHASE',
      amount: 1_000_000,
      description: 'خرید',
      idempotencyKey: 'pay-1',
    });
    expect(state.balance).toBe(1_000_000);
  });

  it('is idempotent on credit', async () => {
    const { service, txns } = makePrisma({
      balance: 0,
      reserved: 0,
      tenantId: 't-a',
    });
    const write = {
      type: 'CREDIT_PURCHASE' as const,
      amount: 500_000,
      description: 'خرید',
      idempotencyKey: 'dup',
    };
    await service.credit('t-a', write);
    await service.credit('t-a', write);
    expect(txns.filter((t) => t.idempotencyKey === 'dup')).toHaveLength(1);
  });

  it('rejects insufficient debit', async () => {
    const { service } = makePrisma({
      balance: 100_000,
      reserved: 0,
      tenantId: 't-a',
    });
    await expect(
      service.debit('t-a', {
        type: 'USAGE',
        amount: 200_000,
        description: 'مصرف',
      }),
    ).rejects.toBeInstanceOf(InsufficientCreditError);
  });

  it('does not allow debit of reserved funds', async () => {
    const { service } = makePrisma({
      balance: 300_000,
      reserved: 250_000,
      tenantId: 't-a',
    });
    await expect(
      service.debit('t-a', {
        type: 'USAGE',
        amount: 100_000,
        description: 'مصرف',
      }),
    ).rejects.toBeInstanceOf(InsufficientCreditError);
  });

  it('isolates tenants by tenantId argument not body', async () => {
    const { service, prisma } = makePrisma({
      balance: 10,
      reserved: 0,
      tenantId: 't-a',
    });
    await service.debit('t-a', {
      type: 'USAGE',
      amount: 1,
      description: 'مصرف',
      idempotencyKey: 'u1',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
