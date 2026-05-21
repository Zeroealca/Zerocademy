-- Institution foundation: expand institutions table and add institution ownership FKs

-- CreateEnum
CREATE TYPE "InstitutionRegion" AS ENUM ('COSTA', 'SIERRA', 'AMAZONIA', 'GALAPAGOS');

-- Rename slug -> code on institutions
ALTER TABLE "institutions" RENAME COLUMN "slug" TO "code";
ALTER INDEX "institutions_slug_key" RENAME TO "institutions_code_key";

-- Expand institutions
ALTER TABLE "institutions"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "region" "InstitutionRegion",
  ADD COLUMN "regime" "AcademicRegime",
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "primaryColor" TEXT,
  ADD COLUMN "secondaryColor" TEXT;

CREATE INDEX "institutions_isActive_idx" ON "institutions"("isActive");
CREATE INDEX "institutions_region_idx" ON "institutions"("region");
CREATE INDEX "institutions_regime_idx" ON "institutions"("regime");

-- Academic period ownership
ALTER TABLE "academic_periods" ADD COLUMN "institutionId" TEXT;
CREATE INDEX "academic_periods_institutionId_idx" ON "academic_periods"("institutionId");
CREATE INDEX "academic_periods_institutionId_regime_status_idx" ON "academic_periods"("institutionId", "regime", "status");
ALTER TABLE "academic_periods" ADD CONSTRAINT "academic_periods_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Course ownership
ALTER TABLE "courses" ADD COLUMN "institutionId" TEXT;
CREATE INDEX "courses_institutionId_idx" ON "courses"("institutionId");
ALTER TABLE "courses" ADD CONSTRAINT "courses_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subject ownership (scoped codes)
ALTER TABLE "subjects" ADD COLUMN "institutionId" TEXT;
DROP INDEX IF EXISTS "subjects_code_key";
CREATE INDEX "subjects_institutionId_idx" ON "subjects"("institutionId");
CREATE UNIQUE INDEX "subjects_global_code_key" ON "subjects"("code") WHERE "institutionId" IS NULL;
CREATE UNIQUE INDEX "subjects_institution_code_key" ON "subjects"("institutionId", "code") WHERE "institutionId" IS NOT NULL;
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Teacher assignment ownership
ALTER TABLE "teacher_assignments" ADD COLUMN "institutionId" TEXT;
CREATE INDEX "teacher_assignments_institutionId_idx" ON "teacher_assignments"("institutionId");
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
