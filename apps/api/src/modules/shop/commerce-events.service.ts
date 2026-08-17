import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import type { AnalyticsEventName } from './domain/commerce-events';

@Injectable()
export class CommerceEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(input: {
    tenantId: string;
    name: AnalyticsEventName | string;
    channel?: string | null;
    customerId?: string | null;
    conversationId?: string | null;
    orderId?: string | null;
    payload?: Record<string, unknown>;
  }) {
    await this.prisma.analyticsEvent.create({
      data: {
        tenantId: input.tenantId,
        name: input.name,
        channel: input.channel ?? null,
        customerId: input.customerId ?? null,
        conversationId: input.conversationId ?? null,
        orderId: input.orderId ?? null,
        payload: (input.payload ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
