-- Commerce Core (Slice 27) — attributes, variants, inventory, discounts, articles
--
-- Additive only. No existing column is dropped, renamed or retyped and no row
-- is deleted. Rollback = DROP the ten new tables + DROP the added columns.
--
-- NOTE: "inventory_levels_product_uniq" below is a PARTIAL unique index, which
-- Prisma cannot express in schema.prisma. Keep it in sync by hand.

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
ADD COLUMN IF NOT EXISTS "seo_title" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "barcode" TEXT,
ADD COLUMN IF NOT EXISTS "brand" TEXT,
ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(18,2),
ADD COLUMN IF NOT EXISTS "has_variants" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
ADD COLUMN IF NOT EXISTS "seo_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
ADD COLUMN IF NOT EXISTS "short_description" TEXT,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "storefront_order_items" ADD COLUMN IF NOT EXISTS "variant_id" TEXT;

-- AlterTable
ALTER TABLE "storefront_settings" ADD COLUMN IF NOT EXISTS "allow_negative_inventory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "default_currency" TEXT NOT NULL DEFAULT 'IRR',
ADD COLUMN IF NOT EXISTS "default_product_status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS "low_stock_threshold" INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE IF NOT EXISTS "attributes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'select',
    "display_type" TEXT NOT NULL DEFAULT 'dropdown',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attribute_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "color_hex" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_attributes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "options_key" TEXT NOT NULL,
    "price" DECIMAL(18,2),
    "compare_at_price" DECIMAL(18,2),
    "cost_price" DECIMAL(18,2),
    "weight_grams" INTEGER,
    "image_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "variant_attribute_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,
    "attribute_value_id" TEXT NOT NULL,

    CONSTRAINT "variant_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "inventory_levels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "inventory_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inventory_level_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "resulting_on_hand" INTEGER NOT NULL,
    "reason" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "discounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usage_limit" INTEGER,
    "per_customer_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "min_cart_amount" DECIMAL(18,2),
    "max_discount_amount" DECIMAL(18,2),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "discount_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "discount_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "featured_image_url" TEXT,
    "category_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "author_user_id" TEXT,
    "seo_title" TEXT,
    "seo_description" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attributes_tenant_id_idx" ON "attributes"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attributes_tenant_id_active_idx" ON "attributes"("tenant_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "attributes_tenant_id_slug_key" ON "attributes"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attribute_values_tenant_id_idx" ON "attribute_values"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attribute_values_attribute_id_idx" ON "attribute_values"("attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "attribute_values_attribute_id_value_key" ON "attribute_values"("attribute_id", "value");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_attributes_tenant_id_idx" ON "product_attributes"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_attributes_product_id_idx" ON "product_attributes"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_attributes_product_id_attribute_id_key" ON "product_attributes"("product_id", "attribute_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_tenant_id_idx" ON "product_variants"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_tenant_id_active_idx" ON "product_variants"("tenant_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_tenant_id_sku_key" ON "product_variants"("tenant_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_variants_product_id_options_key_key" ON "product_variants"("product_id", "options_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "variant_attribute_values_tenant_id_idx" ON "variant_attribute_values"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "variant_attribute_values_attribute_value_id_idx" ON "variant_attribute_values"("attribute_value_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "variant_attribute_values_variant_id_attribute_id_key" ON "variant_attribute_values"("variant_id", "attribute_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_levels_variant_id_key" ON "inventory_levels"("variant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inventory_levels_tenant_id_idx" ON "inventory_levels"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inventory_levels_tenant_id_product_id_idx" ON "inventory_levels"("tenant_id", "product_id");

-- CreateIndex — partial unique: at most one product-level stock row per product.
-- Not representable in schema.prisma; maintained by hand.
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_levels_product_uniq" ON "inventory_levels"("tenant_id", "product_id") WHERE "variant_id" IS NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inventory_transactions_tenant_id_created_at_idx" ON "inventory_transactions"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "inventory_transactions_inventory_level_id_created_at_idx" ON "inventory_transactions"("inventory_level_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discounts_tenant_id_idx" ON "discounts"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discounts_tenant_id_active_starts_at_ends_at_idx" ON "discounts"("tenant_id", "active", "starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "discounts_tenant_id_code_key" ON "discounts"("tenant_id", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discount_targets_tenant_id_idx" ON "discount_targets"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "discount_targets_discount_id_idx" ON "discount_targets"("discount_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "discount_targets_discount_id_target_type_target_id_key" ON "discount_targets"("discount_id", "target_type", "target_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "articles_tenant_id_idx" ON "articles"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "articles_tenant_id_status_idx" ON "articles"("tenant_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "articles_tenant_id_category_id_idx" ON "articles"("tenant_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "articles_tenant_id_slug_key" ON "articles"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cart_items_variant_id_idx" ON "cart_items"("variant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "storefront_order_items_variant_id_idx" ON "storefront_order_items"("variant_id");

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storefront_order_items" ADD CONSTRAINT "storefront_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_values" ADD CONSTRAINT "variant_attribute_values_attribute_value_id_fkey" FOREIGN KEY ("attribute_value_id") REFERENCES "attribute_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_levels" ADD CONSTRAINT "inventory_levels_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_level_id_fkey" FOREIGN KEY ("inventory_level_id") REFERENCES "inventory_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_targets" ADD CONSTRAINT "discount_targets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_targets" ADD CONSTRAINT "discount_targets_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: one product-level stock row per existing product so inventory reads
-- never return null. Seeded from the legacy products.in_stock boolean.
INSERT INTO "inventory_levels" (
    "id", "tenant_id", "product_id", "variant_id",
    "on_hand", "reserved", "low_stock_threshold", "created_at", "updated_at"
)
SELECT
    gen_random_uuid(),
    p."tenant_id",
    p."id",
    NULL,
    CASE WHEN p."in_stock" THEN 10 ELSE 0 END,
    0,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "products" p
ON CONFLICT DO NOTHING;

-- Backfill: matching opening balance in the append-only stock ledger.
INSERT INTO "inventory_transactions" (
    "id", "tenant_id", "inventory_level_id", "type",
    "quantity_delta", "resulting_on_hand", "reason", "reference_type", "created_at"
)
SELECT
    gen_random_uuid(),
    il."tenant_id",
    il."id",
    'initial',
    il."on_hand",
    il."on_hand",
    'Backfill from products.in_stock',
    'import',
    CURRENT_TIMESTAMP
FROM "inventory_levels" il
WHERE il."variant_id" IS NULL;
