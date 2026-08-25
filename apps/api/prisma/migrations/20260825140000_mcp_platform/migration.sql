-- Seloma MCP platform tables

CREATE TABLE "mcp_clients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'internal',
    "surface" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mcp_clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcp_access_tokens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token_prefix" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "user_id" TEXT,
    "employee_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_access_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcp_tool_overrides" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "approval_policy" TEXT,
    "public_enabled" BOOLEAN,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_tool_overrides_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcp_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT,
    "tool_name" TEXT NOT NULL,
    "tool_version" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input_sanitized" JSONB NOT NULL,
    "reason" TEXT,
    "requested_by_user_id" TEXT,
    "decided_by_user_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcp_executions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT,
    "user_id" TEXT,
    "employee_id" TEXT,
    "correlation_id" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "tool_version" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input_hash" TEXT,
    "input_sanitized" JSONB,
    "output_meta" JSONB,
    "error_code" TEXT,
    "error_message" TEXT,
    "duration_ms" INTEGER NOT NULL,
    "approval_id" TEXT,
    "idempotency_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mcp_clients_tenant_id_status_idx" ON "mcp_clients"("tenant_id", "status");
CREATE INDEX "mcp_access_tokens_tenant_id_client_id_idx" ON "mcp_access_tokens"("tenant_id", "client_id");
CREATE INDEX "mcp_access_tokens_token_prefix_idx" ON "mcp_access_tokens"("token_prefix");
CREATE UNIQUE INDEX "mcp_access_tokens_token_hash_key" ON "mcp_access_tokens"("token_hash");
CREATE UNIQUE INDEX "mcp_tool_overrides_tenant_id_tool_name_key" ON "mcp_tool_overrides"("tenant_id", "tool_name");
CREATE INDEX "mcp_tool_overrides_tenant_id_idx" ON "mcp_tool_overrides"("tenant_id");
CREATE INDEX "mcp_approvals_tenant_id_status_created_at_idx" ON "mcp_approvals"("tenant_id", "status", "created_at");
CREATE UNIQUE INDEX "mcp_executions_tenant_id_idempotency_key_key" ON "mcp_executions"("tenant_id", "idempotency_key");
CREATE INDEX "mcp_executions_tenant_id_created_at_idx" ON "mcp_executions"("tenant_id", "created_at");
CREATE INDEX "mcp_executions_tenant_id_tool_name_created_at_idx" ON "mcp_executions"("tenant_id", "tool_name", "created_at");
CREATE INDEX "mcp_executions_correlation_id_idx" ON "mcp_executions"("correlation_id");

ALTER TABLE "mcp_clients" ADD CONSTRAINT "mcp_clients_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_access_tokens" ADD CONSTRAINT "mcp_access_tokens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_access_tokens" ADD CONSTRAINT "mcp_access_tokens_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "mcp_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_tool_overrides" ADD CONSTRAINT "mcp_tool_overrides_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_approvals" ADD CONSTRAINT "mcp_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_approvals" ADD CONSTRAINT "mcp_approvals_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "mcp_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcp_executions" ADD CONSTRAINT "mcp_executions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcp_executions" ADD CONSTRAINT "mcp_executions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "mcp_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcp_executions" ADD CONSTRAINT "mcp_executions_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "mcp_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
