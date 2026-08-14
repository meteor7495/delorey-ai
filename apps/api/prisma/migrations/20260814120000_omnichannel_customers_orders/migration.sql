-- AlterTable
ALTER TABLE "storefront_orders" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'website';
ALTER TABLE "storefront_orders" ADD COLUMN "payment_authority" TEXT;
ALTER TABLE "storefront_orders" ADD COLUMN "payment_ref" TEXT;
ALTER TABLE "storefront_orders" ADD COLUMN "customer_id" TEXT;

CREATE INDEX "storefront_orders_tenant_id_channel_idx" ON "storefront_orders"("tenant_id", "channel");
CREATE INDEX "storefront_orders_customer_id_idx" ON "storefront_orders"("customer_id");
CREATE INDEX "storefront_orders_payment_authority_idx" ON "storefront_orders"("payment_authority");

-- AlterTable
ALTER TABLE "storefront_settings" ADD COLUMN "zarinpal_merchant_id" TEXT;

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone_normalized" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customers_tenant_id_phone_normalized_key" ON "customers"("tenant_id", "phone_normalized");
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

CREATE TABLE "customer_identities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_identities_tenant_id_channel_external_id_key" ON "customer_identities"("tenant_id", "channel", "external_id");
CREATE INDEX "customer_identities_customer_id_idx" ON "customer_identities"("customer_id");

CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customer_addresses_customer_id_is_default_idx" ON "customer_addresses"("customer_id", "is_default");

CREATE TABLE "channel_checkout_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'idle',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "channel_checkout_sessions_conversation_id_key" ON "channel_checkout_sessions"("conversation_id");
CREATE INDEX "channel_checkout_sessions_tenant_id_idx" ON "channel_checkout_sessions"("tenant_id");

ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_identities" ADD CONSTRAINT "customer_identities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_identities" ADD CONSTRAINT "customer_identities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "channel_checkout_sessions" ADD CONSTRAINT "channel_checkout_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "storefront_orders" ADD CONSTRAINT "storefront_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
