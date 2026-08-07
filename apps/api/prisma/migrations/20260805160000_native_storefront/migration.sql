-- Native storefront + CMS (Slice 21–26)

CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- Alter products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" TEXT NOT NULL DEFAULT '';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compare_at_price" DECIMAL(18,2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'mock';

UPDATE "products"
SET "slug" = lower(regexp_replace(coalesce("sku", "id"), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" = '' OR "slug" IS NULL;

CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storefront_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT NOT NULL DEFAULT 'cod',
    "total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_address" TEXT NOT NULL,
    "customer_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storefront_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit_price" DECIMAL(18,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "storefront_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storefront_settings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_slug" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#ef4056',
    "secondary_color" TEXT NOT NULL DEFAULT '#0c0c0c',
    "tagline" TEXT,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "support_phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storefront_banners" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT,
    "href" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storefront_banners_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_tenant_id_slug_key" ON "categories"("tenant_id", "slug");
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");
CREATE INDEX "categories_tenant_id_parent_id_idx" ON "categories"("tenant_id", "parent_id");

CREATE UNIQUE INDEX "products_tenant_id_slug_key" ON "products"("tenant_id", "slug");
CREATE INDEX "products_tenant_id_category_id_idx" ON "products"("tenant_id", "category_id");
CREATE INDEX "products_tenant_id_status_source_idx" ON "products"("tenant_id", "status", "source");

CREATE UNIQUE INDEX "carts_tenant_id_session_id_key" ON "carts"("tenant_id", "session_id");
CREATE INDEX "carts_tenant_id_idx" ON "carts"("tenant_id");
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

CREATE UNIQUE INDEX "storefront_orders_tenant_id_order_number_key" ON "storefront_orders"("tenant_id", "order_number");
CREATE INDEX "storefront_orders_tenant_id_status_idx" ON "storefront_orders"("tenant_id", "status");
CREATE INDEX "storefront_orders_tenant_id_customer_phone_idx" ON "storefront_orders"("tenant_id", "customer_phone");
CREATE INDEX "storefront_order_items_order_id_idx" ON "storefront_order_items"("order_id");

CREATE UNIQUE INDEX "storefront_settings_tenant_id_key" ON "storefront_settings"("tenant_id");
CREATE UNIQUE INDEX "storefront_settings_store_slug_key" ON "storefront_settings"("store_slug");
CREATE INDEX "storefront_banners_tenant_id_active_idx" ON "storefront_banners"("tenant_id", "active");

ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "carts" ADD CONSTRAINT "carts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storefront_order_items" ADD CONSTRAINT "storefront_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storefront_order_items" ADD CONSTRAINT "storefront_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "storefront_settings" ADD CONSTRAINT "storefront_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storefront_banners" ADD CONSTRAINT "storefront_banners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
