-- AI Commerce OS: multi-role employees + activity/approvals/opportunities/memory/stubs

-- Employee extensions
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'sales';
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "operating_mode" TEXT NOT NULL DEFAULT 'copilot';
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "instructions" TEXT;
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "permissions" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "goals" JSONB;

-- Backfill existing rows as sales
UPDATE "employees" SET "role" = 'sales' WHERE "role" IS NULL OR "role" = '';

-- Unique per tenant+role (drop duplicate sales if any first — keep oldest)
DELETE FROM "employees" a
USING "employees" b
WHERE a.tenant_id = b.tenant_id
  AND a.role = b.role
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS "employees_tenant_id_role_key" ON "employees"("tenant_id", "role");

-- Ai activity
CREATE TABLE IF NOT EXISTS "ai_activity_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tool" TEXT,
    "input_sanitized" JSONB,
    "output_sanitized" JSONB,
    "result" TEXT NOT NULL DEFAULT 'info',
    "approval_id" TEXT,
    "correlation_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_activity_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_activity_events_tenant_id_created_at_idx" ON "ai_activity_events"("tenant_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_activity_events_tenant_id_employee_id_created_at_idx" ON "ai_activity_events"("tenant_id", "employee_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_activity_events_correlation_id_idx" ON "ai_activity_events"("correlation_id");

-- Revenue opportunities (before ai_approvals FK)
CREATE TABLE IF NOT EXISTS "revenue_opportunities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "type" TEXT NOT NULL,
    "estimated_value" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IRT',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "reason" TEXT NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "related_customer_id" TEXT,
    "related_cart_id" TEXT,
    "related_product_id" TEXT,
    "related_order_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "revenue_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "revenue_opportunities_tenant_id_status_created_at_idx" ON "revenue_opportunities"("tenant_id", "status", "created_at");
CREATE INDEX IF NOT EXISTS "revenue_opportunities_tenant_id_type_status_idx" ON "revenue_opportunities"("tenant_id", "type", "status");

CREATE TABLE IF NOT EXISTS "ai_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'tool',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "action_payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mcp_approval_id" TEXT,
    "opportunity_id" TEXT,
    "risk_level" TEXT,
    "decided_by_user_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_approvals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_approvals_tenant_id_status_created_at_idx" ON "ai_approvals"("tenant_id", "status", "created_at");

CREATE TABLE IF NOT EXISTS "customer_memories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "insights" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_memories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "customer_memories_tenant_id_customer_id_key" ON "customer_memories"("tenant_id", "customer_id");
CREATE INDEX IF NOT EXISTS "customer_memories_tenant_id_idx" ON "customer_memories"("tenant_id");

CREATE TABLE IF NOT EXISTS "cart_recovery_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cart_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "employee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "channel" TEXT,
    "reminder_index" INTEGER NOT NULL DEFAULT 0,
    "strategy" TEXT,
    "message_preview" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_recovery_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cart_recovery_runs_tenant_id_cart_id_created_at_idx" ON "cart_recovery_runs"("tenant_id", "cart_id", "created_at");
CREATE INDEX IF NOT EXISTS "cart_recovery_runs_tenant_id_status_idx" ON "cart_recovery_runs"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "campaign_drafts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audience_rule" JSONB NOT NULL,
    "offer" JSONB,
    "message" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "schedule_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "campaign_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "campaign_drafts_tenant_id_status_idx" ON "campaign_drafts"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "workflow_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definition" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "workflow_definitions_tenant_id_status_idx" ON "workflow_definitions"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "experiments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "metrics" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "experiments_tenant_id_status_idx" ON "experiments"("tenant_id", "status");

-- FKs
ALTER TABLE "ai_activity_events" ADD CONSTRAINT "ai_activity_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_activity_events" ADD CONSTRAINT "ai_activity_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "revenue_opportunities" ADD CONSTRAINT "revenue_opportunities_related_customer_id_fkey" FOREIGN KEY ("related_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_approvals" ADD CONSTRAINT "ai_approvals_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "revenue_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "customer_memories" ADD CONSTRAINT "customer_memories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_memories" ADD CONSTRAINT "customer_memories_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_recovery_runs" ADD CONSTRAINT "cart_recovery_runs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_recovery_runs" ADD CONSTRAINT "cart_recovery_runs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cart_recovery_runs" ADD CONSTRAINT "cart_recovery_runs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "campaign_drafts" ADD CONSTRAINT "campaign_drafts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
