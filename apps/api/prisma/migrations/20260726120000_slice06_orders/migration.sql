CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tracking_code" TEXT,
    "customer_phone_last4" TEXT NOT NULL,
    "customer_email" TEXT,
    "synced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_tenant_id_external_id_key" ON "orders"("tenant_id", "external_id");
CREATE INDEX IF NOT EXISTS "orders_tenant_id_idx" ON "orders"("tenant_id");