import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { availableStock, inferCartChannel, resolveEffectivePrice } from './domain';

const CART_INCLUDE = {
  items: {
    include: {
      product: true,
      variant: {
        include: {
          attributeValues: {
            include: {
              attribute: {
                select: { id: true, name: true, sortOrder: true },
              },
              attributeValue: {
                select: {
                  id: true,
                  value: true,
                  label: true,
                  colorHex: true,
                },
              },
            },
          },
          inventoryLevel: true,
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(tenantId: string, sessionId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
      include: CART_INCLUDE,
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          tenantId,
          sessionId,
          channel: inferCartChannel(sessionId),
          status: 'active',
        },
        include: CART_INCLUDE,
      });
    } else if (cart.status !== 'active') {
      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'active' },
        include: CART_INCLUDE,
      });
    }
    return this.map(cart);
  }

  async setItem(
    tenantId: string,
    input: {
      sessionId: string;
      productId: string;
      variantId?: string | null;
      quantity: number;
    },
  ) {
    const sessionId = input.sessionId;
    const productId = input.productId;
    const variantId = input.variantId?.trim() || null;
    const quantity = input.quantity;

    if (!sessionId) throw new BadRequestException('sessionId الزامی است');
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
        status: 'published',
        source: { in: ['native', 'mock'] },
      },
    });
    if (!product) throw new NotFoundException('محصول پیدا نشد');

    if (product.hasVariants && !variantId) {
      throw new BadRequestException('انتخاب تنوع محصول الزامی است');
    }

    let unitPrice = resolveEffectivePrice({
      productPrice: Number(product.price),
    });

    if (variantId) {
      const variant = await this.prisma.productVariant.findFirst({
        where: {
          id: variantId,
          tenantId,
          productId,
          active: true,
        },
        include: { inventoryLevel: true },
      });
      if (!variant) throw new NotFoundException('تنوع محصول پیدا نشد');
      const available = variant.inventoryLevel
        ? availableStock(variant.inventoryLevel)
        : 0;
      if (quantity > 0 && available < quantity) {
        throw new BadRequestException('موجودی این تنوع کافی نیست');
      }
      unitPrice = resolveEffectivePrice({
        productPrice: Number(product.price),
        variantPrice: variant.price != null ? Number(variant.price) : null,
      });
    } else if (quantity > 0) {
      const level = await this.prisma.inventoryLevel.findFirst({
        where: { tenantId, productId, variantId: null },
      });
      if (level) {
        const available = availableStock(level);
        if (available > 0 && available < quantity) {
          throw new BadRequestException('موجودی این محصول کافی نیست');
        }
        if (available <= 0 && !product.inStock) {
          throw new BadRequestException('محصول ناموجود است');
        }
      } else if (!product.inStock) {
        throw new BadRequestException('محصول ناموجود است');
      }
    }

    let cart = await this.prisma.cart.findUnique({
      where: { tenantId_sessionId: { tenantId, sessionId } },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          tenantId,
          sessionId,
          channel: inferCartChannel(sessionId),
          status: 'active',
        },
      });
    } else if (cart.status !== 'active') {
      cart = await this.prisma.cart.update({
        where: { id: cart.id },
        data: { status: 'active' },
      });
    }

    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        ...(variantId ? { variantId } : { variantId: null }),
      },
    });

    const lineTotal = unitPrice * Math.max(quantity, 0);

    if (quantity <= 0) {
      if (existing) {
        await this.prisma.cartItem.delete({ where: { id: existing.id } });
      }
    } else if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity,
          unitPriceSnapshot: new Prisma.Decimal(unitPrice),
          lineTotalSnapshot: new Prisma.Decimal(lineTotal),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          unitPriceSnapshot: new Prisma.Decimal(unitPrice),
          lineTotalSnapshot: new Prisma.Decimal(lineTotal),
        },
      });
    }

    return this.getOrCreate(tenantId, sessionId);
  }

  async markConverted(
    tx: Prisma.TransactionClient,
    cartId: string,
    customerId: string,
  ) {
    await tx.cartItem.deleteMany({ where: { cartId } });
    await tx.cart.update({
      where: { id: cartId },
      data: { status: 'converted', customerId },
    });
  }

  map(cart: {
    id: string;
    sessionId: string;
    channel?: string;
    status?: string;
    customerId?: string | null;
    items: Array<{
      id: string;
      quantity: number;
      variantId?: string | null;
      unitPriceSnapshot?: Prisma.Decimal | null;
      lineTotalSnapshot?: Prisma.Decimal | null;
      product: {
        id: string;
        sku: string;
        slug: string;
        title: string;
        price: Prisma.Decimal;
        currency: string;
        inStock: boolean;
        images: string[];
        hasVariants?: boolean;
      };
      variant?: {
        id: string;
        sku: string;
        price: Prisma.Decimal | null;
        imageUrl: string | null;
        attributeValues: Array<{
          attribute: { id: string; name: string; sortOrder: number };
          attributeValue: {
            id: string;
            value: string;
            label: string | null;
            colorHex: string | null;
          };
        }>;
        inventoryLevel: { onHand: number; reserved: number } | null;
      } | null;
    }>;
  }) {
    const items = cart.items.map((i) => {
      const livePrice = resolveEffectivePrice({
        productPrice: Number(i.product.price),
        variantPrice: i.variant?.price != null ? Number(i.variant.price) : null,
      });
      const unitPrice =
        i.unitPriceSnapshot != null ? Number(i.unitPriceSnapshot) : livePrice;
      const options = (i.variant?.attributeValues ?? [])
        .slice()
        .sort((a, b) => a.attribute.sortOrder - b.attribute.sortOrder)
        .map((v) => ({
          attributeName: v.attribute.name,
          label: v.attributeValue.label || v.attributeValue.value,
        }));
      const available = i.variant?.inventoryLevel
        ? availableStock(i.variant.inventoryLevel)
        : null;
      const lineTotal =
        i.lineTotalSnapshot != null
          ? Number(i.lineTotalSnapshot)
          : unitPrice * i.quantity;
      return {
        id: i.id,
        quantity: i.quantity,
        variantId: i.variantId ?? null,
        product: {
          id: i.product.id,
          sku: i.product.sku,
          slug: i.product.slug,
          title: i.product.title,
          price: Number(i.product.price),
          currency: i.product.currency,
          inStock: i.product.inStock,
          images: i.product.images,
          hasVariants: i.product.hasVariants ?? false,
        },
        variant: i.variant
          ? {
              id: i.variant.id,
              sku: i.variant.sku,
              imageUrl: i.variant.imageUrl,
              options,
              available,
              effectivePrice: unitPrice,
            }
          : null,
        unitPrice,
        lineTotal,
      };
    });
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      channel: cart.channel ?? inferCartChannel(cart.sessionId),
      status: cart.status ?? 'active',
      customerId: cart.customerId ?? null,
      items,
      total: items.reduce((s, i) => s + i.lineTotal, 0),
      currency: items[0]?.product.currency ?? 'IRR',
    };
  }
}
