-- AlterTable channel_bindings
ALTER TABLE "channel_bindings" ADD COLUMN IF NOT EXISTS "credentials_cipher" TEXT;
ALTER TABLE "channel_bindings" ADD COLUMN IF NOT EXISTS "webhook_secret" TEXT;
ALTER TABLE "channel_bindings" ADD COLUMN IF NOT EXISTS "bot_username" TEXT;

-- AlterTable conversations
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "external_thread_id" TEXT;

-- AlterTable messages
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_tenant_id_channel_external_thread_id_key" ON "conversations"("tenant_id", "channel", "external_thread_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "messages_tenant_id_idempotency_key_key" ON "messages"("tenant_id", "idempotency_key");
