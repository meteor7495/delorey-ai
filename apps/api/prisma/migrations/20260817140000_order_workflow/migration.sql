-- Slice A: payment vs fulfillment split + append-only status history

ALTER TABLE "storefront_orders" ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE "storefront_orders" ADD COLUMN "rejection_reason" TEXT;

UPDATE "storefront_orders" SET "status" = 'approved' WHERE "status" = 'confirmed';

UPDATE "storefront_orders" SET "payment_status" = 'pending' WHERE "status" = 'pending_payment';

UPDATE "storefront_orders"
SET "payment_status" = 'paid'
WHERE "payment_method" = 'online'
  AND "status" IN ('approved', 'processing', 'shipped', 'delivered', 'pending_approval');

UPDATE "storefront_orders"
SET "payment_status" = 'paid'
WHERE "payment_method" = 'online'
  AND "payment_ref" IS NOT NULL
  AND "payment_status" = 'unpaid'
  AND "status" NOT IN ('pending_payment', 'payment_failed', 'cancelled', 'rejected');

CREATE INDEX "storefront_orders_tenant_id_payment_status_idx" ON "storefront_orders"("tenant_id", "payment_status");

CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_status" TEXT NOT NULL,
    "to_status" TEXT NOT NULL,
    "payment_status" TEXT,
    "reason" TEXT,
    "actor_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "order_status_history_tenant_id_order_id_created_at_idx" ON "order_status_history"("tenant_id", "order_id", "created_at");
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at");

ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
