-- Slice E: conversation customer link + shopping state

ALTER TABLE "conversations" ADD COLUMN "customer_id" TEXT;
ALTER TABLE "conversations" ADD COLUMN "shopping_state" TEXT NOT NULL DEFAULT 'browsing';
ALTER TABLE "conversations" ADD COLUMN "context" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX "conversations_tenant_id_customer_id_idx" ON "conversations"("tenant_id", "customer_id");
CREATE INDEX "conversations_tenant_id_shopping_state_idx" ON "conversations"("tenant_id", "shopping_state");

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
