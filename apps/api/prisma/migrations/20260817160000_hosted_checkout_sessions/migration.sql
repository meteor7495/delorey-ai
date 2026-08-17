-- Slice C: signed hosted checkout sessions (channel → website)

CREATE TABLE "checkout_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'website',
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "checkout_sessions_token_hash_key" ON "checkout_sessions"("token_hash");
CREATE INDEX "checkout_sessions_tenant_id_status_idx" ON "checkout_sessions"("tenant_id", "status");
CREATE INDEX "checkout_sessions_cart_id_idx" ON "checkout_sessions"("cart_id");

ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
