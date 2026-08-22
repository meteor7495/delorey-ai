import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IdentityService } from '../identity/identity.service';
import { PrismaService } from '../platform/prisma.service';
import { BillingService } from '../billing/billing.service';

const PLANS = [
  'site-starter',
  'site-growth',
  'site-pro',
  'ai-sales',
  'ai-business',
  // legacy aliases (still accepted)
  'starter',
  'professional',
  'business',
] as const;

@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly billing: BillingService,
  ) {}

  async submitRequest(body: {
    fullName: string;
    email: string;
    phone: string;
    shopName: string;
    plan: string;
    password: string;
  }) {
    const plan = body.plan.trim().toLowerCase();
    if (!PLANS.includes(plan as (typeof PLANS)[number])) {
      throw new BadRequestException('پلن نامعتبر است');
    }
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    if (password.length < 6) {
      throw new BadRequestException('رمز عبور حداقل ۶ کاراکتر باشد');
    }

    const request = await this.prisma.accessRequest.create({
      data: {
        fullName: body.fullName.trim(),
        email,
        phone: body.phone.trim(),
        shopName: body.shopName.trim(),
        plan,
        status: 'submitted',
      },
    });

    let session: Awaited<ReturnType<IdentityService['signup']>>;
    try {
      session = await this.identity.signup(
        email,
        password,
        body.shopName.trim(),
        { plan, billingStatus: 'pending_payment' },
      );
    } catch (e) {
      await this.prisma.accessRequest.update({
        where: { id: request.id },
        data: {
          status: 'rejected',
          notes: e instanceof ConflictException ? 'email_exists' : 'provision_failed',
        },
      });
      if (e instanceof ConflictException) {
        throw new ConflictException('این ایمیل قبلاً ثبت شده — وارد شوید یا ایمیل دیگری بزنید');
      }
      throw e;
    }

    await this.prisma.accessRequest.update({
      where: { id: request.id },
      data: {
        status: 'provisioned',
        tenantId: session.tenant.id,
      },
    });

    const workspaceBase = (
      process.env.WORKSPACE_BASE_URL ?? 'http://localhost:3010'
    ).replace(/\/$/, '');

    return {
      requestId: request.id,
      plan,
      status: 'provisioned',
      billingStatus: 'pending_payment',
      token: session.token,
      tenant: session.tenant,
      user: session.user,
      paymentHint:
        'پرداخت آنلاین به‌زودی؛ فعلاً می‌توانید فعال‌سازی آزمایشی را بزنید.',
      workspaceAccessUrl: `${workspaceBase}/access?token=${encodeURIComponent(session.token)}`,
    };
  }

  async confirmPayment(requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('درخواست پیدا نشد');
    if (!request.tenantId) {
      throw new BadRequestException('حساب هنوز ساخته نشده است');
    }

    await this.prisma.tenant.update({
      where: { id: request.tenantId },
      data: { billingStatus: 'active', plan: request.plan },
    });
    await this.prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: 'paid' },
    });
    await this.billing.grantSubscriptionCredit(
      request.tenantId,
      request.plan,
      requestId,
    );

    const workspaceBase = (
      process.env.WORKSPACE_BASE_URL ?? 'http://localhost:3010'
    ).replace(/\/$/, '');

    return {
      requestId,
      status: 'paid',
      billingStatus: 'active',
      plan: request.plan,
      message: 'اشتراک فعال شد',
      workspaceLoginUrl: `${workspaceBase}/login`,
    };
  }

  async getRequest(requestId: string) {
    const request = await this.prisma.accessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('درخواست پیدا نشد');
    let billingStatus: string | null = null;
    if (request.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: request.tenantId },
      });
      billingStatus = tenant?.billingStatus ?? null;
    }
    return {
      id: request.id,
      fullName: request.fullName,
      email: request.email,
      shopName: request.shopName,
      plan: request.plan,
      status: request.status,
      billingStatus,
      createdAt: request.createdAt.toISOString(),
    };
  }
}
