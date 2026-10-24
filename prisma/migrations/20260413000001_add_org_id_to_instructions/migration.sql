-- Add org_id and user_id to LlmInstruction
ALTER TABLE "llm_instructions" ADD COLUMN "org_id" TEXT;
ALTER TABLE "llm_instructions" ADD COLUMN "user_id" TEXT;

-- Indexes for scoped lookups
CREATE INDEX "llm_instructions_org_id_idx" ON "llm_instructions"("org_id");
CREATE INDEX "llm_instructions_user_id_idx" ON "llm_instructions"("user_id");

-- Backfill existing instructions to the bouc-io org (they are platform-level, not public)
UPDATE "llm_instructions" SET "org_id" = 'a0000000-0000-4000-8000-000000000001' WHERE "org_id" IS NULL;
