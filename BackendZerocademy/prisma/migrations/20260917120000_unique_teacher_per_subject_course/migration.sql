DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "teacher_assignments"
    GROUP BY "subjectId", "courseId", "academicPeriodId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple teachers are assigned to the same subject, course and period. Resolve these assignments before applying this migration; no records have been deleted.';
  END IF;
END $$;

CREATE UNIQUE INDEX "teacher_assignments_subject_course_period_key"
ON "teacher_assignments"("subjectId", "courseId", "academicPeriodId");
