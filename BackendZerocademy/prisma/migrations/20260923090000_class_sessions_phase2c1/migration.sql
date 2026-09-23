-- Academic Execution Phase 2C.1: actual teaching occurrences.

DO $$ BEGIN
  CREATE TYPE "ClassSessionStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "class_sessions" (
  "id" TEXT NOT NULL,
  "teacherAssignmentId" TEXT NOT NULL,
  "lessonPlanId" TEXT,
  "status" "ClassSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
  "scheduledDate" DATE,
  "occurredOn" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "class_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "class_sessions_teacherAssignmentId_scheduledDate_idx"
  ON "class_sessions"("teacherAssignmentId", "scheduledDate");
CREATE INDEX "class_sessions_teacherAssignmentId_occurredOn_idx"
  ON "class_sessions"("teacherAssignmentId", "occurredOn");
CREATE INDEX "class_sessions_lessonPlanId_idx"
  ON "class_sessions"("lessonPlanId");

ALTER TABLE "class_sessions"
  ADD CONSTRAINT "class_sessions_teacherAssignmentId_fkey"
  FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_sessions"
  ADD CONSTRAINT "class_sessions_lessonPlanId_fkey"
  FOREIGN KEY ("lessonPlanId") REFERENCES "lesson_plans"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
