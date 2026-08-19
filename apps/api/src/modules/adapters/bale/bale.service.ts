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
import {
  BaleBotClient,
  isBaleWebhookAuthorized,
  type BaleUpdate,
} from './bale.client';
import { WebhookEventsService } from '../webhook-events.service';
import { ChannelMenuService } from '../../shop/channel-menu.service';
import { normalizeShopperText } from '../../shop/domain';
import {
  CHANNEL_CAPABILITIES,
  isOrdersMenuText,
  isStartCommand,
  isStoreMenuText,
} from '../channel-adapter';

@Injectable()
export class BaleAdapterService {
  readonly channel = 'bale' as const;

  constructor(
    private readonly store: DataStore,
    @Inject(forwardRef(() => RuntimeService))
    private readonly runtime: RuntimeService,
    private readonly config: ConfigService,
    private readonly webhooks: WebhookEventsService,
    private readonly menu: ChannelMenuService,
  ) {}

  capabilities() {
    return CHANNEL_CAPABILITIES.bale;
  }

  private credentialsSecret() {
    return (
      this.config.get<string>('BALE_CREDENTIALS_KEY') ??
      this.config.get<string>('TELEGRAM_CREDENTIALS_KEY') ??
      this.config.get<string>('JWT_SECRET') ??
      'dev-only-change-me'
    );
  }

  private liveMode() {
    return (this.config.get<string>('BALE_LIVE') ?? '0') === '1';
  }

  private clientForToken(token: string) {
    return new BaleBotClient(token, this.liveMode());
  }

  private publicBase() {
    const raw =
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`;
    return raw.replace(/\/+$/, '');
  }

  private webhookUrlFor(channelId: string) {
    return `${this.publicBase()}/v1/webhooks/bale/${channelId}`;
  }

  private decryptStoredToken(cipher: string): string {
    try {
      return decryptSecret(cipher, this.credentialsSecret());
    } catch {
      throw new BadRequestException(
        'Stored Bale token cannot be decrypted — reconnect in Workspace with the bot token',
      );
    }
  }

  async connect(tenantId: string, botToken: string) {
    const token = botToken.trim();
    if (token.length < 20) {
      throw new BadRequestException('Invalid bot token');
    }
    const client = this.clientForToken(token);
    const me = await client.getMe();
    if (!me.ok) {
      throw new BadRequestException(me.error ?? 'Bale getMe failed');
    }
    const webhookSecret = uuid().replace(/-/g, '');
    const channel = await this.store.upsertBaleChannel({
      tenantId,
      credentialsCipher: encryptSecret(token, this.credentialsSecret()),
      webhookSecret,
      botUsername: me.username ?? null,
      status: 'connected',
    });
    const webhookUrl = this.webhookUrlFor(channel.id);
    if (this.liveMode()) {
      const hooked = await client.setWebhook(webhookUrl);
      if (!hooked.ok) {
        throw new BadRequestException(hooked.error ?? 'Bale setWebhook failed');
      }
    }
    return {
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl,
      webhookSecret,
      live: this.liveMode(),
      webhookSet: this.liveMode(),
      note: this.liveMode()
        ? 'Bale webhook registered at webhookUrl'
        : 'BALE_LIVE=0 — delivery mocked; use simulate for local smoke',
    };
  }

  async registerWebhook(tenantId: string) {
    const channel = await this.store.baleChannel(tenantId);
    if (!channel) throw new NotFoundException('Bale not connected');
    if (!channel.credentialsCipher) {
      throw new BadRequestException('No Bale token stored — connect first');
    }
    const token = this.decryptStoredToken(channel.credentialsCipher);
    if (token.includes('DEV_MOCK') || token.startsWith('0000000000:')) {
      throw new BadRequestException(
        'Mock token stored — paste the real bot token and Connect',
      );
    }
    const webhookUrl = this.webhookUrlFor(channel.id);
    const hooked = await this.clientForToken(token).setWebhook(webhookUrl);
    if (!hooked.ok) {
      throw new BadRequestException(hooked.error ?? 'Bale setWebhook failed');
    }
    return {
      webhookUrl,
      webhookSet: true,
      live: this.liveMode(),
    };
  }

  async getStatus(tenantId: string) {
    const channel = await this.store.baleChannel(tenantId);
    if (!channel) {
      return { status: 'disconnected' as const, connected: false };
    }
    const webhookUrl = this.webhookUrlFor(channel.id);
    let registeredUrl: string | null = null;
    if (this.liveMode() && channel.credentialsCipher) {
      try {
        const token = decryptSecret(
          channel.credentialsCipher,
          this.credentialsSecret(),
        );
        const info = await this.clientForToken(token).getWebhookInfo();
        if (info.ok) registeredUrl = info.url ?? null;
      } catch {
        registeredUrl = null;
      }
    }
    return {
      connected: true,
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl,
      registeredUrl,
      webhookSet: Boolean(registeredUrl) && registeredUrl === webhookUrl,
      hasWebhookSecret: Boolean(channel.webhookSecret),
      live: this.liveMode(),
    };
  }

  async handleWebhook(
    bindingId: string,
    secretHeader: string | undefined,
    update: BaleUpdate,
  ) {
    const channel = await this.store.channelById(bindingId);
    if (!channel || channel.channel !== 'bale') {
      throw new NotFoundException('Unknown Bale binding');
    }
    if (!isBaleWebhookAuthorized(channel.webhookSecret, secretHeader)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return this.ingestUpdate(channel.tenantId, channel.id, update);
  }

  async simulate(
    tenantId: string,
    text: string,
    chatId = '20001',
    updateId?: number,
  ) {
    const channel = await this.store.baleChannel(tenantId);
    if (!channel) throw new NotFoundException('Bale not connected');
    const update: BaleUpdate = {
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
    if (conversation.channel !== 'bale' || !conversation.externalThreadId) {
      return;
    }
    const channel = await this.store.baleChannel(tenantId);
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

  private async ingestUpdate(
    tenantId: string,
    bindingId: string,
    update: BaleUpdate,
  ) {
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;
    if (!text || chatId == null) {
      return { ignored: true };
    }
    const normalized = normalizeShopperText(text);

    const claimed = await this.webhooks.claim({
      tenantId,
      provider: 'bale',
      externalEventId: String(update.update_id),
      payload: update,
    });
    if (claimed === 'duplicate') {
      return { duplicate: true };
    }

    const idempotencyKey = `bale:${update.update_id}`;
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
      'bale',
      String(chatId),
    );

    await this.store.addMessage({
      tenantId,
      conversationId: conversation.id,
      role: 'shopper',
      content: normalized,
      idempotencyKey,
    });

    const menuReply = await this.tryMenu(tenantId, conversation, normalized);
    if (menuReply) {
      await this.store.addMessage({
        tenantId,
        conversationId: conversation.id,
        role: 'employee',
        content: menuReply,
      });
      await this.deliverToChat(bindingId, String(chatId), menuReply);
      await this.webhooks.markProcessed(tenantId, 'bale', String(update.update_id));
      return {
        conversationId: conversation.id,
        decision: 'channel_menu',
        reply: menuReply,
        duplicate: false,
      };
    }

    const turn = await this.runtime.executeTurn(
      tenantId,
      conversation.id,
      normalized,
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

    const channel = await this.store.channelById(bindingId);
    if (channel?.credentialsCipher) {
      const token = decryptSecret(
        channel.credentialsCipher,
        this.credentialsSecret(),
      );
      const client = this.clientForToken(token);
      const sent = await client.sendMessage(String(chatId), turn.reply);
      if (!sent.ok) {
        await this.store.setChannelStatus(bindingId, 'degraded');
      }
    }

    await this.webhooks.markProcessed(tenantId, 'bale', String(update.update_id));

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
  ): Promise<string | null> {
    const start = isStartCommand(text);
    const browsing = conversation.shoppingState === 'browsing';
    if (!start && !(browsing && (isStoreMenuText(text) || isOrdersMenuText(text)))) {
      return null;
    }
    if (start) return this.menu.startMenu('bale').text;
    if (isStoreMenuText(text)) return this.menu.storePreview(tenantId, 'bale');
    return this.menu.myOrders(tenantId, conversation.id);
  }

  private async deliverToChat(bindingId: string, chatId: string, text: string) {
    const channel = await this.store.channelById(bindingId);
    if (!channel?.credentialsCipher) return;
    const token = decryptSecret(
      channel.credentialsCipher,
      this.credentialsSecret(),
    );
    const client = this.clientForToken(token);
    const sent = await client.sendMessage(chatId, text);
    if (!sent.ok) {
      await this.store.setChannelStatus(bindingId, 'degraded');
    }
  }
}
