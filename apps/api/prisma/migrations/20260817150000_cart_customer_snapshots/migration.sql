-- Slice B: channel-aware carts with price snapshots

ALTER TABLE "carts" ADD COLUMN "customer_id" TEXT;
ALTER TABLE "carts" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'website';
ALTER TABLE "carts" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

UPDATE "carts" SET "channel" = 'telegram' WHERE "session_id" LIKE 'telegram:%';
UPDATE "carts" SET "channel" = 'bale' WHERE "session_id" LIKE 'bale:%';
UPDATE "carts" SET "channel" = 'instagram' WHERE "session_id" LIKE 'instagram:%';

CREATE INDEX "carts_tenant_id_status_idx" ON "carts"("tenant_id", "status");
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cart_items" ADD COLUMN "unit_price_snapshot" DECIMAL(18,2);
ALTER TABLE "cart_items" ADD COLUMN "line_total_snapshot" DECIMAL(18,2);
