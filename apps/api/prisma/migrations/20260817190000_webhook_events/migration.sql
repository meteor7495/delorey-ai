-- Slice F: idempotent inbound webhooks

CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "external_event_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_events_tenant_id_provider_external_event_id_key" ON "webhook_events"("tenant_id", "provider", "external_event_id");
CREATE INDEX "webhook_events_tenant_id_provider_created_at_idx" ON "webhook_events"("tenant_id", "provider", "created_at");

ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
