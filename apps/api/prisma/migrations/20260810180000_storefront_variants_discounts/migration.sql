-- Storefront completion: variant cart lines, order discounts, online payment flag
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_cart_id_product_id_key";

CREATE INDEX IF NOT EXISTS "cart_items_cart_id_product_id_variant_id_idx"
  ON "cart_items"("cart_id", "product_id", "variant_id");

ALTER TABLE "storefront_orders"
  ADD COLUMN IF NOT EXISTS "subtotal_amount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discount_code" TEXT,
  ADD COLUMN IF NOT EXISTS "discount_amount" DECIMAL(18, 2) NOT NULL DEFAULT 0;

ALTER TABLE "storefront_settings"
  ADD COLUMN IF NOT EXISTS "online_payment_enabled" BOOLEAN NOT NULL DEFAULT false;
