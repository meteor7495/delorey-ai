import {
  BadRequestException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../platform/prisma.service';
import { CartService } from './cart.service';
import { CommerceEventsService } from './commerce-events.service';
import {
  hashCheckoutToken,
  inferCartChannel,
  issueCheckoutToken,
  verifyCheckoutToken,
} from './domain';

const TTL_MS = 45 * 60 * 1000;

@Injectable()
export class CheckoutSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly carts: CartService,
    private readonly events: CommerceEventsService,
  ) {}

  private secret() {
    return (
      this.config.get<string>('CHECKOUT_TOKEN_SECRET') ??
      this.config.get<string>('JWT_SECRET') ??
      'dev-only-change-me'
    );
  }

  private storefrontBase() {
    return (
      this.config.get<string>('STOREFRONT_BASE_URL') ?? 'http://localhost:3020'
    ).replace(/\/$/, '');
  }

  async create(input: {
    tenantId: string;
    sessionId: string;
    storeSlug: string;
    channel?: string;
  }) {
    const cartRow = await this.prisma.cart.findUnique({
      where: {
        tenantId_sessionId: {
          tenantId: input.tenantId,
          sessionId: input.sessionId,
        },
      },
      include: { items: true },
    });
    if (!cartRow || cartRow.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }

    const { token, hash } = issueCheckoutToken(this.secret());
    const expiresAt = new Date(Date.now() + TTL_MS);
    const channel = input.channel ?? inferCartChannel(input.sessionId);

    await this.prisma.hostedCheckoutSession.create({
      data: {
        tenantId: input.tenantId,
        cartId: cartRow.id,
        customerId: cartRow.customerId,
        channel,
        tokenHash: hash,
        expiresAt,
        status: 'pending',
      },
    });

    const url = `${this.storefrontBase()}/s/${input.storeSlug}/checkout?token=${encodeURIComponent(token)}`;
    await this.events.track({
      tenantId: input.tenantId,
      name: 'checkout_started',
      channel,
      customerId: cartRow.customerId,
    });
    return {
      url,
      expiresAt: expiresAt.toISOString(),
      channel,
    };
  }

  async hydrate(token: string) {
    if (!verifyCheckoutToken(token, this.secret())) {
      throw new UnauthorizedException('لینک تسویه نامعتبر است');
    }
    const row = await this.prisma.hostedCheckoutSession.findUnique({
      where: { tokenHash: hashCheckoutToken(token) },
    });
    if (!row) throw new NotFoundException('نشست تسویه پیدا نشد');
    if (row.status === 'consumed') {
      throw new GoneException('این لینک قبلاً استفاده شده است');
    }
    if (row.expiresAt.getTime() < Date.now() || row.status === 'expired') {
      if (row.status === 'pending') {
        await this.prisma.hostedCheckoutSession.update({
          where: { id: row.id },
          data: { status: 'expired' },
        });
      }
      throw new GoneException('لینک تسویه منقضی شده است');
    }

    const cart = await this.prisma.cart.findFirst({
      where: { id: row.cartId, tenantId: row.tenantId },
    });
    if (!cart) throw new NotFoundException('سبد خرید پیدا نشد');

    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId: row.tenantId },
    });
    const mapped = await this.carts.getOrCreate(row.tenantId, cart.sessionId);
    return {
      storeSlug: settings?.storeSlug ?? 'shop',
      sessionId: cart.sessionId,
      channel: row.channel,
      expiresAt: row.expiresAt.toISOString(),
      cart: mapped,
    };
  }

  async consume(token: string | undefined | null) {
    if (!token) return;
    if (!verifyCheckoutToken(token, this.secret())) return;
    const hash = hashCheckoutToken(token);
    const row = await this.prisma.hostedCheckoutSession.findUnique({
      where: { tokenHash: hash },
    });
    if (!row || row.status !== 'pending') return;
    await this.prisma.hostedCheckoutSession.update({
      where: { id: row.id },
      data: { status: 'consumed', consumedAt: new Date() },
    });
  }
}
