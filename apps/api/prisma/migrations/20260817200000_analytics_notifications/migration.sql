-- Slice G: analytics events + notification outbox

CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT,
    "customer_id" TEXT,
    "conversation_id" TEXT,
    "order_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_events_tenant_id_name_created_at_idx" ON "analytics_events"("tenant_id", "name", "created_at");
CREATE INDEX "analytics_events_tenant_id_channel_created_at_idx" ON "analytics_events"("tenant_id", "channel", "created_at");

ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "notification_outbox" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "conversation_id" TEXT,
    "order_id" TEXT,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_outbox_tenant_id_status_created_at_idx" ON "notification_outbox"("tenant_id", "status", "created_at");

ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
