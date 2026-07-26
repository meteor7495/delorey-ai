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
import { BaleBotClient, type BaleUpdate } from './bale.client';

@Injectable()
export class BaleAdapterService {
  constructor(
    private readonly store: DataStore,
    @Inject(forwardRef(() => RuntimeService))
    private readonly runtime: RuntimeService,
    private readonly config: ConfigService,
  ) {}

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
    const publicBase =
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`;
    return {
      id: channel.id,
      status: channel.status,
      botUsername: channel.botUsername,
      webhookUrl: `${publicBase}/v1/webhooks/bale/${channel.id}`,
      webhookSecret,
      live: this.liveMode(),
      note: this.liveMode()
        ? 'Point Bale webhook to webhookUrl; send secret via X-Bale-Bot-Api-Secret-Token if supported'
        : 'BALE_LIVE=0 — delivery mocked; use simulate for local smoke',
    };
  }

  async getStatus(tenantId: string) {
    const channel = await this.store.baleChannel(tenantId);
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
      webhookUrl: `${publicBase}/v1/webhooks/bale/${channel.id}`,
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
    if (!channel.webhookSecret || secretHeader !== channel.webhookSecret) {
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
      content: text,
      idempotencyKey,
    });

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

    return {
      conversationId: conversation.id,
      decision: turn.decision,
      ownership: turn.ownership ?? conversation.ownership,
      reply: turn.reply,
      duplicate: false,
    };
  }
}
