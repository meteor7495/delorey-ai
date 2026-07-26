-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "escalated_at" TIMESTAMP(3),
ADD COLUMN     "escalation_reason" TEXT,
ADD COLUMN     "handoff_packet" JSONB;

-- CreateIndex
CREATE INDEX "conversations_tenant_id_ownership_idx" ON "conversations"("tenant_id", "ownership");
