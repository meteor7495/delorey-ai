/*
  Warnings:

  - A unique constraint covering the columns `[customer_id]` on the table `customer_memories` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "campaign_drafts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "cart_recovery_runs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "customer_memories" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "experiments" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "revenue_opportunities" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow_definitions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "customer_memories_customer_id_key" ON "customer_memories"("customer_id");
