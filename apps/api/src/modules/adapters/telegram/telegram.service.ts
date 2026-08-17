import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../../platform/data.store';
import { decryptSecret, encryptSecret } from '../../platform/crypto.util';
import { RuntimeService } from '../../runtime/runtime.service';
import { TelegramBotClient, type TelegramUpdate } from './telegram.client';
import { WebhookEventsService } from '../webhook-events.service';
import { ChannelMenuService } from '../../shop/channel-menu.service';
import {
  CHANNEL_CAPABILITIES,
  formatCheckoutLink,
  isOrdersMenuText,
  isStartCommand,
  isStoreMenuText,
  type IChannelAdapter,
} from '../channel-adapter';

@Injectable()
export class TelegramAdapterService implements Pick<
  IChannelAdapter,
  'channel' | 'capabilities' | 'sendCheckoutLink'
> {
  readonly channel = 'telegram' as const;

  constructor(
    private readonly store: DataStore,
    @Inject(forwardRef(() => RuntimeService))
    private readonly runtime: RuntimeService,
    private readonly config: ConfigService,
    private readonly webhooks: WebhookEventsService,
    private readonly menu: ChannelMenuService,
  ) {}

  capabilities() {
    return CHANNEL_CAPABILITIES.telegram;
  }

  private credentialsSecret() {
    return (
      this.config.get<string>('TELEGRAM_CREDENTIALS_KEY') ??
      this.config.get<string>('JWT_SECRET') ??
      'dev-only-change-me'
    );
  }

  private liveMode() {
    return (this.config.get<string>('TELEGRAM_LIVE') ?? '0') === '1';
  }

  private clientForToken(token: string) {
    return new TelegramBotClient(token, this.liveMode());
  }

  async connect(tenantId: string, botToken: string) {
    const token = botToken.trim();
    if (token.length < 20) {
      throw new BadRequestException('Invalid bot token');
    }
    const client = this.clientForToken(token);
    const me = await client.getMe();
    if (!me.ok) {
      throw new BadRequestException(me.error ?? 'Telegram getMe failed');
    }
    const webhookSecret = uuid().replace(/-/g, '');
    const channel = await this.store.upsertTelegramChannel({
      tenantId,
      credentialsCipher: encryptSecret(token, this.credentialsSecret()),
      webhookSecret,
      botUsername: me.username ?? null,
      status: 'connected',
    });
    const publicBase =
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`;
    return {
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl: `${publicBase}/v1/webhooks/telegram/${channel.id}`,
      webhookSecret,
      live: this.liveMode(),
      note: this.liveMode()
        ? 'Set Telegram webhook to webhookUrl with secret_token=webhookSecret'
        : 'TELEGRAM_LIVE=0 — delivery mocked; use simulate for local smoke',
    };
  }

  async getStatus(tenantId: string) {
    const channel = await this.store.telegramChannel(tenantId);
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
      webhookUrl: `${publicBase}/v1/webhooks/telegram/${channel.id}`,
      hasWebhookSecret: Boolean(channel.webhookSecret),
      live: this.liveMode(),
    };
  }

  async handleWebhook(
    bindingId: string,
    secretHeader: string | undefined,
    update: TelegramUpdate,
  ) {
    const channel = await this.store.channelById(bindingId);
    if (!channel || channel.channel !== 'telegram') {
      throw new NotFoundException('Unknown Telegram binding');
    }
    if (!channel.webhookSecret || secretHeader !== channel.webhookSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.ingestUpdate(channel.tenantId, channel.id, update);
  }

  async simulate(
    tenantId: string,
    text: string,
    chatId = '10001',
    updateId?: number,
  ) {
    const channel = await this.store.telegramChannel(tenantId);
    if (!channel) throw new NotFoundException('Telegram not connected');
    const update: TelegramUpdate = {
      update_id: updateId ?? Date.now(),
      message: {
        message_id: Date.now(),
        text,
        chat: { id: Number(chatId), type: 'private' },
      },
    };
    return this.ingestUpdate(tenantId, channel.id, update);
  }

  async deliverOperatorReply(
    tenantId: string,
    conversationId: string,
    text: string,
  ) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) return;
    if (conversation.channel !== 'telegram' || !conversation.externalThreadId) {
      return;
    }
    const channel = await this.store.telegramChannel(tenantId);
    if (!channel?.credentialsCipher) return;
    const token = decryptSecret(
      channel.credentialsCipher,
      this.credentialsSecret(),
    );
    const client = this.clientForToken(token);
    const sent = await client.sendMessage(conversation.externalThreadId, text);
    if (!sent.ok) {
      await this.store.setChannelStatus(channel.id, 'degraded');
    }
  }

  async sendCheckoutLink(input: {
    tenantId: string;
    conversationId: string;
    text: string;
    url: string;
  }) {
    await this.deliverOperatorReply(
      input.tenantId,
      input.conversationId,
      `${input.text}\n${formatCheckoutLink(input.url)}`,
    );
  }

  private async ingestUpdate(
    tenantId: string,
    bindingId: string,
    update: TelegramUpdate,
  ) {
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;
    if (!text || chatId == null) {
      return { ignored: true };
    }

    const claimed = await this.webhooks.claim({
      tenantId,
      provider: 'telegram',
      externalEventId: String(update.update_id),
      payload: update as unknown as Record<string, unknown>,
    });
    if (claimed === 'duplicate') {
      return { duplicate: true };
    }

    const idempotencyKey = `tg:${update.update_id}`;
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
      'telegram',
      String(chatId),
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
      await this.store.addMessage({
        tenantId,
        conversationId: conversation.id,
        role: 'employee',
        content: menuReply.text,
      });
      await this.deliverToChat(bindingId, String(chatId), menuReply.text, menuReply.replyKeyboard);
      await this.webhooks.markProcessed(tenantId, 'telegram', String(update.update_id));
      return {
        conversationId: conversation.id,
        decision: 'channel_menu',
        reply: menuReply.text,
        duplicate: false,
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
        citations: turn.citations,
      });
    }

    await this.deliverToChat(bindingId, String(chatId), turn.reply);
    await this.webhooks.markProcessed(tenantId, 'telegram', String(update.update_id));

    return {
      conversationId: conversation.id,
      decision: turn.decision,
      ownership: turn.ownership ?? conversation.ownership,
      reply: turn.reply,
      duplicate: false,
    };
  }

  private async tryMenu(
    tenantId: string,
    conversation: { id: string; shoppingState: string },
    text: string,
  ) {
    const start = isStartCommand(text);
    const browsing = conversation.shoppingState === 'browsing';
    if (!start && !(browsing && (isStoreMenuText(text) || isOrdersMenuText(text)))) {
      return null;
    }
    if (start) return this.menu.startMenu('telegram');
    if (isStoreMenuText(text)) {
      return { text: await this.menu.storePreview(tenantId, 'telegram') };
    }
    return { text: await this.menu.myOrders(tenantId, conversation.id) };
  }

  private async deliverToChat(
    bindingId: string,
    chatId: string,
    text: string,
    replyKeyboard?: { keyboard: Array<Array<{ text: string }>>; resize_keyboard: true },
  ) {
    const channel = await this.store.channelById(bindingId);
    if (!channel?.credentialsCipher) return;
    const token = decryptSecret(
      channel.credentialsCipher,
      this.credentialsSecret(),
    );
    const client = this.clientForToken(token);
    const sent = await client.sendMessage(
      chatId,
      text,
      replyKeyboard ? { reply_markup: replyKeyboard } : undefined,
    );
    if (!sent.ok) {
      await this.store.setChannelStatus(bindingId, 'degraded');
    }
  }
}

