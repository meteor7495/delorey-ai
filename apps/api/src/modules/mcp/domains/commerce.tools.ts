import { Injectable, OnModuleInit } from '@nestjs/common';
import { z } from 'zod';
import { McpRegistry } from '../core/registry';
import { paginationInput, pageMeta } from '../core/schemas';
import type { McpToolDefinition } from '../core/types';
import { ShopService } from '../../shop/shop.service';
import { VariantsService } from '../../shop/variants.service';
import { AttributesService } from '../../shop/attributes.service';

function compactProduct(p: Record<string, unknown>) {
  return {
    id: p.id,
    title: p.title,
    sku: p.sku,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    currency: p.currency,
    status: p.status,
    inStock: p.inStock,
    categoryId: p.categoryId ?? null,
    brand: p.brand ?? null,
    hasVariants: p.hasVariants ?? false,
    variantCount: p.variantCount ?? undefined,
    stock: p.stock ?? undefined,
    tags: p.tags ?? [],
    images: Array.isArray(p.images) ? (p.images as string[]).slice(0, 3) : [],
  };
}

function compactCategory(c: Record<string, unknown>) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId ?? null,
    active: c.active,
    productCount: c.productCount ?? undefined,
    sortOrder: c.sortOrder,
  };
}

@Injectable()
export class CommerceToolsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: McpRegistry,
    private readonly shop: ShopService,
    private readonly variants: VariantsService,
    private readonly attributes: AttributesService,
  ) {}

  onModuleInit() {
    this.register();
  }

  private register() {
    const tools: McpToolDefinition[] = [
      {
        name: 'commerce_search_products',
        domain: 'commerce',
        title: 'Search products',
        description:
          'Search the merchant catalog by query, status, category, or stock. Use for product discovery and inventory-aware listing. Do not use for storefront public browsing by slug.',
        version: '1.0.0',
        inputSchema: z.object({
          q: z.string().optional().describe('Title, SKU, barcode, brand, or tag'),
          status: z.enum(['draft', 'published']).optional(),
          categoryId: z.string().optional(),
          stock: z.enum(['in_stock', 'out_of_stock']).optional(),
          hasVariants: z.boolean().optional(),
          sort: z.string().optional(),
          ...paginationInput,
        }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'public',
        timeoutMs: 15_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const result = await this.shop.listCmsProducts(ctx.tenantId, {
            q: input.q,
            status: input.status,
            categoryId: input.categoryId,
            stock: input.stock,
            hasVariants: input.hasVariants,
            sort: input.sort,
            limit: input.limit,
            offset: input.offset,
          });
          return {
            items: result.items.map((p) => compactProduct(p as unknown as Record<string, unknown>)),
            meta: pageMeta(result.total, result.limit, result.offset),
          };
        },
      },
      {
        name: 'commerce_get_product',
        domain: 'commerce',
        title: 'Get product',
        description:
          'Fetch one CMS product by id including stock summary. Use when you already know the product id.',
        version: '1.0.0',
        inputSchema: z.object({
          productId: z.string().describe('Product id'),
        }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'public',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => {
          const p = await this.shop.getCmsProduct(ctx.tenantId, input.productId);
          return compactProduct(p as unknown as Record<string, unknown>);
        },
      },
      {
        name: 'commerce_create_product',
        domain: 'commerce',
        title: 'Create product',
        description:
          'Create a native catalog product. Requires sku, title, and price. Prefer draft status when unsure.',
        version: '1.0.0',
        inputSchema: z.object({
          sku: z.string().min(1),
          title: z.string().min(1),
          price: z.number().nonnegative(),
          slug: z.string().optional(),
          compareAtPrice: z.number().nonnegative().nullable().optional(),
          currency: z.string().optional(),
          description: z.string().nullable().optional(),
          shortDescription: z.string().nullable().optional(),
          images: z.array(z.string()).optional(),
          categoryId: z.string().nullable().optional(),
          status: z.enum(['draft', 'published']).optional(),
          brand: z.string().nullable().optional(),
          barcode: z.string().nullable().optional(),
          tags: z.array(z.string()).optional(),
          onHand: z.number().int().nonnegative().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
        }),
        permissions: ['products.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 20_000,
        handler: async (ctx, input) => {
          const p = await this.shop.createNativeProduct(ctx.tenantId, input);
          return compactProduct(p as unknown as Record<string, unknown>);
        },
      },
      {
        name: 'commerce_update_product',
        domain: 'commerce',
        title: 'Update product',
        description:
          'Update a native product by id. Synced (non-native) products cannot be edited here.',
        version: '1.0.0',
        inputSchema: z.object({
          productId: z.string(),
          sku: z.string().optional(),
          title: z.string().optional(),
          price: z.number().nonnegative().optional(),
          slug: z.string().optional(),
          compareAtPrice: z.number().nonnegative().nullable().optional(),
          currency: z.string().optional(),
          description: z.string().nullable().optional(),
          shortDescription: z.string().nullable().optional(),
          images: z.array(z.string()).optional(),
          categoryId: z.string().nullable().optional(),
          status: z.enum(['draft', 'published']).optional(),
          brand: z.string().nullable().optional(),
          barcode: z.string().nullable().optional(),
          tags: z.array(z.string()).optional(),
          onHand: z.number().int().nonnegative().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
          inStock: z.boolean().optional(),
        }),
        permissions: ['products.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 20_000,
        handler: async (ctx, input) => {
          const { productId, ...body } = input;
          const p = await this.shop.updateNativeProduct(ctx.tenantId, productId, body);
          return compactProduct(p as unknown as Record<string, unknown>);
        },
      },
      {
        name: 'commerce_delete_product',
        domain: 'commerce',
        title: 'Delete product',
        description:
          'Permanently delete a native product. Destructive — prefer draft/unpublish when possible.',
        version: '1.0.0',
        inputSchema: z.object({ productId: z.string() }),
        permissions: ['products.write'],
        risk: 'HIGH',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 15_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) =>
          this.shop.deleteNativeProduct(ctx.tenantId, input.productId),
      },
      {
        name: 'commerce_list_categories',
        domain: 'commerce',
        title: 'List categories',
        description: 'List all product categories with product counts.',
        version: '1.0.0',
        inputSchema: z.object({}),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx) => {
          const rows = await this.shop.listCategories(ctx.tenantId);
          return { items: rows.map((c) => compactCategory(c as unknown as Record<string, unknown>)) };
        },
      },
      {
        name: 'commerce_create_category',
        domain: 'commerce',
        title: 'Create category',
        description: 'Create a catalog category. Name is required.',
        version: '1.0.0',
        inputSchema: z.object({
          name: z.string().min(1),
          slug: z.string().optional(),
          parentId: z.string().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          sortOrder: z.number().int().optional(),
          description: z.string().nullable().optional(),
          active: z.boolean().optional(),
        }),
        permissions: ['products.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => {
          const c = await this.shop.createCategory(ctx.tenantId, input);
          return compactCategory(c as unknown as Record<string, unknown>);
        },
      },
      {
        name: 'commerce_update_category',
        domain: 'commerce',
        title: 'Update category',
        description: 'Update an existing category by id.',
        version: '1.0.0',
        inputSchema: z.object({
          categoryId: z.string(),
          name: z.string().optional(),
          slug: z.string().optional(),
          parentId: z.string().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          sortOrder: z.number().int().optional(),
          description: z.string().nullable().optional(),
          active: z.boolean().optional(),
        }),
        permissions: ['products.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => {
          const { categoryId, ...body } = input;
          const c = await this.shop.updateCategory(ctx.tenantId, categoryId, body);
          return compactCategory(c as unknown as Record<string, unknown>);
        },
      },
      {
        name: 'commerce_delete_category',
        domain: 'commerce',
        title: 'Delete category',
        description:
          'Delete a category. Products in it are unassigned (categoryId cleared), not deleted.',
        version: '1.0.0',
        inputSchema: z.object({ categoryId: z.string() }),
        permissions: ['products.write'],
        risk: 'MEDIUM',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) =>
          this.shop.deleteCategory(ctx.tenantId, input.categoryId),
      },
      {
        name: 'commerce_list_variants',
        domain: 'commerce',
        title: 'List product variants',
        description: 'List variants for a product including effective price and stock.',
        version: '1.0.0',
        inputSchema: z.object({ productId: z.string() }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => ({
          items: await this.variants.listForProduct(ctx.tenantId, input.productId),
        }),
      },
      {
        name: 'commerce_get_variant',
        domain: 'commerce',
        title: 'Get variant',
        description: 'Fetch a single product variant by id.',
        version: '1.0.0',
        inputSchema: z.object({ variantId: z.string() }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.variants.get(ctx.tenantId, input.variantId),
      },
      {
        name: 'commerce_create_variant',
        domain: 'commerce',
        title: 'Create variant',
        description:
          'Create one variant for a product. Prefer attributeValueIds to define the combination.',
        version: '1.0.0',
        inputSchema: z.object({
          productId: z.string(),
          sku: z.string().optional(),
          barcode: z.string().nullable().optional(),
          price: z.number().nullable().optional(),
          compareAtPrice: z.number().nullable().optional(),
          costPrice: z.number().nullable().optional(),
          weightGrams: z.number().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          active: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          attributeValueIds: z.array(z.string()).optional(),
          onHand: z.number().int().nonnegative().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
        }),
        permissions: ['products.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        handler: async (ctx, input) => {
          const { productId, ...body } = input;
          return this.variants.create(ctx.tenantId, productId, body);
        },
      },
      {
        name: 'commerce_update_variant',
        domain: 'commerce',
        title: 'Update variant',
        description: 'Update variant pricing, SKU, stock, or active flag.',
        version: '1.0.0',
        inputSchema: z.object({
          variantId: z.string(),
          sku: z.string().optional(),
          barcode: z.string().nullable().optional(),
          price: z.number().nullable().optional(),
          compareAtPrice: z.number().nullable().optional(),
          costPrice: z.number().nullable().optional(),
          weightGrams: z.number().nullable().optional(),
          imageUrl: z.string().nullable().optional(),
          active: z.boolean().optional(),
          sortOrder: z.number().int().optional(),
          onHand: z.number().int().nonnegative().optional(),
          lowStockThreshold: z.number().int().nonnegative().optional(),
        }),
        permissions: ['products.write'],
        risk: 'MEDIUM',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 15_000,
        handler: async (ctx, input) => {
          const { variantId, ...body } = input;
          return this.variants.update(ctx.tenantId, variantId, body);
        },
      },
      {
        name: 'commerce_delete_variant',
        domain: 'commerce',
        title: 'Delete variant',
        description: 'Remove a product variant permanently.',
        version: '1.0.0',
        inputSchema: z.object({ variantId: z.string() }),
        permissions: ['products.write'],
        risk: 'HIGH',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 10_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) =>
          this.variants.remove(ctx.tenantId, input.variantId),
      },
      {
        name: 'commerce_list_attributes',
        domain: 'commerce',
        title: 'List attributes',
        description: 'List product attributes (size, color, …) and their values.',
        version: '1.0.0',
        inputSchema: z.object({
          activeOnly: z.boolean().optional(),
        }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) => ({
          items: await this.attributes.list(ctx.tenantId, {
            activeOnly: input.activeOnly,
          }),
        }),
      },
      {
        name: 'commerce_get_attribute',
        domain: 'commerce',
        title: 'Get attribute',
        description: 'Get one attribute definition with values.',
        version: '1.0.0',
        inputSchema: z.object({ attributeId: z.string() }),
        permissions: ['products.read'],
        risk: 'READ',
        auditClass: 'read',
        surface: 'internal',
        timeoutMs: 10_000,
        idempotent: true,
        handler: async (ctx, input) =>
          this.attributes.get(ctx.tenantId, input.attributeId),
      },
      {
        name: 'commerce_create_attribute',
        domain: 'commerce',
        title: 'Create attribute',
        description: 'Create a catalog attribute (e.g. Color). Add values separately.',
        version: '1.0.0',
        inputSchema: z.object({
          name: z.string().min(1),
          slug: z.string().optional(),
          type: z.string().optional(),
          displayType: z.string().optional(),
          sortOrder: z.number().int().optional(),
          active: z.boolean().optional(),
          required: z.boolean().optional(),
        }),
        permissions: ['products.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) =>
          this.attributes.create(ctx.tenantId, input),
      },
      {
        name: 'commerce_update_attribute',
        domain: 'commerce',
        title: 'Update attribute',
        description: 'Update attribute metadata (name, type, active).',
        version: '1.0.0',
        inputSchema: z.object({
          attributeId: z.string(),
          name: z.string().optional(),
          slug: z.string().optional(),
          type: z.string().optional(),
          displayType: z.string().optional(),
          sortOrder: z.number().int().optional(),
          active: z.boolean().optional(),
          required: z.boolean().optional(),
        }),
        permissions: ['products.write'],
        risk: 'LOW',
        auditClass: 'write',
        surface: 'internal',
        timeoutMs: 10_000,
        handler: async (ctx, input) => {
          const { attributeId, ...body } = input;
          return this.attributes.update(ctx.tenantId, attributeId, body);
        },
      },
      {
        name: 'commerce_delete_attribute',
        domain: 'commerce',
        title: 'Delete attribute',
        description: 'Delete an attribute. Fails if still used by variants.',
        version: '1.0.0',
        inputSchema: z.object({ attributeId: z.string() }),
        permissions: ['products.write'],
        risk: 'HIGH',
        auditClass: 'destructive',
        surface: 'internal',
        timeoutMs: 10_000,
        approvalPolicy: 'approval_required',
        handler: async (ctx, input) =>
          this.attributes.remove(ctx.tenantId, input.attributeId),
      },
    ];

    for (const t of tools) this.registry.registerTool(t);
  }
}
