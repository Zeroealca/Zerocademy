-- Assessments and grades tables (phase 1).
-- Tables may already exist from a prior schema push; constraints are applied idempotently where possible.

DO $$ BEGIN
  CREATE TABLE "assessments" (
      "id" TEXT NOT NULL,
      "institutionId" TEXT NOT NULL,
      "academicPeriodId" TEXT NOT NULL,
      "academicTermId" TEXT NOT NULL,
      "subjectId" TEXT NOT NULL,
      "teacherAssignmentId" TEXT NOT NULL,
      "assessmentCategoryId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "maxScore" DECIMAL(6,2) NOT NULL,
      "weight" DECIMAL(5,2) NOT NULL,
      "assessmentDate" DATE NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE "grades" (
      "id" TEXT NOT NULL,
      "assessmentId" TEXT NOT NULL,
      "enrollmentId" TEXT NOT NULL,
      "score" DECIMAL(6,2) NOT NULL,
      "observations" TEXT,
      "gradingSchemeId" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "assessments_institutionId_idx" ON "assessments"("institutionId");
CREATE INDEX IF NOT EXISTS "assessments_academicPeriodId_idx" ON "assessments"("academicPeriodId");
CREATE INDEX IF NOT EXISTS "assessments_academicTermId_idx" ON "assessments"("academicTermId");
CREATE INDEX IF NOT EXISTS "assessments_subjectId_idx" ON "assessments"("subjectId");
CREATE INDEX IF NOT EXISTS "assessments_teacherAssignmentId_idx" ON "assessments"("teacherAssignmentId");
CREATE INDEX IF NOT EXISTS "assessments_assessmentCategoryId_idx" ON "assessments"("assessmentCategoryId");
CREATE INDEX IF NOT EXISTS "assessments_academicPeriodId_teacherAssignmentId_idx" ON "assessments"("academicPeriodId", "teacherAssignmentId");
CREATE INDEX IF NOT EXISTS "assessments_institutionId_academicPeriodId_academicTermId_idx" ON "assessments"("institutionId", "academicPeriodId", "academicTermId");
CREATE UNIQUE INDEX IF NOT EXISTS "grades_assessmentId_enrollmentId_key" ON "grades"("assessmentId", "enrollmentId");
CREATE INDEX IF NOT EXISTS "grades_assessmentId_idx" ON "grades"("assessmentId");
CREATE INDEX IF NOT EXISTS "grades_enrollmentId_idx" ON "grades"("enrollmentId");
CREATE INDEX IF NOT EXISTS "grades_gradingSchemeId_idx" ON "grades"("gradingSchemeId");

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_academicTermId_fkey" FOREIGN KEY ("academicTermId") REFERENCES "academic_terms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessmentCategoryId_fkey" FOREIGN KEY ("assessmentCategoryId") REFERENCES "assessment_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "grades" ADD CONSTRAINT "grades_gradingSchemeId_fkey" FOREIGN KEY ("gradingSchemeId") REFERENCES "grading_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
