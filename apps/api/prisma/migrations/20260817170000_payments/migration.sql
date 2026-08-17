-- Slice D: provider-agnostic payments + transaction log

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "authority" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payment_reference" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_provider_authority_key" ON "payments"("provider", "authority");
CREATE INDEX "payments_tenant_id_order_id_idx" ON "payments"("tenant_id", "order_id");
CREATE INDEX "payments_tenant_id_status_idx" ON "payments"("tenant_id", "status");
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

CREATE INDEX "payment_transactions_tenant_id_payment_id_created_at_idx" ON "payment_transactions"("tenant_id", "payment_id", "created_at");
CREATE INDEX "payment_transactions_payment_id_created_at_idx" ON "payment_transactions"("payment_id", "created_at");

ALTER TABLE "payments" ADD CONSTRAINT "payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "storefront_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
