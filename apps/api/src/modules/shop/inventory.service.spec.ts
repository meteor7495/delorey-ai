import { describe, expect, it, vi } from 'vitest';
import { InventoryService } from './inventory.service';

type Level = {
  id: string;
  tenantId: string;
  productId: string;
  variantId: string | null;
  onHand: number;
  reserved: number;
  lowStockThreshold: number;
};

/**
 * Minimal Prisma stand-in. Every finder honours tenantId so the tests fail
 * loudly if a query ever drops tenant scoping.
 */
function fakePrisma(options: {
  levels?: Level[];
  allowNegativeInventory?: boolean;
}) {
  const levels = options.levels ?? [];
  const transactions: Array<Record<string, unknown>> = [];
  const productUpdates: Array<Record<string, unknown>> = [];

  const match = (where: Record<string, unknown>) =>
    levels.find((level) =>
      Object.entries(where).every(
        ([key, value]) => (level as Record<string, unknown>)[key] === value,
      ),
    );

  const prisma = {
    storefrontSettings: {
      findUnique: vi.fn(async () => ({
        lowStockThreshold: 5,
        allowNegativeInventory: options.allowNegativeInventory ?? false,
        defaultCurrency: 'IRR',
        defaultProductStatus: 'draft',
      })),
    },
    inventoryLevel: {
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        match(where) ?? null,
      ),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        levels.filter((level) =>
          Object.entries(where).every(
            ([key, value]) => (level as Record<string, unknown>)[key] === value,
          ),
        ),
      ),
      findUniqueOrThrow: vi.fn(
        async ({ where }: { where: { id: string } }) => ({
          ...(levels.find((l) => l.id === where.id) as Level),
          product: { title: 'محصول', sku: 'SKU-1', categoryId: null, costPrice: null },
          variant: null,
        }),
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<Level>;
        }) => {
          const level = levels.find((l) => l.id === where.id) as Level;
          Object.assign(level, data);
          return level;
        },
      ),
      create: vi.fn(async ({ data }: { data: Omit<Level, 'id'> }) => {
        const level = { ...data, id: `lvl-${levels.length + 1}` };
        levels.push(level);
        return level;
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    inventoryTransaction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        transactions.push(data);
        return data;
      }),
    },
    product: {
      updateMany: vi.fn(async (args: Record<string, unknown>) => {
        productUpdates.push(args);
        return { count: 1 };
      }),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };

  return { prisma, levels, transactions, productUpdates };
}

const baseLevel: Level = {
  id: 'lvl-1',
  tenantId: 't1',
  productId: 'p1',
  variantId: null,
  onHand: 10,
  reserved: 2,
  lowStockThreshold: 5,
};

function service(fake: ReturnType<typeof fakePrisma>) {
  return new InventoryService(
    fake.prisma as unknown as ConstructorParameters<typeof InventoryService>[0],
  );
}

describe('InventoryService.adjust', () => {
  it('writes a ledger row alongside the new quantity', async () => {
    const fake = fakePrisma({ levels: [{ ...baseLevel }] });
    const result = await service(fake).adjust('t1', {
      inventoryLevelId: 'lvl-1',
      delta: 5,
      type: 'restock',
      reason: 'ورود کالا',
    });

    expect(result.onHand).toBe(15);
    expect(fake.transactions).toHaveLength(1);
    expect(fake.transactions[0]).toMatchObject({
      type: 'restock',
      quantityDelta: 5,
      resultingOnHand: 15,
      reason: 'ورود کالا',
    });
  });

  it('converts setTo into the correct ledger delta', async () => {
    const fake = fakePrisma({ levels: [{ ...baseLevel }] });
    await service(fake).adjust('t1', {
      inventoryLevelId: 'lvl-1',
      setTo: 4,
    });

    expect(fake.transactions[0]).toMatchObject({
      quantityDelta: -6,
      resultingOnHand: 4,
    });
  });

  it('rejects going negative unless the tenant opted in', async () => {
    const fake = fakePrisma({ levels: [{ ...baseLevel }] });
    await expect(
      service(fake).adjust('t1', { inventoryLevelId: 'lvl-1', delta: -20 }),
    ).rejects.toThrow('موجودی نمی‌تواند منفی شود');
    expect(fake.transactions).toHaveLength(0);
  });

  it('allows going negative when the tenant enabled it', async () => {
    const fake = fakePrisma({
      levels: [{ ...baseLevel }],
      allowNegativeInventory: true,
    });
    const result = await service(fake).adjust('t1', {
      inventoryLevelId: 'lvl-1',
      delta: -20,
    });
    expect(result.onHand).toBe(-10);
  });

  it('refuses to touch another tenant\u2019s level', async () => {
    const fake = fakePrisma({ levels: [{ ...baseLevel }] });
    await expect(
      service(fake).adjust('other-tenant', {
        inventoryLevelId: 'lvl-1',
        delta: 1,
      }),
    ).rejects.toThrow('رکورد موجودی پیدا نشد');
  });

  it('keeps Product.inStock in sync with availability', async () => {
    const fake = fakePrisma({ levels: [{ ...baseLevel }] });
    await service(fake).adjust('t1', { inventoryLevelId: 'lvl-1', setTo: 2 });

    // onHand 2 - reserved 2 = 0 available, so the product is out of stock.
    expect(fake.productUpdates.at(-1)).toMatchObject({
      data: { inStock: false },
    });
  });
});

describe('InventoryService.mapLevel', () => {
  it('reports low stock once availability reaches the threshold', () => {
    const fake = fakePrisma({});
    const mapped = service(fake).mapLevel({
      id: 'lvl-1',
      tenantId: 't1',
      productId: 'p1',
      variantId: null,
      onHand: 6,
      reserved: 2,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: 'p1',
        title: 'محصول',
        sku: 'SKU-1',
        categoryId: null,
        costPrice: null,
        source: 'native',
        status: 'published',
      },
      variant: null,
    } as unknown as Parameters<InventoryService['mapLevel']>[0]);

    expect(mapped.available).toBe(4);
    expect(mapped.state).toBe('low_stock');
  });
});
