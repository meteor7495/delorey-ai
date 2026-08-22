import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { WalletService } from './wallet.service';
import {
  BillingUnavailableError,
  InsufficientCreditError,
} from './billing.errors';
import { captureSplit } from './domain/pricing';
import { toIrt } from './domain/money';

const DEFAULT_TTL_SEC = 180;

@Injectable()
export class ReservationService {
  private readonly log = new Logger(ReservationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
  ) {}

  async reserve(args: {
    tenantId: string;
    amount: number;
    referenceId: string;
    idempotencyKey: string;
    ttlSec?: number;
  }) {
    const amount = toIrt(args.amount);
    if (amount <= 0) {
      throw new Error('reservation amount must be positive');
    }
    const existing = await this.prisma.walletReservation.findUnique({
      where: { idempotencyKey: args.idempotencyKey },
    });
    if (existing) {
      if (existing.tenantId !== args.tenantId) {
        throw new BillingUnavailableError();
      }
      return existing;
    }

    await this.expireDue(args.tenantId);

    const wallet = await this.wallets.getOrCreate(args.tenantId);
    const ttl = args.ttlSec ?? DEFAULT_TTL_SEC;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    try {
      await this.wallets.adjustReserved(args.tenantId, amount, {
        type: 'RESERVATION',
        amount: 0,
        description: 'رزرو اعتبار',
        referenceType: 'reservation',
        referenceId: args.referenceId,
        idempotencyKey: `${args.idempotencyKey}:hold`,
        metadata: { amount },
      });

      return await this.prisma.walletReservation.create({
        data: {
          walletId: wallet.id,
          tenantId: args.tenantId,
          amount,
          status: 'PENDING',
          referenceId: args.referenceId,
          idempotencyKey: args.idempotencyKey,
          expiresAt,
        },
      });
    } catch (err) {
      if (err instanceof InsufficientCreditError) throw err;
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const raced = await this.prisma.walletReservation.findUnique({
          where: { idempotencyKey: args.idempotencyKey },
        });
        if (raced && raced.tenantId === args.tenantId) return raced;
      }
      this.log.error(
        `reserve failed tenant=${args.tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      throw err instanceof InsufficientCreditError
        ? err
        : new BillingUnavailableError();
    }
  }

  async capture(args: {
    tenantId: string;
    reservationId: string;
    actualCharge: number;
    description: string;
    usageIdempotencyKey: string;
  }) {
    const reservation = await this.prisma.walletReservation.findFirst({
      where: { id: args.reservationId, tenantId: args.tenantId },
    });
    if (!reservation) throw new BillingUnavailableError();
    if (reservation.status === 'CAPTURED') {
      return reservation;
    }
    if (reservation.status !== 'PENDING') {
      throw new BillingUnavailableError();
    }

    const split = captureSplit(toIrt(reservation.amount), args.actualCharge);
    await this.wallets.captureReservation({
      tenantId: args.tenantId,
      reservedAmount: toIrt(reservation.amount),
      chargeAmount: split.charge,
      ledger: {
        type: 'USAGE',
        amount: split.charge,
        description: args.description,
        referenceType: 'reservation',
        referenceId: reservation.id,
        idempotencyKey: args.usageIdempotencyKey,
        metadata: { actual: args.actualCharge, released: split.release, extra: split.extra },
      },
    });

    if (split.extra > 0) {
      await this.wallets.debit(args.tenantId, {
        type: 'USAGE',
        amount: split.extra,
        description: args.description,
        referenceType: 'reservation',
        referenceId: reservation.id,
        idempotencyKey: `${args.usageIdempotencyKey}:extra`,
      });
    }

    return this.prisma.walletReservation.update({
      where: { id: reservation.id },
      data: {
        status: 'CAPTURED',
        capturedAmount: split.charge + split.extra,
      },
    });
  }

  async release(args: { tenantId: string; reservationId: string; idempotencyKey: string }) {
    const reservation = await this.prisma.walletReservation.findFirst({
      where: { id: args.reservationId, tenantId: args.tenantId },
    });
    if (!reservation) throw new BillingUnavailableError();
    if (reservation.status === 'RELEASED' || reservation.status === 'EXPIRED') {
      return reservation;
    }
    if (reservation.status !== 'PENDING') return reservation;

    await this.wallets.adjustReserved(args.tenantId, -toIrt(reservation.amount), {
      type: 'RESERVATION_RELEASE',
      amount: 0,
      description: 'آزادسازی رزرو اعتبار',
      referenceType: 'reservation',
      referenceId: reservation.id,
      idempotencyKey: args.idempotencyKey,
    });

    return this.prisma.walletReservation.update({
      where: { id: reservation.id },
      data: { status: 'RELEASED' },
    });
  }

  async expireDue(tenantId?: string) {
    const now = new Date();
    const due = await this.prisma.walletReservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: now },
        ...(tenantId ? { tenantId } : {}),
      },
      take: 50,
    });
    for (const row of due) {
      try {
        await this.wallets.adjustReserved(row.tenantId, -toIrt(row.amount), {
          type: 'RESERVATION_RELEASE',
          amount: 0,
          description: 'انقضای رزرو اعتبار',
          referenceType: 'reservation',
          referenceId: row.id,
          idempotencyKey: `reservation-expire:${row.id}`,
        });
        await this.prisma.walletReservation.update({
          where: { id: row.id },
          data: { status: 'EXPIRED' },
        });
      } catch (err) {
        this.log.warn(
          `expire reservation ${row.id} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }
}
