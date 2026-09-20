-- Academic Planning Phase 2A: ordered units owned by an academic plan.
CREATE TABLE "academic_units" (
  "id" TEXT NOT NULL,
  "academicPlanId" TEXT NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" VARCHAR(2000),
  "objectives" TEXT,
  "contents" TEXT,
  "activities" TEXT,
  "resources" TEXT,
  "evaluationNotes" TEXT,
  "startDate" DATE,
  "endDate" DATE,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "academic_units_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "academic_units_academicPlanId_position_key" ON "academic_units"("academicPlanId", "position");
CREATE INDEX "academic_units_academicPlanId_position_idx" ON "academic_units"("academicPlanId", "position");
ALTER TABLE "academic_units" ADD CONSTRAINT "academic_units_academicPlanId_fkey" FOREIGN KEY ("academicPlanId") REFERENCES "academic_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
