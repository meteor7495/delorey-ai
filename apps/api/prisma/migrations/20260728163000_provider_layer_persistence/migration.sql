-- Provider Layer persistence: tenant policies, model bindings, call ledger
CREATE TABLE "tenant_ai_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "preferred_provider" TEXT,
    "preferred_models" JSONB,
    "allowed_providers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked_providers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fallback_order" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_cost_per_turn_usd" DECIMAL(12,6),
    "max_cost_per_day_usd" DECIMAL(12,6),
    "latency_target_ms" INTEGER,
    "quality_target" TEXT NOT NULL DEFAULT 'standard',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_ai_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_ai_policies_tenant_id_key" ON "tenant_ai_policies"("tenant_id");

ALTER TABLE "tenant_ai_policies"
  ADD CONSTRAINT "tenant_ai_policies_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ai_model_bindings" (
    "id" TEXT NOT NULL,
    "internal_model_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "upstream_model" TEXT NOT NULL,
    "task_classes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cost_tier" TEXT NOT NULL DEFAULT 'cheap',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "price_prompt_per_1k" DECIMAL(12,8),
    "price_completion_per_1k" DECIMAL(12,8),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_bindings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_model_bindings_internal_model_id_key" ON "ai_model_bindings"("internal_model_id");
CREATE INDEX "ai_model_bindings_provider_id_enabled_idx" ON "ai_model_bindings"("provider_id", "enabled");

CREATE TABLE "ai_call_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "feature" TEXT,
    "task_class" TEXT NOT NULL,
    "route_hint" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "internal_model_id" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "prompt_tokens" INTEGER NOT NULL,
    "completion_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "cost_usd" DECIMAL(12,8),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "fallback_count" INTEGER NOT NULL DEFAULT 0,
    "error_code" TEXT,
    "cache_hit" BOOLEAN NOT NULL DEFAULT false,
    "shadow" BOOLEAN NOT NULL DEFAULT false,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_call_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_call_events_tenant_id_created_at_idx" ON "ai_call_events"("tenant_id", "created_at");
CREATE INDEX "ai_call_events_provider_id_created_at_idx" ON "ai_call_events"("provider_id", "created_at");
CREATE INDEX "ai_call_events_conversation_id_idx" ON "ai_call_events"("conversation_id");
CREATE INDEX "ai_call_events_tenant_id_feature_created_at_idx" ON "ai_call_events"("tenant_id", "feature", "created_at");

ALTER TABLE "ai_call_events"
  ADD CONSTRAINT "ai_call_events_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
