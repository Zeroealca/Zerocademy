-- DEMY-144: optional timetable origin and immutable occurrence snapshot.
-- Additive only: existing manual ClassSession records remain valid with null origin fields.
ALTER TABLE "class_sessions"
  ADD COLUMN "timetableSlotId" TEXT,
  ADD COLUMN "timetableOccurrenceKey" TEXT,
  ADD COLUMN "originTeacherAssignmentId" TEXT,
  ADD COLUMN "originInstitutionId" TEXT,
  ADD COLUMN "originInstitutionName" VARCHAR(200),
  ADD COLUMN "originAcademicPeriodId" TEXT,
  ADD COLUMN "originAcademicPeriodName" VARCHAR(200),
  ADD COLUMN "originCourseId" TEXT,
  ADD COLUMN "originCourseName" VARCHAR(200),
  ADD COLUMN "originSubjectId" TEXT,
  ADD COLUMN "originSubjectName" VARCHAR(200),
  ADD COLUMN "originWeekday" "Weekday",
  ADD COLUMN "originScheduleBlockId" TEXT,
  ADD COLUMN "originBlockStartTime" TIME(0),
  ADD COLUMN "originBlockEndTime" TIME(0);

CREATE UNIQUE INDEX "class_sessions_timetableOccurrenceKey_key"
  ON "class_sessions"("timetableOccurrenceKey");
CREATE INDEX "class_sessions_timetableSlotId_idx"
  ON "class_sessions"("timetableSlotId");
CREATE INDEX "class_sessions_originInstitutionId_originAcademicPeriodId_idx"
  ON "class_sessions"("originInstitutionId", "originAcademicPeriodId");

ALTER TABLE "class_sessions"
  ADD CONSTRAINT "class_sessions_timetableSlotId_fkey"
  FOREIGN KEY ("timetableSlotId") REFERENCES "timetable_slots"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
