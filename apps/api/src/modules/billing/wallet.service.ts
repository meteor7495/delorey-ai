import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import {
  BillingUnavailableError,
  InsufficientCreditError,
} from './billing.errors';
import { BILLING_CURRENCY } from './domain/billing.types';
import type { WalletTxType } from './domain/billing.types';
import { availableBalance, canCover, toIrt } from './domain/money';

type LockedWallet = {
  id: string;
  tenantId: string;
  balance: number;
  reserved: number;
  status: string;
};

export type LedgerWrite = {
  type: WalletTxType;
  amount: number;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey?: string | null;
};

@Injectable()
export class WalletService {
  private readonly log = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(tenantId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;
    try {
      return await this.prisma.wallet.create({
        data: {
          tenantId,
          balance: 0,
          reserved: 0,
          currency: BILLING_CURRENCY,
          status: 'active',
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return this.prisma.wallet.findUniqueOrThrow({ where: { tenantId } });
      }
      throw err;
    }
  }

  async snapshot(tenantId: string) {
    const wallet = await this.getOrCreate(tenantId);
    return {
      id: wallet.id,
      tenantId: wallet.tenantId,
      balance: toIrt(wallet.balance),
      reserved: toIrt(wallet.reserved),
      available: availableBalance(toIrt(wallet.balance), toIrt(wallet.reserved)),
      currency: wallet.currency,
      status: wallet.status,
      lowBalanceThreshold: toIrt(wallet.lowBalanceThreshold),
      criticalBalanceThreshold: toIrt(wallet.criticalBalanceThreshold),
    };
  }

  /**
   * Atomic credit. Idempotent via unique idempotency_key.
   * Fail-closed: if we cannot confirm the write, throw — caller must not retry
   * with a new key.
   */
  async credit(tenantId: string, write: LedgerWrite) {
    const amount = toIrt(write.amount);
    if (amount <= 0) {
      throw new Error('credit amount must be positive');
    }
    return this.runLedger(tenantId, { ...write, amount }, 'credit');
  }

  /**
   * Atomic debit. Checks available = balance - reserved >= charge in the
   * same UPDATE. Negative balance is impossible.
   */
  async debit(tenantId: string, write: LedgerWrite) {
    const amount = toIrt(write.amount);
    if (amount <= 0) {
      throw new Error('debit amount must be positive');
    }
    return this.runLedger(tenantId, { ...write, amount: -amount }, 'debit');
  }

  private async runLedger(
    tenantId: string,
    write: LedgerWrite,
    direction: 'credit' | 'debit',
  ) {
    if (write.idempotencyKey) {
      const existing = await this.prisma.walletTransaction.findUnique({
        where: { idempotencyKey: write.idempotencyKey },
      });
      if (existing) {
        if (existing.tenantId !== tenantId) {
          throw new BillingUnavailableError();
        }
        return existing;
      }
    }

    try {
      return await this.prisma.$transaction(
        async (tx) => {
          const wallet = await this.lockWallet(tx, tenantId);
          if (write.idempotencyKey) {
            const raced = await tx.walletTransaction.findUnique({
              where: { idempotencyKey: write.idempotencyKey },
            });
            if (raced) return raced;
          }

          const delta = toIrt(write.amount);
          if (direction === 'debit') {
            const charge = Math.abs(delta);
            if (wallet.status !== 'active') {
              throw new InsufficientCreditError();
            }
            if (!canCover(availableBalance(wallet.balance, wallet.reserved), charge)) {
              throw new InsufficientCreditError();
            }
          }

          const nextBalance = wallet.balance + delta;
          if (nextBalance < 0) {
            throw new InsufficientCreditError();
          }

          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: nextBalance },
          });

          return tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              tenantId,
              type: write.type,
              amount: delta,
              balanceBefore: wallet.balance,
              balanceAfter: toIrt(updated.balance),
              referenceType: write.referenceType ?? null,
              referenceId: write.referenceId ?? null,
              description: write.description,
              metadata: write.metadata
                ? (write.metadata as Prisma.InputJsonValue)
                : undefined,
              idempotencyKey: write.idempotencyKey ?? undefined,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );
    } catch (err) {
      if (err instanceof InsufficientCreditError) throw err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        write.idempotencyKey
      ) {
        const existing = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey: write.idempotencyKey },
        });
        if (existing && existing.tenantId === tenantId) return existing;
      }
      this.log.error(
        `ledger ${direction} failed tenant=${tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      throw new BillingUnavailableError();
    }
  }

  async adjustReserved(
    tenantId: string,
    deltaReserved: number,
    ledger: LedgerWrite,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.lockWallet(tx, tenantId);
        if (ledger.idempotencyKey) {
          const raced = await tx.walletTransaction.findUnique({
            where: { idempotencyKey: ledger.idempotencyKey },
          });
          if (raced) return { wallet, transaction: raced };
        }
        const nextReserved = wallet.reserved + deltaReserved;
        if (nextReserved < 0) {
          throw new InsufficientCreditError();
        }
        if (deltaReserved > 0) {
          if (!canCover(availableBalance(wallet.balance, wallet.reserved), deltaReserved)) {
            throw new InsufficientCreditError();
          }
        }
        const updated = await tx.wallet.update({
          where: { id: wallet.id },
          data: { reserved: nextReserved },
        });
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId,
            type: ledger.type,
            amount: 0,
            balanceBefore: wallet.balance,
            balanceAfter: toIrt(updated.balance),
            referenceType: ledger.referenceType ?? null,
            referenceId: ledger.referenceId ?? null,
            description: ledger.description,
            metadata: {
              ...(ledger.metadata ?? {}),
              reservedDelta: deltaReserved,
              reservedAfter: nextReserved,
            } as Prisma.InputJsonValue,
            idempotencyKey: ledger.idempotencyKey ?? undefined,
          },
        });
        return { wallet: updated, transaction };
      });
    } catch (err) {
      if (err instanceof InsufficientCreditError) throw err;
      this.log.error(
        `reserve adjust failed tenant=${tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      throw new BillingUnavailableError();
    }
  }

  /**
   * Capture a reservation: release hold, debit actual charge atomically.
   */
  async captureReservation(args: {
    tenantId: string;
    reservedAmount: number;
    chargeAmount: number;
    ledger: LedgerWrite;
  }) {
    const reservedAmount = toIrt(args.reservedAmount);
    const chargeAmount = toIrt(args.chargeAmount);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const wallet = await this.lockWallet(tx, args.tenantId);
        if (args.ledger.idempotencyKey) {
          const raced = await tx.walletTransaction.findUnique({
            where: { idempotencyKey: args.ledger.idempotencyKey },
          });
          if (raced) return raced;
        }
        const nextReserved = Math.max(0, wallet.reserved - reservedAmount);
        const nextBalance = wallet.balance - chargeAmount;
        if (nextBalance < 0) {
          throw new InsufficientCreditError();
        }
        const updated = await tx.wallet.update({
          where: { id: wallet.id },
          data: { reserved: nextReserved, balance: nextBalance },
        });
        return tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            tenantId: args.tenantId,
            type: args.ledger.type,
            amount: -chargeAmount,
            balanceBefore: wallet.balance,
            balanceAfter: toIrt(updated.balance),
            referenceType: args.ledger.referenceType ?? null,
            referenceId: args.ledger.referenceId ?? null,
            description: args.ledger.description,
            metadata: args.ledger.metadata
              ? (args.ledger.metadata as Prisma.InputJsonValue)
              : undefined,
            idempotencyKey: args.ledger.idempotencyKey ?? undefined,
          },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientCreditError) throw err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        args.ledger.idempotencyKey
      ) {
        const existing = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey: args.ledger.idempotencyKey },
        });
        if (existing && existing.tenantId === args.tenantId) return existing;
      }
      this.log.error(
        `capture failed tenant=${args.tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      throw new BillingUnavailableError();
    }
  }

  async lockWallet(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<LockedWallet> {
    await this.getOrCreate(tenantId);
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        tenant_id: string;
        balance: Prisma.Decimal;
        reserved: Prisma.Decimal;
        status: string;
      }>
    >`
      SELECT id, tenant_id, balance, reserved, status
      FROM wallets
      WHERE tenant_id = ${tenantId}
      FOR UPDATE
    `;
    const row = rows[0];
    if (!row) {
      throw new BillingUnavailableError();
    }
    return {
      id: row.id,
      tenantId: row.tenant_id,
      balance: toIrt(row.balance),
      reserved: toIrt(row.reserved),
      status: row.status,
    };
  }
}
