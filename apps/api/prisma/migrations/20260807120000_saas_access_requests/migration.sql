-- SaaS landing: tenant billing + access requests

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'trial';
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "billing_status" TEXT NOT NULL DEFAULT 'trial';

CREATE TABLE IF NOT EXISTS "access_requests" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "tenant_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "access_requests_email_idx" ON "access_requests"("email");
CREATE INDEX IF NOT EXISTS "access_requests_status_created_at_idx" ON "access_requests"("status", "created_at");

DO $$ BEGIN
  ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
