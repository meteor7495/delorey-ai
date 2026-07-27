-- Slice 13: Shopify store connection + sync credentials
ALTER TABLE "store_connections" ADD COLUMN IF NOT EXISTS "shop_domain" TEXT;
ALTER TABLE "store_connections" ADD COLUMN IF NOT EXISTS "external_shop_id" TEXT;
ALTER TABLE "store_connections" ADD COLUMN IF NOT EXISTS "credentials_cipher" TEXT;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "external_id" TEXT;

CREATE INDEX IF NOT EXISTS "products_tenant_id_external_id_idx" ON "products"("tenant_id", "external_id");
