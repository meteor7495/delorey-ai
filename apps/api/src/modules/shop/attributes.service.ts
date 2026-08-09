import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../platform/prisma.service';
import { toSlug } from './domain';

const ATTRIBUTE_TYPES = [
  'text',
  'number',
  'select',
  'multi_select',
  'color',
  'boolean',
] as const;

const DISPLAY_TYPES = ['dropdown', 'swatch', 'chip', 'radio'] as const;

type AttributeType = (typeof ATTRIBUTE_TYPES)[number];
type DisplayType = (typeof DISPLAY_TYPES)[number];

const ATTRIBUTE_INCLUDE = {
  values: { orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }] },
} satisfies Prisma.AttributeInclude;

type AttributeWithValues = Prisma.AttributeGetPayload<{
  include: typeof ATTRIBUTE_INCLUDE;
}>;

export interface AttributeInput {
  name?: string;
  slug?: string;
  type?: string;
  displayType?: string;
  sortOrder?: number;
  active?: boolean;
  required?: boolean;
}

export interface AttributeValueInput {
  value?: string;
  label?: string | null;
  colorHex?: string | null;
  sortOrder?: number;
}

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, opts: { activeOnly?: boolean } = {}) {
    const rows = await this.prisma.attribute.findMany({
      where: { tenantId, ...(opts.activeOnly ? { active: true } : {}) },
      include: ATTRIBUTE_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map((r) => this.map(r));
  }

  async get(tenantId: string, id: string) {
    const row = await this.prisma.attribute.findFirst({
      where: { id, tenantId },
      include: ATTRIBUTE_INCLUDE,
    });
    if (!row) throw new NotFoundException('ویژگی پیدا نشد');
    return this.map(row);
  }

  async create(tenantId: string, body: AttributeInput) {
    const name = (body.name ?? '').trim();
    if (!name) throw new BadRequestException('نام ویژگی الزامی است');

    const slug = await this.uniqueSlug(
      tenantId,
      body.slug || toSlug(name, uuid()),
    );

    const row = await this.prisma.attribute.create({
      data: {
        tenantId,
        name,
        slug,
        type: this.normalizeType(body.type),
        displayType: this.normalizeDisplayType(body.displayType),
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
        required: body.required ?? false,
      },
      include: ATTRIBUTE_INCLUDE,
    });
    return this.map(row);
  }

  async update(tenantId: string, id: string, body: AttributeInput) {
    const existing = await this.prisma.attribute.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('ویژگی پیدا نشد');

    const slug = body.slug
      ? await this.uniqueSlug(tenantId, body.slug, id)
      : existing.slug;

    const row = await this.prisma.attribute.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        slug,
        type: body.type ? this.normalizeType(body.type) : existing.type,
        displayType: body.displayType
          ? this.normalizeDisplayType(body.displayType)
          : existing.displayType,
        sortOrder: body.sortOrder ?? existing.sortOrder,
        active: body.active ?? existing.active,
        required: body.required ?? existing.required,
      },
      include: ATTRIBUTE_INCLUDE,
    });
    return this.map(row);
  }

  /**
   * Deleting an attribute that variants are built from would silently corrupt
   * their option keys, so it is blocked while it is in use.
   */
  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.attribute.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('ویژگی پیدا نشد');

    const inUse = await this.prisma.variantAttributeValue.count({
      where: { tenantId, attributeId: id },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        'این ویژگی در تنوع محصولات استفاده شده است؛ ابتدا تنوع‌ها را حذف کنید',
      );
    }

    await this.prisma.attribute.delete({ where: { id } });
    return { ok: true };
  }

  // ─── Values ────────────────────────────────────────────────────────

  async addValue(tenantId: string, attributeId: string, body: AttributeValueInput) {
    const attribute = await this.prisma.attribute.findFirst({
      where: { id: attributeId, tenantId },
    });
    if (!attribute) throw new NotFoundException('ویژگی پیدا نشد');

    const value = (body.value ?? '').trim();
    if (!value) throw new BadRequestException('مقدار ویژگی الزامی است');

    try {
      await this.prisma.attributeValue.create({
        data: {
          tenantId,
          attributeId,
          value,
          label: body.label ?? null,
          colorHex: body.colorHex ?? null,
          sortOrder: body.sortOrder ?? 0,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('این مقدار قبلاً ثبت شده است');
      }
      throw e;
    }

    return this.get(tenantId, attributeId);
  }

  async updateValue(tenantId: string, valueId: string, body: AttributeValueInput) {
    const existing = await this.prisma.attributeValue.findFirst({
      where: { id: valueId, tenantId },
    });
    if (!existing) throw new NotFoundException('مقدار ویژگی پیدا نشد');

    try {
      await this.prisma.attributeValue.update({
        where: { id: valueId },
        data: {
          value: body.value?.trim() ?? existing.value,
          label: body.label === undefined ? existing.label : body.label,
          colorHex:
            body.colorHex === undefined ? existing.colorHex : body.colorHex,
          sortOrder: body.sortOrder ?? existing.sortOrder,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('این مقدار قبلاً ثبت شده است');
      }
      throw e;
    }

    return this.get(tenantId, existing.attributeId);
  }

  async removeValue(tenantId: string, valueId: string) {
    const existing = await this.prisma.attributeValue.findFirst({
      where: { id: valueId, tenantId },
    });
    if (!existing) throw new NotFoundException('مقدار ویژگی پیدا نشد');

    const inUse = await this.prisma.variantAttributeValue.count({
      where: { tenantId, attributeValueId: valueId },
    });
    if (inUse > 0) {
      throw new BadRequestException(
        'این مقدار در تنوع محصولات استفاده شده است؛ ابتدا تنوع‌ها را حذف کنید',
      );
    }

    await this.prisma.attributeValue.delete({ where: { id: valueId } });
    return this.get(tenantId, existing.attributeId);
  }

  // ─── Product assignment ────────────────────────────────────────────

  async listForProduct(tenantId: string, productId: string) {
    const rows = await this.prisma.productAttribute.findMany({
      where: { tenantId, productId },
      include: { attribute: { include: ATTRIBUTE_INCLUDE } },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      sortOrder: r.sortOrder,
      attribute: this.map(r.attribute),
    }));
  }

  /** Replaces the product's attribute set in one call. */
  async setForProduct(
    tenantId: string,
    productId: string,
    attributeIds: string[],
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      select: { id: true },
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد');

    const unique = [...new Set(attributeIds.filter(Boolean))];
    if (unique.length > 0) {
      const found = await this.prisma.attribute.count({
        where: { tenantId, id: { in: unique } },
      });
      if (found !== unique.length) {
        throw new BadRequestException('برخی ویژگی‌ها معتبر نیستند');
      }
    }

    const inUse = await this.prisma.variantAttributeValue.findMany({
      where: { tenantId, variant: { productId } },
      select: { attributeId: true },
      distinct: ['attributeId'],
    });
    const missing = inUse
      .map((r) => r.attributeId)
      .filter((id) => !unique.includes(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        'ویژگی‌هایی که در تنوع‌های موجود استفاده شده‌اند قابل حذف نیستند',
      );
    }

    await this.prisma.$transaction([
      this.prisma.productAttribute.deleteMany({ where: { tenantId, productId } }),
      ...unique.map((attributeId, index) =>
        this.prisma.productAttribute.create({
          data: { tenantId, productId, attributeId, sortOrder: index },
        }),
      ),
    ]);

    return this.listForProduct(tenantId, productId);
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private normalizeType(type?: string): AttributeType {
    if (type && (ATTRIBUTE_TYPES as readonly string[]).includes(type)) {
      return type as AttributeType;
    }
    return 'select';
  }

  private normalizeDisplayType(type?: string): DisplayType {
    if (type && (DISPLAY_TYPES as readonly string[]).includes(type)) {
      return type as DisplayType;
    }
    return 'dropdown';
  }

  private async uniqueSlug(tenantId: string, desired: string, skipId?: string) {
    const base = toSlug(desired, uuid());
    let slug = base;
    let n = 2;
    for (;;) {
      const clash = await this.prisma.attribute.findFirst({
        where: { tenantId, slug, ...(skipId ? { NOT: { id: skipId } } : {}) },
        select: { id: true },
      });
      if (!clash) return slug;
      slug = `${base}-${n++}`;
    }
  }

  private map(row: AttributeWithValues) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      displayType: row.displayType,
      sortOrder: row.sortOrder,
      active: row.active,
      required: row.required,
      values: row.values.map((v) => ({
        id: v.id,
        attributeId: v.attributeId,
        value: v.value,
        label: v.label,
        colorHex: v.colorHex,
        sortOrder: v.sortOrder,
      })),
    };
  }
}
