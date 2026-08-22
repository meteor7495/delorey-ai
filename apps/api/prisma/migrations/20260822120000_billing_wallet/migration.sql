-- Seloma SaaS billing: credit wallet, ledger, usage, pricing, auto-recharge
-- Independent of storefront order payments.

CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "balance" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "reserved" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "status" TEXT NOT NULL DEFAULT 'active',
    "low_balance_threshold" DECIMAL(18,0) NOT NULL DEFAULT 500000,
    "critical_balance_threshold" DECIMAL(18,0) NOT NULL DEFAULT 200000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallets_tenant_id_key" ON "wallets"("tenant_id");
CREATE INDEX "wallets_tenant_id_idx" ON "wallets"("tenant_id");

ALTER TABLE "wallets" ADD CONSTRAINT "wallets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "balance_before" DECIMAL(18,0) NOT NULL,
    "balance_after" DECIMAL(18,0) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
CREATE INDEX "wallet_transactions_tenant_id_created_at_idx" ON "wallet_transactions"("tenant_id", "created_at");
CREATE INDEX "wallet_transactions_tenant_id_type_created_at_idx" ON "wallet_transactions"("tenant_id", "type", "created_at");
CREATE INDEX "wallet_transactions_reference_type_reference_id_idx" ON "wallet_transactions"("reference_type", "reference_id");

ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "request_id" TEXT,
    "input_units" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "output_units" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_units" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "unit_type" TEXT NOT NULL DEFAULT 'token',
    "provider_cost" DECIMAL(18,4) NOT NULL,
    "customer_charge" DECIMAL(18,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "metadata" JSONB,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usage_records_idempotency_key_key" ON "usage_records"("idempotency_key");
CREATE INDEX "usage_records_tenant_id_created_at_idx" ON "usage_records"("tenant_id", "created_at");
CREATE INDEX "usage_records_wallet_id_created_at_idx" ON "usage_records"("wallet_id", "created_at");
CREATE INDEX "usage_records_tenant_id_service_created_at_idx" ON "usage_records"("tenant_id", "service", "created_at");

ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT '*',
    "model" TEXT NOT NULL DEFAULT '*',
    "unit_type" TEXT NOT NULL,
    "unit_price" DECIMAL(18,8) NOT NULL,
    "markup" DECIMAL(8,4) NOT NULL DEFAULT 2,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pricing_rules_service_provider_model_status_effective_from_idx" ON "pricing_rules"("service", "provider", "model", "status", "effective_from");
CREATE INDEX "pricing_rules_status_effective_from_idx" ON "pricing_rules"("status", "effective_from");

CREATE TABLE "credit_packs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_packs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credit_packs_slug_key" ON "credit_packs"("slug");
CREATE INDEX "credit_packs_status_sort_order_idx" ON "credit_packs"("status", "sort_order");

CREATE TABLE "subscription_credit_grants" (
    "id" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "included_credit" DECIMAL(18,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_credit_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_credit_grants_plan_key" ON "subscription_credit_grants"("plan");

CREATE TABLE "wallet_reservations" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "amount" DECIMAL(18,0) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reference_id" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "captured_amount" DECIMAL(18,0),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_reservations_idempotency_key_key" ON "wallet_reservations"("idempotency_key");
CREATE INDEX "wallet_reservations_wallet_id_status_idx" ON "wallet_reservations"("wallet_id", "status");
CREATE INDEX "wallet_reservations_tenant_id_status_created_at_idx" ON "wallet_reservations"("tenant_id", "status", "created_at");
CREATE INDEX "wallet_reservations_expires_at_status_idx" ON "wallet_reservations"("expires_at", "status");

ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_reservations" ADD CONSTRAINT "wallet_reservations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "auto_recharge_configs" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "threshold_amount" DECIMAL(18,0) NOT NULL,
    "recharge_amount" DECIMAL(18,0) NOT NULL,
    "monthly_limit" DECIMAL(18,0) NOT NULL,
    "payment_method_id" TEXT,
    "cooldown_until" TIMESTAMP(3),
    "paused_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auto_recharge_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auto_recharge_configs_wallet_id_key" ON "auto_recharge_configs"("wallet_id");
CREATE UNIQUE INDEX "auto_recharge_configs_tenant_id_key" ON "auto_recharge_configs"("tenant_id");

ALTER TABLE "auto_recharge_configs" ADD CONSTRAINT "auto_recharge_configs_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auto_recharge_configs" ADD CONSTRAINT "auto_recharge_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "spending_limits" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "monthly_limit" DECIMAL(18,0),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spending_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spending_limits_wallet_id_key" ON "spending_limits"("wallet_id");
CREATE UNIQUE INDEX "spending_limits_tenant_id_key" ON "spending_limits"("tenant_id");

ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "spending_limits" ADD CONSTRAINT "spending_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "billing_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(18,0) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "provider" TEXT NOT NULL,
    "authority" TEXT,
    "provider_transaction_id" TEXT,
    "credit_pack_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_payments_provider_transaction_id_key" ON "billing_payments"("provider_transaction_id");
CREATE UNIQUE INDEX "billing_payments_idempotency_key_key" ON "billing_payments"("idempotency_key");
CREATE UNIQUE INDEX "billing_payments_provider_authority_key" ON "billing_payments"("provider", "authority");
CREATE INDEX "billing_payments_tenant_id_created_at_idx" ON "billing_payments"("tenant_id", "created_at");
CREATE INDEX "billing_payments_tenant_id_status_idx" ON "billing_payments"("tenant_id", "status");
CREATE INDEX "billing_payments_wallet_id_kind_created_at_idx" ON "billing_payments"("wallet_id", "kind", "created_at");

ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "billing_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "billing_alerts_wallet_id_kind_key" ON "billing_alerts"("wallet_id", "kind");
CREATE INDEX "billing_alerts_tenant_id_kind_idx" ON "billing_alerts"("tenant_id", "kind");

ALTER TABLE "billing_alerts" ADD CONSTRAINT "billing_alerts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "billing_alerts" ADD CONSTRAINT "billing_alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "billing_settings" (
    "id" TEXT NOT NULL,
    "charge_formula" TEXT NOT NULL DEFAULT 'ceil(provider_cost * markup)',
    "default_low_balance" DECIMAL(18,0) NOT NULL DEFAULT 500000,
    "default_critical_balance" DECIMAL(18,0) NOT NULL DEFAULT 200000,
    "auto_recharge_cooldown_sec" INTEGER NOT NULL DEFAULT 900,
    "alert_cooldown_sec" INTEGER NOT NULL DEFAULT 86400,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "reservation_ttl_sec" INTEGER NOT NULL DEFAULT 180,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_settings_pkey" PRIMARY KEY ("id")
);
