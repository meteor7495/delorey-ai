import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';
import { decryptSecret } from '../platform/crypto.util';
import { TelegramBotClient } from '../adapters/telegram/telegram.client';
import { BaleBotClient } from '../adapters/bale/bale.client';
import { BoxApiClient } from '../adapters/instagram/boxapi.client';
import {
  analyticsEventForOrderStatus,
  orderStatusNotifyBody,
  type AnalyticsEventName,
} from './domain/commerce-events';
import { CommerceEventsService } from './commerce-events.service';

@Injectable()
export class NotificationService {
  private readonly log = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly store: DataStore,
    private readonly events: CommerceEventsService,
  ) {}

  async onOrderTransition(order: {
    id: string;
    tenantId: string;
    orderNumber: string;
    status: string;
    channel: string;
    customerId: string | null;
    rejectionReason?: string | null;
  }) {
    const event = analyticsEventForOrderStatus(order.status);
    if (!event) return;
    await this.events.track({
      tenantId: order.tenantId,
      name: event,
      channel: order.channel,
      customerId: order.customerId,
      orderId: order.id,
    });
    const body = orderStatusNotifyBody(
      order.orderNumber,
      event,
      order.rejectionReason ?? undefined,
    );
    if (body) await this.enqueueChannel(order, event, body);
  }

  async notify(input: {
    tenantId: string;
    channel: string;
    customerId?: string | null;
    orderId?: string | null;
    kind: AnalyticsEventName | string;
    body: string;
  }) {
    await this.enqueueChannel(
      {
        id: input.orderId ?? '',
        tenantId: input.tenantId,
        channel: input.channel,
        customerId: input.customerId ?? null,
      },
      input.kind,
      input.body,
    );
  }

  private async enqueueChannel(
    order: {
      id: string;
      tenantId: string;
      channel: string;
      customerId: string | null;
    },
    kind: string,
    body: string,
  ) {
    if (
      order.channel !== 'telegram' &&
      order.channel !== 'bale' &&
      order.channel !== 'instagram'
    ) {
      return;
    }
    const conversation = order.customerId
      ? await this.prisma.conversation.findFirst({
          where: {
            tenantId: order.tenantId,
            channel: order.channel,
            customerId: order.customerId,
          },
          orderBy: { updatedAt: 'desc' },
        })
      : null;
    const row = await this.prisma.notificationOutbox.create({
      data: {
        tenantId: order.tenantId,
        channel: order.channel,
        conversationId: conversation?.id ?? null,
        orderId: order.id || null,
        kind,
        body,
        status: 'pending',
      },
    });
    await this.deliver(row.id);
  }

  async deliver(outboxId: string) {
    const row = await this.prisma.notificationOutbox.findUnique({
      where: { id: outboxId },
    });
    if (!row || row.status === 'sent') return;
    await this.prisma.notificationOutbox.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    try {
      const conversation = row.conversationId
        ? await this.prisma.conversation.findUnique({
            where: { id: row.conversationId },
          })
        : null;
      const threadId = conversation?.externalThreadId;
      if (!threadId) {
        throw new Error('no_conversation_thread');
      }
      const ok = await this.send(row.tenantId, row.channel, threadId, row.body);
      if (!ok) throw new Error('channel_send_failed');
      await this.prisma.notificationOutbox.update({
        where: { id: row.id },
        data: { status: 'sent', sentAt: new Date(), lastError: null },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'send_failed';
      this.log.warn(`notify ${row.id} failed: ${message}`);
      await this.prisma.notificationOutbox.update({
        where: { id: row.id },
        data: { status: 'failed', lastError: message },
      });
    }
  }

  private async send(
    tenantId: string,
    channel: string,
    threadId: string,
    body: string,
  ): Promise<boolean> {
    if (channel === 'telegram') {
      const binding = await this.store.telegramChannel(tenantId);
      if (!binding?.credentialsCipher) return false;
      const token = decryptSecret(
        binding.credentialsCipher,
        this.config.get<string>('TELEGRAM_CREDENTIALS_KEY') ??
          this.config.get<string>('JWT_SECRET') ??
          'dev-only-change-me',
      );
      const live = (this.config.get<string>('TELEGRAM_LIVE') ?? '0') === '1';
      const sent = await new TelegramBotClient(token, live).sendMessage(
        threadId,
        body,
      );
      return sent.ok;
    }
    if (channel === 'bale') {
      const binding = await this.store.baleChannel(tenantId);
      if (!binding?.credentialsCipher) return false;
      const token = decryptSecret(
        binding.credentialsCipher,
        this.config.get<string>('BALE_CREDENTIALS_KEY') ??
          this.config.get<string>('TELEGRAM_CREDENTIALS_KEY') ??
          this.config.get<string>('JWT_SECRET') ??
          'dev-only-change-me',
      );
      const live = (this.config.get<string>('BALE_LIVE') ?? '0') === '1';
      const sent = await new BaleBotClient(token, live).sendMessage(
        threadId,
        body,
      );
      return sent.ok;
    }
    if (channel === 'instagram') {
      const live = (this.config.get<string>('BOXAPI_LIVE') ?? '0') === '1';
      const sent = await new BoxApiClient(
        this.config.get<string>('BOXAPI_API_KEY') ?? '',
        this.config.get<string>('BOXAPI_BASE_URL') ?? '',
        live,
      ).sendText({
        accountId: tenantId,
        recipientId: threadId,
        message: body,
      });
      return sent.ok;
    }
    return false;
  }
}
