CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'PUBLISHED');
ALTER TABLE "assessments" ADD COLUMN "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "assessments" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "assessments" ADD COLUMN "publishedByUserId" TEXT;
-- Preserve the visibility behavior of assessments created before publication existed.
UPDATE "assessments" SET "status" = 'PUBLISHED', "publishedAt" = "createdAt";
CREATE INDEX "assessments_status_idx" ON "assessments"("status");
CREATE INDEX "assessments_publishedByUserId_idx" ON "assessments"("publishedByUserId");
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "assessment_roster_entries" (
  "id" TEXT NOT NULL, "assessmentId" TEXT NOT NULL, "enrollmentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessment_roster_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "assessment_roster_entries_assessmentId_enrollmentId_key" ON "assessment_roster_entries"("assessmentId", "enrollmentId");
CREATE INDEX "assessment_roster_entries_assessmentId_idx" ON "assessment_roster_entries"("assessmentId");
CREATE INDEX "assessment_roster_entries_enrollmentId_idx" ON "assessment_roster_entries"("enrollmentId");
ALTER TABLE "assessment_roster_entries" ADD CONSTRAINT "assessment_roster_entries_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assessment_roster_entries" ADD CONSTRAINT "assessment_roster_entries_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
