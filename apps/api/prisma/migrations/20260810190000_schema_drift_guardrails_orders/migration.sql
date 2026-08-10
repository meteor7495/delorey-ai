-- Align DB with Prisma schema gaps that existed only as local drift before reset
ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "guardrails" JSONB;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'IRR';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_docs_tenant_id_fkey'
  ) THEN
    ALTER TABLE "knowledge_docs"
      ADD CONSTRAINT "knowledge_docs_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_chunks_tenant_id_fkey'
  ) THEN
    ALTER TABLE "knowledge_chunks"
      ADD CONSTRAINT "knowledge_chunks_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_chunks_knowledge_doc_id_fkey'
  ) THEN
    ALTER TABLE "knowledge_chunks"
      ADD CONSTRAINT "knowledge_chunks_knowledge_doc_id_fkey"
      FOREIGN KEY ("knowledge_doc_id") REFERENCES "knowledge_docs"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_tenant_id_fkey'
  ) THEN
    ALTER TABLE "orders"
      ADD CONSTRAINT "orders_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
