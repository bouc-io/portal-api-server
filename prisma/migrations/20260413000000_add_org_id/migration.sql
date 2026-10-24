-- Add org_id and user_id to billing models
ALTER TABLE "subscriptions" ADD COLUMN "org_id" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN "user_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "org_id" TEXT;
ALTER TABLE "invoices" ADD COLUMN "user_id" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "org_id" TEXT;
ALTER TABLE "payment_methods" ADD COLUMN "user_id" TEXT;

-- Indexes for scoped lookups
CREATE INDEX "subscriptions_org_id_idx" ON "subscriptions"("org_id");
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX "invoices_org_id_idx" ON "invoices"("org_id");
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");
CREATE INDEX "payment_methods_org_id_idx" ON "payment_methods"("org_id");
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods"("user_id");

-- Backfill existing records to the public org
UPDATE "subscriptions" SET "org_id" = 'a0000000-0000-4000-8000-000000000002' WHERE "org_id" IS NULL;
UPDATE "invoices" SET "org_id" = 'a0000000-0000-4000-8000-000000000002' WHERE "org_id" IS NULL;
UPDATE "payment_methods" SET "org_id" = 'a0000000-0000-4000-8000-000000000002' WHERE "org_id" IS NULL;
