import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataStore } from '../../platform/data.store';
import { ConversationService } from '../../conversation/conversation.service';
import { RuntimeService } from '../../runtime/runtime.service';

/** Simple per-key sliding window for public chat abuse (MVP, in-process). */
const RATE = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

@Injectable()
export class WebsiteAdapterService {
  constructor(
    private readonly store: DataStore,
    private readonly conversations: ConversationService,
    private readonly runtime: RuntimeService,
  ) {}

  async createSession(publicKey: string, origin?: string) {
    const channel = await this.store.channelByPublicKey(publicKey);
    if (!channel || channel.channel !== 'website') {
      throw new NotFoundException('Unknown public key');
    }
    this.assertOrigin(channel.allowedOrigins, origin);
    this.assertRate(`session:${publicKey}:${origin ?? 'none'}`);

    const conversation = await this.conversations.createWebsiteConversation(
      channel.tenantId,
    );
    const employee = await this.store.employeeForTenant(channel.tenantId);
    return {
      conversationId: conversation.id,
      employee: employee?.name ?? 'کارمند فروش',
      status: employee?.status ?? 'inactive',
    };
  }

  async sendMessage(
    publicKey: string,
    conversationId: string,
    text: string,
    origin?: string,
  ) {
    const channel = await this.store.channelByPublicKey(publicKey);
    if (!channel) throw new NotFoundException('Unknown public key');
    this.assertOrigin(channel.allowedOrigins, origin);
    this.assertRate(`msg:${publicKey}:${conversationId}`);

    const conversation = await this.conversations.get(conversationId);
    if (!conversation || conversation.tenantId !== channel.tenantId) {
      throw new ForbiddenException('Conversation tenant mismatch');
    }

    await this.conversations.addMessage({
      conversationId,
      tenantId: channel.tenantId,
      role: 'shopper',
      content: text,
    });

    const turn = await this.runtime.executeTurn(
      channel.tenantId,
      conversationId,
      text,
    );

    if (turn.decision.startsWith('escalated:')) {
      const messages = await this.conversations.listMessages(
        channel.tenantId,
        conversationId,
      );
      const last = messages[messages.length - 1]!;
      return {
        message: last,
        decision: turn.decision,
        aiState: 'awaiting_human',
        ownership: 'human_owned' as const,
      };
    }

    const reply = await this.conversations.addMessage({
      conversationId,
      tenantId: channel.tenantId,
      role: turn.decision === 'paused_human_owned' ? 'system' : 'employee',
      content: turn.reply,
      citations: turn.citations,
    });

    const employee = await this.store.employeeForTenant(channel.tenantId);
    const ownership =
      turn.ownership ??
      (await this.store.getConversation(conversationId))?.ownership ??
      'ai_owned';

    return {
      message: reply,
      decision: turn.decision,
      aiState:
        ownership === 'human_owned'
          ? 'awaiting_human'
          : (employee?.status ?? 'active'),
      ownership,
    };
  }

  /**
   * Tenant allowlist is the gate. CORS may reflect many origins so embeds work;
   * this check rejects wrong storefronts even if CORS allowed the request.
   */
  private assertOrigin(allowed: string[], origin?: string) {
    const normalizedAllowed = allowed
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean);
    const hasAllowlist = normalizedAllowed.length > 0;

    if (!origin) {
      // Browsers send Origin on cross-origin POSTs. Missing Origin is typical of
      // same-origin / server-side / non-browser clients — allow only in non-prod.
      if (process.env.NODE_ENV === 'production' && hasAllowlist) {
        throw new ForbiddenException('Origin header required');
      }
      return;
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (
      normalizedAllowed.some(
        (a) => a.toLowerCase() === normalizedOrigin.toLowerCase(),
      )
    ) {
      return;
    }

    // Local snippet testing (file:// → Origin "null", arbitrary localhost ports)
    if (process.env.NODE_ENV !== 'production') {
      if (normalizedOrigin === 'null') return;
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin)) {
        return;
      }
    }

    throw new ForbiddenException(
      `Origin not allowed: ${origin}. دامنه فروشگاه را در کانال‌ها → دامنه‌های مجاز اضافه کنید.`,
    );
  }

  private assertRate(key: string) {
    const now = Date.now();
    const row = RATE.get(key);
    if (!row || row.resetAt <= now) {
      RATE.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return;
    }
    row.count += 1;
    if (row.count > RATE_LIMIT) {
      throw new ForbiddenException(
        'Too many requests — کمی صبر کنید و دوباره تلاش کنید.',
      );
    }
  }
}
