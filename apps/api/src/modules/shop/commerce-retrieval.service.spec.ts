import { describe, expect, it, vi } from 'vitest';
import { CommerceRetrievalService } from './commerce-retrieval.service';

/**
 * These tests protect the two promises the AI runtime relies on:
 * prices arrive already discounted, and only the calling tenant's published
 * catalog is ever returned.
 */

type ProductRow = Record<string, unknown>;
type DiscountRow = Record<string, unknown>;

function product(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p1',
    tenantId: 't1',
    sku: 'SHIRT-1',
    slug: 'shirt-1',
    title: 'پیراهن لینن',
    brand: 'Seloma',
    price: 1_000_000,
    currency: 'IRR',
    status: 'published',
    categoryId: 'c1',
    hasVariants: false,
    inStock: true,
    shortDescription: 'پیراهن نخی',
    description: null,
    tags: ['پیراهن'],
    category: { id: 'c1', name: 'پوشاک' },
    inventoryLevels: [
      { variantId: null, onHand: 10, reserved: 0, lowStockThreshold: 5 },
    ],
    variants: [],
    ...overrides,
  };
}

function discount(overrides: Partial<DiscountRow> = {}): DiscountRow {
  return {
    id: 'd1',
    name: 'جشنواره بهار',
    code: null,
    type: 'percentage',
    value: 20,
    currency: 'IRR',
    startsAt: null,
    endsAt: null,
    active: true,
    usageLimit: null,
    usedCount: 0,
    minCartAmount: null,
    maxDiscountAmount: null,
    priority: 0,
    stackable: false,
    targets: [{ targetType: 'all', targetId: null }],
    ...overrides,
  };
}

function fakeService(options: {
  products?: ProductRow[];
  discounts?: DiscountRow[];
}) {
  const products = options.products ?? [];
  const discounts = options.discounts ?? [];

  const prisma = {
    product: {
      findMany: vi.fn(
        async ({ where, take }: { where: ProductRow; take?: number }) =>
          products
            .filter(
              (p) =>
                p.tenantId === where.tenantId && p.status === where.status,
            )
            .slice(0, take ?? 5),
      ),
      findFirst: vi.fn(async ({ where }: { where: ProductRow }) => {
        const or = where.OR as Array<{ sku?: { equals: string } }>;
        const wanted = or?.[0]?.sku?.equals;
        return (
          products.find(
            (p) =>
              p.tenantId === where.tenantId &&
              p.status === where.status &&
              p.sku === wanted,
          ) ?? null
        );
      }),
    },
    productVariant: { findFirst: vi.fn(async () => null) },
    discount: {
      findMany: vi.fn(async ({ where }: { where: ProductRow }) =>
        discounts.filter((d) => where.tenantId === 't1' && d.active),
      ),
    },
  };

  const discountsService = { quote: vi.fn(async () => null) };
  const articlesService = { published: vi.fn(async () => []) };

  return new CommerceRetrievalService(
    prisma as unknown as ConstructorParameters<
      typeof CommerceRetrievalService
    >[0],
    discountsService as unknown as ConstructorParameters<
      typeof CommerceRetrievalService
    >[1],
    articlesService as unknown as ConstructorParameters<
      typeof CommerceRetrievalService
    >[2],
  );
}

describe('CommerceRetrievalService.searchProducts', () => {
  it('returns prices with discounts already applied', async () => {
    const service = fakeService({
      products: [product()],
      discounts: [discount()],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.listPrice).toBe(1_000_000);
    expect(facts?.finalPrice).toBe(800_000);
    expect(facts?.discountAmount).toBe(200_000);
    expect(facts?.appliedDiscounts[0]?.name).toBe('جشنواره بهار');
  });

  it('leaves the price alone when no discount is eligible', async () => {
    const service = fakeService({
      products: [product()],
      discounts: [discount({ active: false })],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.finalPrice).toBe(1_000_000);
    expect(facts?.appliedDiscounts).toEqual([]);
  });

  it('does not apply a coupon-gated discount without the code', async () => {
    const service = fakeService({
      products: [product()],
      discounts: [discount({ code: 'NOWRUZ' })],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');
    expect(facts?.finalPrice).toBe(1_000_000);
  });

  it('resolves stock into a label instead of raw numbers', async () => {
    const service = fakeService({
      products: [
        product({
          inventoryLevels: [
            { variantId: null, onHand: 4, reserved: 1, lowStockThreshold: 5 },
          ],
        }),
      ],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.available).toBe(3);
    expect(facts?.availability).toBe('low_stock');
    expect(facts?.availabilityLabel).toBe('موجودی محدود');
  });

  it('falls back to Product.inStock when the product is not tracked', async () => {
    const service = fakeService({
      products: [product({ inventoryLevels: [], inStock: true })],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.availability).toBe('in_stock');
    expect(facts?.availabilityLabel).toBe('موجود');
    expect(facts?.available).toBeNull();
  });

  it('reports an untracked product as out of stock when the flag is false', async () => {
    const service = fakeService({
      products: [product({ inventoryLevels: [], inStock: false })],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.availability).toBe('out_of_stock');
    expect(facts?.available).toBeNull();
  });

  it('prefers real levels over the flag once a product is tracked', async () => {
    const service = fakeService({
      products: [
        product({
          inStock: true,
          inventoryLevels: [
            { variantId: null, onHand: 0, reserved: 0, lowStockThreshold: 2 },
          ],
        }),
      ],
    });
    const [facts] = await service.searchProducts('t1', 'پیراهن');

    expect(facts?.availability).toBe('out_of_stock');
    expect(facts?.available).toBe(0);
  });

  it('never returns another tenant\u2019s products', async () => {
    const service = fakeService({
      products: [product({ id: 'p2', tenantId: 't2', sku: 'OTHER-1' })],
    });
    expect(await service.searchProducts('t1', 'پیراهن')).toEqual([]);
  });

  it('never returns drafts', async () => {
    const service = fakeService({
      products: [product({ status: 'draft' })],
    });
    expect(await service.searchProducts('t1', 'پیراهن')).toEqual([]);
  });

  it('caps how much catalog can reach the prompt', async () => {
    const service = fakeService({
      products: Array.from({ length: 50 }, (_, i) =>
        product({ id: `p${i}`, sku: `SHIRT-${i}` }),
      ),
    });
    expect(await service.searchProducts('t1', 'پیراهن')).toHaveLength(5);
    expect(
      await service.searchProducts('t1', 'پیراهن', { limit: 999 }),
    ).toHaveLength(20);
  });
});

describe('CommerceRetrievalService.checkAvailability', () => {
  const withVariants = product({
    hasVariants: true,
    inventoryLevels: [
      { variantId: 'v1', onHand: 3, reserved: 0, lowStockThreshold: 1 },
      { variantId: 'v2', onHand: 0, reserved: 0, lowStockThreshold: 1 },
    ],
    variants: [
      {
        id: 'v1',
        sku: 'SHIRT-1-M',
        price: null,
        attributeValues: [
          {
            attribute: { name: 'سایز', sortOrder: 0 },
            attributeValue: { value: 'M', label: null },
          },
        ],
        inventoryLevel: { onHand: 3, reserved: 0, lowStockThreshold: 1 },
      },
      {
        id: 'v2',
        sku: 'SHIRT-1-L',
        price: null,
        attributeValues: [
          {
            attribute: { name: 'سایز', sortOrder: 0 },
            attributeValue: { value: 'L', label: null },
          },
        ],
        inventoryLevel: { onHand: 0, reserved: 0, lowStockThreshold: 1 },
      },
    ],
  });

  it('answers yes for a variant that is in stock', async () => {
    const service = fakeService({ products: [withVariants] });
    const result = await service.checkAvailability('t1', 'SHIRT-1', ['M']);

    expect(result.available).toBe(true);
    expect(result.sku).toBe('SHIRT-1-M');
    expect(result.quantity).toBe(3);
  });

  it('offers alternatives instead of guessing when a size is gone', async () => {
    const service = fakeService({ products: [withVariants] });
    const result = await service.checkAvailability('t1', 'SHIRT-1', ['L']);

    expect(result.available).toBe(false);
    expect(result.quantity).toBe(0);
  });

  it('reports a missing product rather than inventing one', async () => {
    const service = fakeService({ products: [] });
    const result = await service.checkAvailability('t1', 'NOPE');

    expect(result.found).toBe(false);
    expect(result.available).toBe(false);
  });
});
