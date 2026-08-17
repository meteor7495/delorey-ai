import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { createHash } from 'crypto';
import { DataStore } from '../../platform/data.store';
import { RuntimeService } from '../../runtime/runtime.service';
import { BoxApiClient } from './boxapi.client';
import { WebhookEventsService } from '../webhook-events.service';
import { ChannelMenuService } from '../../shop/channel-menu.service';
import {
  CHANNEL_CAPABILITIES,
  isOrdersMenuText,
  isStartCommand,
  isStoreMenuText,
} from '../channel-adapter';

@Injectable()
export class InstagramAdapterService {
  readonly channel = 'instagram' as const;

  constructor(
    private readonly store: DataStore,
    @Inject(forwardRef(() => RuntimeService))
    private readonly runtime: RuntimeService,
    private readonly config: ConfigService,
    private readonly webhooks: WebhookEventsService,
    private readonly menu: ChannelMenuService,
  ) {}

  capabilities() {
    return CHANNEL_CAPABILITIES.instagram;
  }

  private live() {
    return (this.config.get<string>('BOXAPI_LIVE') ?? '0') === '1';
  }

  private client() {
    return new BoxApiClient(
      this.config.get<string>('BOXAPI_API_KEY') ?? '',
      this.config.get<string>('BOXAPI_BASE_URL') ?? '',
      this.live(),
    );
  }

  async connect(tenantId: string, pageLabel?: string) {
    const webhookSecret = uuid().replace(/-/g, '');
    const channel = await this.store.upsertInstagramChannel({
      tenantId,
      webhookSecret,
      botUsername: pageLabel?.trim() || 'instagram',
      status: 'connected',
    });
    const publicBase =
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`;
    return {
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl: `${publicBase}/v1/webhooks/instagram/${channel.id}`,
      webhookSecret,
      live: this.live(),
      note: this.live()
        ? 'وب‌هوک BoxAPI را به webhookUrl بفرستید'
        : 'BOXAPI_LIVE=0 — از simulate برای تست محلی استفاده کنید',
    };
  }

  async getStatus(tenantId: string) {
    const channel = await this.store.instagramChannel(tenantId);
    if (!channel) {
      return { status: 'disconnected' as const, connected: false };
    }
    const publicBase =
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`;
    return {
      connected: true,
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl: `${publicBase}/v1/webhooks/instagram/${channel.id}`,
      hasWebhookSecret: Boolean(channel.webhookSecret),
      live: this.live(),
    };
  }

  async handleWebhook(
    bindingId: string,
    secretHeader: string | undefined,
    body: Record<string, unknown>,
  ) {
    const channel = await this.store.channelById(bindingId);
    if (!channel || channel.channel !== 'instagram') {
      throw new NotFoundException('Unknown Instagram binding');
    }
    if (!channel.webhookSecret || secretHeader !== channel.webhookSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    const parsed = this.parseInbound(body);
    if (!parsed) return { ignored: true };
    const eventId = this.eventId(body, parsed.threadId);
    const claimed = await this.webhooks.claim({
      tenantId: channel.tenantId,
      provider: 'instagram',
      externalEventId: eventId,
      payload: body,
    });
    if (claimed === 'duplicate') return { duplicate: true };
    const result = await this.ingest(
      channel.tenantId,
      parsed.threadId,
      parsed.text,
      `ig:${eventId}`,
    );
    await this.webhooks.markProcessed(channel.tenantId, 'instagram', eventId);
    return result;
  }

  async simulate(tenantId: string, text: string, threadId = 'ig-user-1') {
    const channel = await this.store.instagramChannel(tenantId);
    if (!channel) throw new NotFoundException('اینستاگرام متصل نیست');
    return this.ingest(tenantId, threadId, text, `ig-sim:${Date.now()}`);
  }

  async deliverOperatorReply(
    tenantId: string,
    conversationId: string,
    text: string,
  ) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) return;
    if (conversation.channel !== 'instagram' || !conversation.externalThreadId) {
      return;
    }
    await this.client().sendText({
      accountId: conversation.tenantId,
      recipientId: conversation.externalThreadId,
      message: text,
    });
  }

  private parseInbound(body: Record<string, unknown>): {
    threadId: string;
    text: string;
  } | null {
    const message =
      (body.message as Record<string, unknown> | undefined) ??
      (body.data as Record<string, unknown> | undefined) ??
      body;
    const text = String(
      message?.text ?? message?.message ?? body.text ?? '',
    ).trim();
    const threadId = String(
      message?.sender_id ??
        message?.from_id ??
        message?.user_id ??
        body.sender_id ??
        body.from ??
        '',
    );
    if (!text || !threadId) return null;
    return { threadId, text };
  }

  private async ingest(
    tenantId: string,
    threadId: string,
    text: string,
    idempotencyKey: string,
  ) {
    const existingMsg = await this.store.findMessageByIdempotency(
      tenantId,
      idempotencyKey,
    );
    if (existingMsg) {
      return {
        duplicate: true,
        conversationId: existingMsg.conversationId,
        messageId: existingMsg.id,
      };
    }

    const conversation = await this.store.getOrCreateExternalConversation(
      tenantId,
      'instagram',
      threadId,
    );
    await this.store.addMessage({
      tenantId,
      conversationId: conversation.id,
      role: 'shopper',
      content: text,
      idempotencyKey,
    });

    const menuReply = await this.tryMenu(tenantId, conversation, text);
    if (menuReply) {
      let reply = menuReply;
      if (isStartCommand(text) && CHANNEL_CAPABILITIES.instagram.supportsCheckoutLink) {
        reply = `${menuReply}\n\nخرید در اینستاگرام از طریق لینک تسویه وب‌سایت انجام می‌شود.`;
      }
      await this.store.addMessage({
        tenantId,
        conversationId: conversation.id,
        role: 'employee',
        content: reply,
      });
      await this.client().sendText({
        accountId: tenantId,
        recipientId: threadId,
        message: reply,
      });
      return {
        conversationId: conversation.id,
        decision: 'channel_menu',
        reply,
      };
    }

    const turn = await this.runtime.executeTurn(
      tenantId,
      conversation.id,
      text,
    );
    if (!turn.decision.startsWith('escalated:')) {
      await this.store.addMessage({
        tenantId,
        conversationId: conversation.id,
        role: turn.decision === 'paused_human_owned' ? 'system' : 'employee',
        content: turn.reply,
      });
      const sent = await this.client().sendText({
        accountId: tenantId,
        recipientId: threadId,
        message: turn.reply,
      });
      if (!sent.ok) {
        const channel = await this.store.instagramChannel(tenantId);
        if (channel) await this.store.setChannelStatus(channel.id, 'degraded');
      }
    }
    return {
      conversationId: conversation.id,
      decision: turn.decision,
      reply: turn.reply,
    };
  }

  private eventId(body: Record<string, unknown>, threadId: string): string {
    const nested = (body.message as Record<string, unknown> | undefined) ?? body;
    const mid = nested.mid ?? nested.message_id ?? body.id ?? body.event_id;
    if (typeof mid === 'string' && mid.trim()) return mid.trim();
    if (typeof mid === 'number') return String(mid);
    return createHash('sha256')
      .update(`${threadId}:${JSON.stringify(body)}`)
      .digest('hex')
      .slice(0, 40);
  }

  private async tryMenu(
    tenantId: string,
    conversation: { id: string; shoppingState: string },
    text: string,
  ): Promise<string | null> {
    const start = isStartCommand(text);
    const browsing = conversation.shoppingState === 'browsing';
    if (!start && !(browsing && (isStoreMenuText(text) || isOrdersMenuText(text)))) {
      return null;
    }
    if (start) return this.menu.startMenu('instagram').text;
    if (isStoreMenuText(text)) return this.menu.storePreview(tenantId, 'instagram');
    return this.menu.myOrders(tenantId, conversation.id);
  }
}
