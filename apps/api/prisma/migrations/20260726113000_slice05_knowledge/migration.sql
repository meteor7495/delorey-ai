-- CreateTable
CREATE TABLE IF NOT EXISTS "knowledge_docs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "source_attribution" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'indexing',
    "object_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_docs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "knowledge_doc_id" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "knowledge_docs_tenant_id_idx" ON "knowledge_docs"("tenant_id");
CREATE INDEX IF NOT EXISTS "knowledge_docs_tenant_id_status_idx" ON "knowledge_docs"("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_tenant_id_idx" ON "knowledge_chunks"("tenant_id");
CREATE INDEX IF NOT EXISTS "knowledge_chunks_knowledge_doc_id_idx" ON "knowledge_chunks"("knowledge_doc_id");