import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import {
  DiscountContext,
  DiscountRule,
  DiscountType,
  DiscountTargetType,
  assertValidDiscount,
  calculateDiscount,
  resolveEffectivePrice,
  selectApplicableDiscounts,
} from './domain';

const DISCOUNT_INCLUDE = { targets: true } satisfies Prisma.DiscountInclude;

type DiscountWithTargets = Prisma.DiscountGetPayload<{
  include: typeof DISCOUNT_INCLUDE;
}>;

const TARGET_TYPES: DiscountTargetType[] = [
  'all',
  'product',
  'category',
  'variant',
];

export interface DiscountTargetInput {
  targetType: string;
  targetId?: string | null;
}

export interface DiscountInput {
  name?: string;
  code?: string | null;
  type?: string;
  value?: number;
  currency?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  minCartAmount?: number | null;
  maxDiscountAmount?: number | null;
  priority?: number;
  stackable?: boolean;
  targets?: DiscountTargetInput[];
}

export interface QuoteInput {
  productId?: string;
  variantId?: string;
  quantity?: number;
  code?: string | null;
  /** Explicit subtotal for cart-level quotes. */
  subtotal?: number;
}

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    const rows = await this.prisma.discount.findMany({
      where: { tenantId },
      include: DISCOUNT_INCLUDE,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((r) => this.map(r));
  }

  async get(tenantId: string, id: string) {
    const row = await this.prisma.discount.findFirst({
      where: { id, tenantId },
      include: DISCOUNT_INCLUDE,
    });
    if (!row) throw new NotFoundException('تخفیف پیدا نشد');
    return this.map(row);
  }

  async create(tenantId: string, body: DiscountInput) {
    const name = (body.name ?? '').trim();
    if (!name) throw new BadRequestException('نام تخفیف الزامی است');

    const type = this.normalizeType(body.type);
    const value = Number(body.value);
    const startsAt = this.parseDate(body.startsAt, 'تاریخ شروع');
    const endsAt = this.parseDate(body.endsAt, 'تاریخ پایان');

    // Backend is the only authority on discount validity.
    assertValidDiscount({
      type,
      value,
      startsAt,
      endsAt,
      minCartAmount: body.minCartAmount ?? null,
      maxDiscountAmount: body.maxDiscountAmount ?? null,
    });

    const code = this.normalizeCode(body.code);
    if (code) await this.assertCodeFree(tenantId, code);

    const row = await this.prisma.discount.create({
      data: {
        tenantId,
        name,
        code,
        type,
        value: new Prisma.Decimal(value),
        currency: body.currency ?? 'IRR',
        startsAt,
        endsAt,
        active: body.active ?? true,
        usageLimit: body.usageLimit ?? null,
        perCustomerLimit: body.perCustomerLimit ?? null,
        minCartAmount:
          body.minCartAmount != null
            ? new Prisma.Decimal(body.minCartAmount)
            : null,
        maxDiscountAmount:
          body.maxDiscountAmount != null
            ? new Prisma.Decimal(body.maxDiscountAmount)
            : null,
        priority: body.priority ?? 0,
        stackable: body.stackable ?? false,
        targets: {
          create: await this.buildTargets(tenantId, body.targets),
        },
      },
      include: DISCOUNT_INCLUDE,
    });
    return this.map(row);
  }

  async update(tenantId: string, id: string, body: DiscountInput) {
    const existing = await this.prisma.discount.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('تخفیف پیدا نشد');

    const type = body.type ? this.normalizeType(body.type) : (existing.type as DiscountType);
    const value = body.value != null ? Number(body.value) : Number(existing.value);
    const startsAt =
      body.startsAt === undefined
        ? existing.startsAt
        : this.parseDate(body.startsAt, 'تاریخ شروع');
    const endsAt =
      body.endsAt === undefined
        ? existing.endsAt
        : this.parseDate(body.endsAt, 'تاریخ پایان');

    assertValidDiscount({
      type,
      value,
      startsAt,
      endsAt,
      minCartAmount: body.minCartAmount ?? null,
      maxDiscountAmount: body.maxDiscountAmount ?? null,
    });

    let code = existing.code;
    if (body.code !== undefined) {
      code = this.normalizeCode(body.code);
      if (code && code !== existing.code) {
        await this.assertCodeFree(tenantId, code);
      }
    }

    if (body.targets !== undefined) {
      await this.prisma.discountTarget.deleteMany({
        where: { tenantId, discountId: id },
      });
    }

    const row = await this.prisma.discount.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        code,
        type,
        value: new Prisma.Decimal(value),
        currency: body.currency ?? existing.currency,
        startsAt,
        endsAt,
        active: body.active ?? existing.active,
        usageLimit:
          body.usageLimit === undefined ? existing.usageLimit : body.usageLimit,
        perCustomerLimit:
          body.perCustomerLimit === undefined
            ? existing.perCustomerLimit
            : body.perCustomerLimit,
        minCartAmount:
          body.minCartAmount === undefined
            ? existing.minCartAmount
            : body.minCartAmount == null
              ? null
              : new Prisma.Decimal(body.minCartAmount),
        maxDiscountAmount:
          body.maxDiscountAmount === undefined
            ? existing.maxDiscountAmount
            : body.maxDiscountAmount == null
              ? null
              : new Prisma.Decimal(body.maxDiscountAmount),
        priority: body.priority ?? existing.priority,
        stackable: body.stackable ?? existing.stackable,
        ...(body.targets !== undefined
          ? { targets: { create: await this.buildTargets(tenantId, body.targets) } }
          : {}),
      },
      include: DISCOUNT_INCLUDE,
    });
    return this.map(row);
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.discount.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('تخفیف پیدا نشد');
    await this.prisma.discount.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Evaluation ────────────────────────────────────────────────────

  /** Rules loaded once and evaluated by the shared domain calculator. */
  private async rulesFor(tenantId: string): Promise<DiscountRule[]> {
    const rows = await this.prisma.discount.findMany({
      where: { tenantId, active: true },
      include: DISCOUNT_INCLUDE,
    });
    return rows.map((r) => this.toRule(r));
  }

  async validateCode(tenantId: string, code: string, subtotal = 0) {
    const trimmed = (code ?? '').trim();
    if (!trimmed) throw new BadRequestException('کد تخفیف الزامی است');

    const row = await this.prisma.discount.findFirst({
      where: { tenantId, code: trimmed },
      include: DISCOUNT_INCLUDE,
    });
    if (!row) {
      return { valid: false, reason: 'not_found', discount: null };
    }

    const context: DiscountContext = {
      now: new Date(),
      subtotal,
      code: trimmed,
    };
    const eligible = selectApplicableDiscounts(context, [this.toRule(row)]);
    if (eligible.length === 0) {
      return { valid: false, reason: 'not_applicable', discount: this.map(row) };
    }
    return { valid: true, reason: null, discount: this.map(row) };
  }

  /**
   * Server-side quote. The frontend and the AI runtime both display this —
   * neither computes prices itself.
   */
  async quote(tenantId: string, input: QuoteInput) {
    const quantity = Math.max(input.quantity ?? 1, 1);
    let subtotal = input.subtotal ?? 0;
    let productId = input.productId ?? null;
    let variantId = input.variantId ?? null;
    let categoryId: string | null = null;
    let currency = 'IRR';
    let unitPrice: number | null = null;

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: variantId, tenantId },
        include: {
          product: {
            select: {
              id: true,
              price: true,
              currency: true,
              categoryId: true,
            },
          },
        },
      });
      if (!variant) throw new NotFoundException('تنوع محصول پیدا نشد');
      productId = variant.product.id;
      categoryId = variant.product.categoryId;
      currency = variant.product.currency;
      unitPrice = resolveEffectivePrice({
        productPrice: Number(variant.product.price),
        variantPrice: variant.price != null ? Number(variant.price) : null,
      });
      subtotal = unitPrice * quantity;
    } else if (productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, tenantId },
        select: { id: true, price: true, currency: true, categoryId: true },
      });
      if (!product) throw new NotFoundException('محصول پیدا نشد');
      categoryId = product.categoryId;
      currency = product.currency;
      unitPrice = resolveEffectivePrice({ productPrice: Number(product.price) });
      subtotal = unitPrice * quantity;
    }

    const context: DiscountContext = {
      now: new Date(),
      subtotal,
      currency,
      productId,
      variantId,
      categoryId,
      code: input.code ?? null,
    };

    const calculation = calculateDiscount(context, await this.rulesFor(tenantId));

    return {
      productId,
      variantId,
      quantity,
      currency,
      unitPrice,
      ...calculation,
    };
  }

  async applicableFor(
    tenantId: string,
    input: { productId?: string | null; variantId?: string | null; subtotal: number; categoryId?: string | null },
  ) {
    const context: DiscountContext = {
      now: new Date(),
      subtotal: input.subtotal,
      productId: input.productId ?? null,
      variantId: input.variantId ?? null,
      categoryId: input.categoryId ?? null,
    };
    const rules = selectApplicableDiscounts(context, await this.rulesFor(tenantId));
    return rules.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code ?? null,
      type: r.type,
      value: r.value,
      priority: r.priority ?? 0,
      stackable: r.stackable ?? false,
    }));
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private normalizeType(type?: string): DiscountType {
    if (type === 'percentage' || type === 'fixed') return type;
    throw new BadRequestException('نوع تخفیف باید percentage یا fixed باشد');
  }

  private normalizeCode(code?: string | null): string | null {
    if (code == null) return null;
    const trimmed = code.trim().toUpperCase();
    return trimmed || null;
  }

  private parseDate(value: string | null | undefined, field: string) {
    if (value == null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} نامعتبر است`);
    }
    return date;
  }

  private async assertCodeFree(tenantId: string, code: string) {
    const clash = await this.prisma.discount.findFirst({
      where: { tenantId, code },
      select: { id: true },
    });
    if (clash) throw new BadRequestException('این کد تخفیف قبلاً ثبت شده است');
  }

  private async buildTargets(
    tenantId: string,
    targets?: DiscountTargetInput[],
  ) {
    if (!targets || targets.length === 0) {
      return [{ tenantId, targetType: 'all', targetId: null }];
    }

    const seen = new Set<string>();
    const rows: Array<{
      tenantId: string;
      targetType: string;
      targetId: string | null;
    }> = [];

    for (const target of targets) {
      const targetType = target.targetType as DiscountTargetType;
      if (!TARGET_TYPES.includes(targetType)) {
        throw new BadRequestException('نوع هدف تخفیف نامعتبر است');
      }
      const targetId = targetType === 'all' ? null : (target.targetId ?? null);
      if (targetType !== 'all' && !targetId) {
        throw new BadRequestException('شناسه هدف تخفیف الزامی است');
      }

      const key = `${targetType}:${targetId ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (targetId) await this.assertTargetExists(tenantId, targetType, targetId);
      rows.push({ tenantId, targetType, targetId });
    }

    return rows;
  }

  private async assertTargetExists(
    tenantId: string,
    targetType: DiscountTargetType,
    targetId: string,
  ) {
    const found =
      targetType === 'product'
        ? await this.prisma.product.count({ where: { tenantId, id: targetId } })
        : targetType === 'category'
          ? await this.prisma.category.count({ where: { tenantId, id: targetId } })
          : await this.prisma.productVariant.count({
              where: { tenantId, id: targetId },
            });
    if (found === 0) throw new BadRequestException('هدف تخفیف پیدا نشد');
  }

  private toRule(row: DiscountWithTargets): DiscountRule {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type as DiscountType,
      value: Number(row.value),
      currency: row.currency,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      active: row.active,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      minCartAmount:
        row.minCartAmount != null ? Number(row.minCartAmount) : null,
      maxDiscountAmount:
        row.maxDiscountAmount != null ? Number(row.maxDiscountAmount) : null,
      priority: row.priority,
      stackable: row.stackable,
      targets: row.targets.map((t) => ({
        targetType: t.targetType as DiscountTargetType,
        targetId: t.targetId,
      })),
    };
  }

  private map(row: DiscountWithTargets) {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type,
      value: Number(row.value),
      currency: row.currency,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
      active: row.active,
      usageLimit: row.usageLimit,
      perCustomerLimit: row.perCustomerLimit,
      usedCount: row.usedCount,
      minCartAmount:
        row.minCartAmount != null ? Number(row.minCartAmount) : null,
      maxDiscountAmount:
        row.maxDiscountAmount != null ? Number(row.maxDiscountAmount) : null,
      priority: row.priority,
      stackable: row.stackable,
      targets: row.targets.map((t) => ({
        id: t.id,
        targetType: t.targetType,
        targetId: t.targetId,
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
