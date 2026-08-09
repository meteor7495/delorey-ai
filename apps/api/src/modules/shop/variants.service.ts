import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { InventoryService } from './inventory.service';
import {
  AttributeSelection,
  availableStock,
  buildOptionsKey,
  buildVariantSku,
  diffCombinations,
  generateCombinations,
  normalizeSku,
  resolveEffectivePrice,
  stockState,
} from './domain';

const VARIANT_INCLUDE = {
  attributeValues: {
    include: {
      attribute: { select: { id: true, name: true, sortOrder: true } },
      attributeValue: { select: { id: true, value: true, label: true, colorHex: true } },
    },
  },
  inventoryLevel: true,
} satisfies Prisma.ProductVariantInclude;

type VariantWithRefs = Prisma.ProductVariantGetPayload<{
  include: typeof VARIANT_INCLUDE;
}>;

export interface VariantInput {
  sku?: string;
  barcode?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  weightGrams?: number | null;
  imageUrl?: string | null;
  active?: boolean;
  sortOrder?: number;
  /** Attribute value ids that define the combination (create only). */
  attributeValueIds?: string[];
  /** Convenience: set stock while editing a variant. */
  onHand?: number;
  lowStockThreshold?: number;
}

@Injectable()
export class VariantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {}

  async listForProduct(tenantId: string, productId: string) {
    await this.requireProduct(tenantId, productId);
    const rows = await this.prisma.productVariant.findMany({
      where: { tenantId, productId },
      include: VARIANT_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { sku: 'asc' }],
    });
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { price: true, currency: true },
    });
    return rows.map((r) => this.map(r, Number(product.price), product.currency));
  }

  async get(tenantId: string, variantId: string) {
    const row = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
      include: {
        ...VARIANT_INCLUDE,
        product: { select: { price: true, currency: true } },
      },
    });
    if (!row) throw new NotFoundException('تنوع محصول پیدا نشد');
    return this.map(row, Number(row.product.price), row.product.currency);
  }

  /**
   * Generate the missing combinations for the selected attribute values.
   * Existing variants are never touched, so regenerating is safe.
   */
  async generate(
    tenantId: string,
    productId: string,
    selections: AttributeSelection[],
    opts: { removeMissing?: boolean } = {},
  ) {
    const product = await this.requireProduct(tenantId, productId);
    await this.assertValuesBelongToTenant(tenantId, selections);

    const requested = generateCombinations(selections);
    if (requested.length === 0) {
      throw new BadRequestException('حداقل یک مقدار ویژگی انتخاب کنید');
    }

    const existing = await this.prisma.productVariant.findMany({
      where: { tenantId, productId },
      select: { id: true, optionsKey: true },
    });
    const diff = diffCombinations(
      existing.map((v) => v.optionsKey),
      requested,
    );

    const valueLabels = await this.valueLabelMap(tenantId, selections);
    const attributeOf = await this.attributeOfValueMap(tenantId, selections);

    let created = 0;
    for (const [index, combination] of diff.toCreate.entries()) {
      const labels = combination.valueIds.map(
        (id) => valueLabels.get(id) ?? id,
      );
      const sku = await this.uniqueSku(
        tenantId,
        buildVariantSku(product.sku, labels) || `${product.sku}-${index + 1}`,
      );

      const variant = await this.prisma.productVariant.create({
        data: {
          tenantId,
          productId,
          sku,
          optionsKey: combination.optionsKey,
          sortOrder: existing.length + index,
          attributeValues: {
            create: combination.valueIds.map((attributeValueId) => ({
              tenantId,
              attributeId: attributeOf.get(attributeValueId) as string,
              attributeValueId,
            })),
          },
        },
      });
      await this.inventory.ensureLevel(tenantId, productId, variant.id);
      created += 1;
    }

    let removed = 0;
    if (opts.removeMissing && diff.toRemove.length > 0) {
      const result = await this.prisma.productVariant.deleteMany({
        where: { tenantId, productId, optionsKey: { in: diff.toRemove } },
      });
      removed = result.count;
    }

    await this.syncProductVariantFlag(tenantId, productId);
    await this.inventory.refreshProductProjection(tenantId, productId);

    return {
      created,
      removed,
      unchanged: diff.unchanged.length,
      variants: await this.listForProduct(tenantId, productId),
    };
  }

  async create(tenantId: string, productId: string, body: VariantInput) {
    const product = await this.requireProduct(tenantId, productId);

    const valueIds = [...new Set(body.attributeValueIds ?? [])];
    if (valueIds.length === 0) {
      throw new BadRequestException('حداقل یک مقدار ویژگی الزامی است');
    }
    const attributeOf = await this.attributeOfValueMap(tenantId, [
      { attributeId: '', valueIds },
    ]);
    const optionsKey = buildOptionsKey(valueIds);

    const duplicate = await this.prisma.productVariant.findFirst({
      where: { tenantId, productId, optionsKey },
      select: { id: true },
    });
    if (duplicate) {
      throw new BadRequestException('این ترکیب ویژگی قبلاً ثبت شده است');
    }

    const labels = await this.valueLabelMap(tenantId, [
      { attributeId: '', valueIds },
    ]);
    const sku = await this.uniqueSku(
      tenantId,
      body.sku ||
        buildVariantSku(
          product.sku,
          valueIds.map((id) => labels.get(id) ?? id),
        ),
    );

    const variant = await this.prisma.productVariant.create({
      data: {
        tenantId,
        productId,
        sku,
        optionsKey,
        barcode: body.barcode ?? null,
        price: this.decimalOrNull(body.price),
        compareAtPrice: this.decimalOrNull(body.compareAtPrice),
        costPrice: this.decimalOrNull(body.costPrice),
        weightGrams: body.weightGrams ?? null,
        imageUrl: body.imageUrl ?? null,
        active: body.active ?? true,
        sortOrder: body.sortOrder ?? 0,
        attributeValues: {
          create: valueIds.map((attributeValueId) => ({
            tenantId,
            attributeId: attributeOf.get(attributeValueId) as string,
            attributeValueId,
          })),
        },
      },
    });

    await this.inventory.ensureLevel(tenantId, productId, variant.id);
    if (body.onHand != null) {
      await this.inventory.adjust(tenantId, {
        variantId: variant.id,
        setTo: body.onHand,
        type: 'initial',
        reason: 'موجودی اولیه تنوع',
      });
    }
    await this.syncProductVariantFlag(tenantId, productId);
    await this.inventory.refreshProductProjection(tenantId, productId);

    return this.get(tenantId, variant.id);
  }

  async update(tenantId: string, variantId: string, body: VariantInput) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
    });
    if (!existing) throw new NotFoundException('تنوع محصول پیدا نشد');

    const sku = body.sku
      ? await this.uniqueSku(tenantId, body.sku, variantId)
      : existing.sku;

    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: {
        sku,
        barcode: body.barcode === undefined ? existing.barcode : body.barcode,
        price:
          body.price === undefined
            ? existing.price
            : this.decimalOrNull(body.price),
        compareAtPrice:
          body.compareAtPrice === undefined
            ? existing.compareAtPrice
            : this.decimalOrNull(body.compareAtPrice),
        costPrice:
          body.costPrice === undefined
            ? existing.costPrice
            : this.decimalOrNull(body.costPrice),
        weightGrams:
          body.weightGrams === undefined
            ? existing.weightGrams
            : body.weightGrams,
        imageUrl:
          body.imageUrl === undefined ? existing.imageUrl : body.imageUrl,
        active: body.active ?? existing.active,
        sortOrder: body.sortOrder ?? existing.sortOrder,
      },
    });

    if (body.onHand != null) {
      await this.inventory.adjust(tenantId, {
        variantId,
        setTo: body.onHand,
        lowStockThreshold: body.lowStockThreshold,
        type: 'adjustment',
        reason: 'ویرایش تنوع',
      });
    } else if (body.lowStockThreshold != null) {
      const level = await this.inventory.ensureLevel(
        tenantId,
        existing.productId,
        variantId,
      );
      await this.inventory.setThreshold(
        tenantId,
        level.id,
        body.lowStockThreshold,
      );
    }

    await this.inventory.refreshProductProjection(tenantId, existing.productId);
    return this.get(tenantId, variantId);
  }

  /** Inline grid editing — one round trip for many variants. */
  async bulkUpdate(
    tenantId: string,
    productId: string,
    items: Array<VariantInput & { id: string }>,
  ) {
    await this.requireProduct(tenantId, productId);
    if (items.length === 0) {
      throw new BadRequestException('هیچ تنوعی برای به‌روزرسانی ارسال نشده');
    }

    const ids = items.map((i) => i.id);
    const owned = await this.prisma.productVariant.findMany({
      where: { tenantId, productId, id: { in: ids } },
      select: { id: true },
    });
    if (owned.length !== ids.length) {
      throw new BadRequestException('برخی تنوع‌ها متعلق به این محصول نیستند');
    }

    for (const item of items) {
      const { id, ...patch } = item;
      await this.update(tenantId, id, patch);
    }

    return this.listForProduct(tenantId, productId);
  }

  async remove(tenantId: string, variantId: string) {
    const existing = await this.prisma.productVariant.findFirst({
      where: { id: variantId, tenantId },
      select: { id: true, productId: true },
    });
    if (!existing) throw new NotFoundException('تنوع محصول پیدا نشد');

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    await this.syncProductVariantFlag(tenantId, existing.productId);
    await this.inventory.refreshProductProjection(tenantId, existing.productId);
    return { ok: true };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private async requireProduct(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true, sku: true, source: true, price: true, currency: true },
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد');
    if (product.source !== 'native') {
      throw new BadRequestException(
        'فقط محصولات بومی می‌توانند تنوع داشته باشند',
      );
    }
    return product;
  }

  /**
   * Keeps Product.hasVariants truthful and drops the product-level stock row
   * once variants own the inventory.
   */
  private async syncProductVariantFlag(tenantId: string, productId: string) {
    const count = await this.prisma.productVariant.count({
      where: { tenantId, productId },
    });
    await this.prisma.product.updateMany({
      where: { id: productId, tenantId },
      data: { hasVariants: count > 0 },
    });
    if (count > 0) {
      await this.inventory.dropProductLevel(tenantId, productId);
    } else {
      await this.inventory.ensureLevel(tenantId, productId, null);
    }
  }

  private async assertValuesBelongToTenant(
    tenantId: string,
    selections: AttributeSelection[],
  ) {
    const ids = [...new Set(selections.flatMap((s) => s.valueIds))];
    if (ids.length === 0) return;
    const found = await this.prisma.attributeValue.count({
      where: { tenantId, id: { in: ids } },
    });
    if (found !== ids.length) {
      throw new BadRequestException('برخی مقادیر ویژگی معتبر نیستند');
    }
  }

  private async valueLabelMap(
    tenantId: string,
    selections: AttributeSelection[],
  ) {
    const ids = [...new Set(selections.flatMap((s) => s.valueIds))];
    const rows = await this.prisma.attributeValue.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, value: true, label: true },
    });
    return new Map(rows.map((r) => [r.id, r.label || r.value]));
  }

  private async attributeOfValueMap(
    tenantId: string,
    selections: AttributeSelection[],
  ) {
    const ids = [...new Set(selections.flatMap((s) => s.valueIds))];
    const rows = await this.prisma.attributeValue.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, attributeId: true },
    });
    if (rows.length !== ids.length) {
      throw new BadRequestException('برخی مقادیر ویژگی معتبر نیستند');
    }
    return new Map(rows.map((r) => [r.id, r.attributeId]));
  }

  private async uniqueSku(tenantId: string, desired: string, skipId?: string) {
    const base = normalizeSku(desired) || 'VAR';
    let sku = base;
    let n = 2;
    for (;;) {
      const [variantClash, productClash] = await Promise.all([
        this.prisma.productVariant.findFirst({
          where: { tenantId, sku, ...(skipId ? { NOT: { id: skipId } } : {}) },
          select: { id: true },
        }),
        this.prisma.product.findFirst({
          where: { tenantId, sku },
          select: { id: true },
        }),
      ]);
      if (!variantClash && !productClash) return sku;
      sku = `${base}-${n++}`;
    }
  }

  private decimalOrNull(value?: number | null) {
    if (value == null) return null;
    return new Prisma.Decimal(value);
  }

  map(
    row: VariantWithRefs,
    productPrice: number,
    currency: string,
  ) {
    const level = row.inventoryLevel;
    const available = level ? availableStock(level) : 0;
    const variantPrice = row.price != null ? Number(row.price) : null;

    return {
      id: row.id,
      productId: row.productId,
      sku: row.sku,
      barcode: row.barcode,
      optionsKey: row.optionsKey,
      price: variantPrice,
      effectivePrice: resolveEffectivePrice({ productPrice, variantPrice }),
      compareAtPrice:
        row.compareAtPrice != null ? Number(row.compareAtPrice) : null,
      costPrice: row.costPrice != null ? Number(row.costPrice) : null,
      currency,
      weightGrams: row.weightGrams,
      imageUrl: row.imageUrl,
      active: row.active,
      sortOrder: row.sortOrder,
      options: [...row.attributeValues]
        .sort((a, b) => a.attribute.sortOrder - b.attribute.sortOrder)
        .map((v) => ({
          attributeId: v.attribute.id,
          attributeName: v.attribute.name,
          attributeValueId: v.attributeValue.id,
          value: v.attributeValue.value,
          label: v.attributeValue.label,
          colorHex: v.attributeValue.colorHex,
        })),
      inventory: level
        ? {
            id: level.id,
            onHand: level.onHand,
            reserved: level.reserved,
            available,
            lowStockThreshold: level.lowStockThreshold,
            state: stockState({
              available,
              lowStockThreshold: level.lowStockThreshold,
            }),
          }
        : null,
    };
  }
}
