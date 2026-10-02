CREATE TABLE "class_session_attendance_records" (
    "id" TEXT NOT NULL,
    "classSessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" VARCHAR(500),
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "class_session_attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "class_session_attendance_records_classSessionId_enrollmentId_key"
  ON "class_session_attendance_records"("classSessionId", "enrollmentId");
CREATE INDEX "class_session_attendance_records_enrollmentId_idx"
  ON "class_session_attendance_records"("enrollmentId");
CREATE INDEX "class_session_attendance_records_classSessionId_status_idx"
  ON "class_session_attendance_records"("classSessionId", "status");

ALTER TABLE "class_session_attendance_records"
  ADD CONSTRAINT "class_session_attendance_records_classSessionId_fkey"
  FOREIGN KEY ("classSessionId") REFERENCES "class_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_session_attendance_records"
  ADD CONSTRAINT "class_session_attendance_records_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_session_attendance_records"
  ADD CONSTRAINT "class_session_attendance_records_recordedByUserId_fkey"
  FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
