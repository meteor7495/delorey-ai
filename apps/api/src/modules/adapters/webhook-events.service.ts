import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';

/**
 * Unique (tenant, provider, externalEventId) so double-delivered webhooks
 * are acknowledged without running the turn twice.
 */
@Injectable()
export class WebhookEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async claim(input: {
    tenantId: string;
    provider: string;
    externalEventId: string;
    payload?: unknown;
  }): Promise<'claimed' | 'duplicate'> {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          tenantId: input.tenantId,
          provider: input.provider,
          externalEventId: input.externalEventId,
          status: 'received',
          payload:
            input.payload === undefined
              ? undefined
              : (input.payload as Prisma.InputJsonValue),
        },
      });
      return 'claimed';
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return 'duplicate';
      }
      throw err;
    }
  }

  async markProcessed(tenantId: string, provider: string, externalEventId: string) {
    await this.prisma.webhookEvent.updateMany({
      where: { tenantId, provider, externalEventId },
      data: { status: 'processed' },
    });
  }
}
