-- Academic Planning Phase 1: teacher-owned drafts and explicit publication audit.

DO $$ BEGIN
  CREATE TYPE "AcademicPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "academic_plans" (
  "id" TEXT NOT NULL,
  "teacherAssignmentId" TEXT NOT NULL,
  "academicTermId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000),
  "startDate" DATE,
  "endDate" DATE,
  "objectives" TEXT,
  "contents" TEXT,
  "activities" TEXT,
  "resources" TEXT,
  "evaluationNotes" TEXT,
  "notes" TEXT,
  "status" "AcademicPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "createdByUserId" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "publishedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "academic_plans_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "academic_plans_teacherAssignmentId_status_idx" ON "academic_plans"("teacherAssignmentId", "status");
CREATE INDEX "academic_plans_academicTermId_idx" ON "academic_plans"("academicTermId");

ALTER TABLE "academic_plans" ADD CONSTRAINT "academic_plans_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_plans" ADD CONSTRAINT "academic_plans_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_plans" ADD CONSTRAINT "academic_plans_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_plans" ADD CONSTRAINT "academic_plans_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
