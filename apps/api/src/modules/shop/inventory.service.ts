import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import {
  InventoryTransactionType,
  INVENTORY_TRANSACTION_TYPES,
  applyAdjustment,
  availableStock,
  computeSetQuantityDelta,
  isInStock,
  stockState,
} from './domain';

export interface InventoryFilters {
  q?: string;
  categoryId?: string;
  productId?: string;
  /** in_stock | low_stock | out_of_stock */
  state?: string;
  limit?: number;
  offset?: number;
}

const LEVEL_INCLUDE = {
  product: {
    select: {
      id: true,
      title: true,
      sku: true,
      categoryId: true,
      costPrice: true,
      source: true,
      status: true,
    },
  },
  variant: {
    select: {
      id: true,
      sku: true,
      costPrice: true,
      active: true,
      attributeValues: {
        select: {
          attribute: { select: { id: true, name: true } },
          attributeValue: { select: { id: true, value: true, label: true } },
        },
      },
    },
  },
} satisfies Prisma.InventoryLevelInclude;

type LevelWithRefs = Prisma.InventoryLevelGetPayload<{
  include: typeof LEVEL_INCLUDE;
}>;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Settings ──────────────────────────────────────────────────────

  async commerceSettings(tenantId: string) {
    const row = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId },
      select: {
        lowStockThreshold: true,
        allowNegativeInventory: true,
        defaultCurrency: true,
        defaultProductStatus: true,
      },
    });
    return {
      lowStockThreshold: row?.lowStockThreshold ?? 5,
      allowNegativeInventory: row?.allowNegativeInventory ?? false,
      defaultCurrency: row?.defaultCurrency ?? 'IRR',
      defaultProductStatus: row?.defaultProductStatus ?? 'draft',
    };
  }

  // ─── Level lifecycle ───────────────────────────────────────────────

  /** Idempotent — the partial unique index is the real guarantee. */
  async ensureLevel(
    tenantId: string,
    productId: string,
    variantId: string | null,
  ) {
    const existing = await this.prisma.inventoryLevel.findFirst({
      where: { tenantId, productId, variantId },
    });
    if (existing) return existing;

    const settings = await this.commerceSettings(tenantId);
    try {
      return await this.prisma.inventoryLevel.create({
        data: {
          tenantId,
          productId,
          variantId,
          onHand: 0,
          reserved: 0,
          lowStockThreshold: settings.lowStockThreshold,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const row = await this.prisma.inventoryLevel.findFirst({
          where: { tenantId, productId, variantId },
        });
        if (row) return row;
      }
      throw e;
    }
  }

  /**
   * Product.inStock stays a derived projection so the storefront and the AI
   * runtime keep working without knowing about inventory levels.
   */
  async refreshProductProjection(tenantId: string, productId: string) {
    const levels = await this.prisma.inventoryLevel.findMany({
      where: { tenantId, productId },
      select: { onHand: true, reserved: true },
    });
    if (levels.length === 0) return;

    const anyAvailable = levels.some((l) => isInStock(availableStock(l)));
    await this.prisma.product.updateMany({
      where: { id: productId, tenantId },
      data: { inStock: anyAvailable },
    });
  }

  // ─── Reads ─────────────────────────────────────────────────────────

  async summary(tenantId: string) {
    const [productCount, variantCount, levels] = await Promise.all([
      this.prisma.product.count({ where: { tenantId, source: 'native' } }),
      this.prisma.productVariant.count({ where: { tenantId } }),
      this.prisma.inventoryLevel.findMany({
        where: { tenantId },
        select: {
          onHand: true,
          reserved: true,
          lowStockThreshold: true,
          product: { select: { costPrice: true } },
          variant: { select: { costPrice: true } },
        },
      }),
    ]);

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inventoryValue = 0;

    for (const level of levels) {
      const available = availableStock(level);
      const state = stockState({
        available,
        lowStockThreshold: level.lowStockThreshold,
      });
      if (state === 'in_stock') inStock += 1;
      else if (state === 'low_stock') lowStock += 1;
      else outOfStock += 1;

      const cost = level.variant?.costPrice ?? level.product?.costPrice ?? null;
      if (cost != null) inventoryValue += Number(cost) * level.onHand;
    }

    return {
      productCount,
      variantCount,
      trackedCount: levels.length,
      inStock,
      lowStock,
      outOfStock,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
    };
  }

  async list(tenantId: string, filters: InventoryFilters = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 25, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);

    const where: Prisma.InventoryLevelWhereInput = { tenantId };
    if (filters.productId) where.productId = filters.productId;
    if (filters.categoryId) {
      where.product = { categoryId: filters.categoryId };
    }
    if (filters.q) {
      const q = filters.q.trim();
      where.OR = [
        { product: { title: { contains: q, mode: 'insensitive' } } },
        { product: { sku: { contains: q, mode: 'insensitive' } } },
        { variant: { sku: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Stock state depends on onHand - reserved, which SQL filters cannot
    // express here, so state filtering happens after mapping.
    const stateFilter = filters.state;
    if (!stateFilter) {
      const [rows, total] = await Promise.all([
        this.prisma.inventoryLevel.findMany({
          where,
          include: LEVEL_INCLUDE,
          orderBy: [{ product: { title: 'asc' } }, { variantId: 'asc' }],
          skip: offset,
          take: limit,
        }),
        this.prisma.inventoryLevel.count({ where }),
      ]);
      return { items: rows.map((r) => this.mapLevel(r)), total, limit, offset };
    }

    const rows = await this.prisma.inventoryLevel.findMany({
      where,
      include: LEVEL_INCLUDE,
      orderBy: [{ product: { title: 'asc' } }, { variantId: 'asc' }],
    });
    const mapped = rows
      .map((r) => this.mapLevel(r))
      .filter((r) => r.state === stateFilter);

    return {
      items: mapped.slice(offset, offset + limit),
      total: mapped.length,
      limit,
      offset,
    };
  }

  async transactions(
    tenantId: string,
    opts: {
      inventoryLevelId?: string;
      productId?: string;
      variantId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const limit = Math.min(Math.max(opts.limit ?? 25, 1), 100);
    const offset = Math.max(opts.offset ?? 0, 0);

    const where: Prisma.InventoryTransactionWhereInput = { tenantId };
    if (opts.inventoryLevelId) where.inventoryLevelId = opts.inventoryLevelId;
    if (opts.productId || opts.variantId) {
      where.inventoryLevel = {
        productId: opts.productId,
        variantId: opts.variantId,
      };
    }

    const [rows, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          inventoryLevel: {
            select: {
              productId: true,
              variantId: true,
              product: { select: { title: true, sku: true } },
              variant: { select: { sku: true } },
            },
          },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      items: rows.map((r) => ({
        id: r.id,
        inventoryLevelId: r.inventoryLevelId,
        type: r.type,
        quantityDelta: r.quantityDelta,
        resultingOnHand: r.resultingOnHand,
        reason: r.reason,
        referenceType: r.referenceType,
        referenceId: r.referenceId,
        actorUserId: r.actorUserId,
        createdAt: r.createdAt.toISOString(),
        productId: r.inventoryLevel.productId,
        variantId: r.inventoryLevel.variantId,
        productTitle: r.inventoryLevel.product?.title ?? null,
        sku: r.inventoryLevel.variant?.sku ?? r.inventoryLevel.product?.sku ?? null,
      })),
      total,
      limit,
      offset,
    };
  }

  // ─── Writes ────────────────────────────────────────────────────────

  /**
   * Single entry point for stock changes — always writes an append-only
   * ledger row alongside the new quantity.
   */
  async adjust(
    tenantId: string,
    input: {
      productId?: string;
      variantId?: string | null;
      inventoryLevelId?: string;
      delta?: number;
      setTo?: number;
      type?: string;
      reason?: string | null;
      referenceType?: string | null;
      referenceId?: string | null;
      lowStockThreshold?: number;
      actorUserId?: string | null;
    },
  ) {
    const level = await this.resolveLevel(tenantId, input);
    const settings = await this.commerceSettings(tenantId);

    if (input.delta == null && input.setTo == null) {
      throw new BadRequestException('مقدار تغییر یا موجودی جدید الزامی است');
    }

    const delta =
      input.setTo != null
        ? computeSetQuantityDelta({
            currentOnHand: level.onHand,
            targetOnHand: input.setTo,
          })
        : (input.delta as number);

    const lowStockThreshold =
      input.lowStockThreshold ?? level.lowStockThreshold;

    const result = applyAdjustment({
      level: { onHand: level.onHand, reserved: level.reserved },
      delta,
      lowStockThreshold,
      allowNegativeInventory: settings.allowNegativeInventory,
    });

    const type = this.normalizeType(input.type);

    const [updated] = await this.prisma.$transaction([
      this.prisma.inventoryLevel.update({
        where: { id: level.id },
        data: { onHand: result.onHand, lowStockThreshold },
      }),
      this.prisma.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryLevelId: level.id,
          type,
          quantityDelta: delta,
          resultingOnHand: result.onHand,
          reason: input.reason ?? null,
          referenceType: input.referenceType ?? null,
          referenceId: input.referenceId ?? null,
          actorUserId: input.actorUserId ?? null,
        },
      }),
    ]);

    await this.refreshProductProjection(tenantId, level.productId);

    const full = await this.prisma.inventoryLevel.findUniqueOrThrow({
      where: { id: updated.id },
      include: LEVEL_INCLUDE,
    });
    return this.mapLevel(full);
  }

  async setThreshold(
    tenantId: string,
    inventoryLevelId: string,
    lowStockThreshold: number,
  ) {
    if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      throw new BadRequestException('آستانه موجودی کم نامعتبر است');
    }
    const level = await this.prisma.inventoryLevel.findFirst({
      where: { id: inventoryLevelId, tenantId },
    });
    if (!level) throw new NotFoundException('رکورد موجودی پیدا نشد');

    await this.prisma.inventoryLevel.update({
      where: { id: level.id },
      data: { lowStockThreshold },
    });
    const full = await this.prisma.inventoryLevel.findUniqueOrThrow({
      where: { id: level.id },
      include: LEVEL_INCLUDE,
    });
    return this.mapLevel(full);
  }

  async decrementInTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    lines: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      title: string;
    }>,
    reference: { orderId: string; orderNumber: string },
  ) {
    const settings = await this.commerceSettings(tenantId);
    const productIds = new Set<string>();
    for (const line of lines) {
      const level = await this.resolveLevelIn(
        tx,
        tenantId,
        line.variantId
          ? { variantId: line.variantId }
          : { productId: line.productId },
      );
      if (level.onHand <= 0) {
        continue;
      }
      const result = applyAdjustment({
        level: { onHand: level.onHand, reserved: level.reserved },
        delta: -line.quantity,
        lowStockThreshold: level.lowStockThreshold,
        allowNegativeInventory: settings.allowNegativeInventory,
      });
      await tx.inventoryLevel.update({
        where: { id: level.id },
        data: { onHand: result.onHand },
      });
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryLevelId: level.id,
          type: 'sale',
          quantityDelta: -line.quantity,
          resultingOnHand: result.onHand,
          reason: `فروش سفارش ${reference.orderNumber}`,
          referenceType: 'storefront_order',
          referenceId: reference.orderId,
        },
      });
      productIds.add(level.productId);
    }
    return [...productIds];
  }

  async restockOrder(tenantId: string, orderId: string, orderNumber: string) {
    const items = await this.prisma.storefrontOrderItem.findMany({
      where: { orderId },
    });
    for (const item of items) {
      if (!item.productId) continue;
      try {
        await this.adjust(tenantId, {
          productId: item.variantId ? undefined : item.productId,
          variantId: item.variantId ?? undefined,
          delta: item.quantity,
          type: 'return',
          referenceType: 'storefront_order',
          referenceId: orderId,
          reason: `برگشت موجودی لغو ${orderNumber}`,
        });
      } catch {
        // already restocked or untracked
      }
    }
  }

  private async resolveLevelIn(
    db: Prisma.TransactionClient,
    tenantId: string,
    input: { productId?: string; variantId?: string | null },
  ) {
    if (input.variantId) {
      const variant = await db.productVariant.findFirst({
        where: { id: input.variantId, tenantId },
        select: { id: true, productId: true },
      });
      if (!variant) throw new NotFoundException('تنوع محصول پیدا نشد');
      let level = await db.inventoryLevel.findFirst({
        where: {
          tenantId,
          productId: variant.productId,
          variantId: variant.id,
        },
      });
      if (!level) {
        const settings = await this.commerceSettings(tenantId);
        level = await db.inventoryLevel.create({
          data: {
            tenantId,
            productId: variant.productId,
            variantId: variant.id,
            onHand: 0,
            reserved: 0,
            lowStockThreshold: settings.lowStockThreshold,
          },
        });
      }
      return level;
    }
    if (input.productId) {
      let level = await db.inventoryLevel.findFirst({
        where: { tenantId, productId: input.productId, variantId: null },
      });
      if (!level) {
        const settings = await this.commerceSettings(tenantId);
        level = await db.inventoryLevel.create({
          data: {
            tenantId,
            productId: input.productId,
            variantId: null,
            onHand: 0,
            reserved: 0,
            lowStockThreshold: settings.lowStockThreshold,
          },
        });
      }
      return level;
    }
    throw new BadRequestException('شناسه محصول یا تنوع الزامی است');
  }

  /** Removes the product-level row once a product starts using variants. */
  async dropProductLevel(tenantId: string, productId: string) {
    await this.prisma.inventoryLevel.deleteMany({
      where: { tenantId, productId, variantId: null },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private normalizeType(type?: string): InventoryTransactionType {
    if (type && INVENTORY_TRANSACTION_TYPES.includes(type as InventoryTransactionType)) {
      return type as InventoryTransactionType;
    }
    return 'adjustment';
  }

  private async resolveLevel(
    tenantId: string,
    input: {
      inventoryLevelId?: string;
      productId?: string;
      variantId?: string | null;
    },
  ) {
    if (input.inventoryLevelId) {
      const level = await this.prisma.inventoryLevel.findFirst({
        where: { id: input.inventoryLevelId, tenantId },
      });
      if (!level) throw new NotFoundException('رکورد موجودی پیدا نشد');
      return level;
    }

    if (input.variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: { id: input.variantId, tenantId },
        select: { id: true, productId: true },
      });
      if (!variant) throw new NotFoundException('تنوع محصول پیدا نشد');
      return this.ensureLevel(tenantId, variant.productId, variant.id);
    }

    if (input.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: input.productId, tenantId },
        select: { id: true },
      });
      if (!product) throw new NotFoundException('محصول پیدا نشد');
      return this.ensureLevel(tenantId, product.id, null);
    }

    throw new BadRequestException('شناسه محصول یا تنوع الزامی است');
  }

  mapLevel(row: LevelWithRefs) {
    const available = availableStock(row);
    return {
      id: row.id,
      productId: row.productId,
      variantId: row.variantId,
      productTitle: row.product?.title ?? null,
      categoryId: row.product?.categoryId ?? null,
      sku: row.variant?.sku ?? row.product?.sku ?? null,
      options:
        row.variant?.attributeValues.map((v) => ({
          attributeId: v.attribute.id,
          attributeName: v.attribute.name,
          attributeValueId: v.attributeValue.id,
          value: v.attributeValue.value,
          label: v.attributeValue.label,
        })) ?? [],
      onHand: row.onHand,
      reserved: row.reserved,
      available,
      lowStockThreshold: row.lowStockThreshold,
      state: stockState({
        available,
        lowStockThreshold: row.lowStockThreshold,
      }),
      costPrice:
        row.variant?.costPrice != null
          ? Number(row.variant.costPrice)
          : row.product?.costPrice != null
            ? Number(row.product.costPrice)
            : null,
    };
  }
}
