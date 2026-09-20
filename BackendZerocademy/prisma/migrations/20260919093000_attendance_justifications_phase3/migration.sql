-- Controlled absence justifications. Approval changes the related attendance
-- record only in the application transaction; this table retains its own audit trail.

DO $$ BEGIN
  CREATE TYPE "AttendanceJustificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TABLE "attendance_justifications" (
    "id" TEXT NOT NULL,
    "attendanceRecordId" TEXT NOT NULL,
    "reason" VARCHAR(1000) NOT NULL,
    "status" "AttendanceJustificationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByUserId" TEXT NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_justifications_pkey" PRIMARY KEY ("id")
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "attendance_justifications_attendanceRecordId_status_idx"
  ON "attendance_justifications"("attendanceRecordId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_justifications_one_pending_per_record_key"
  ON "attendance_justifications"("attendanceRecordId")
  WHERE "status" = 'PENDING';
CREATE INDEX IF NOT EXISTS "attendance_justifications_submittedByUserId_idx"
  ON "attendance_justifications"("submittedByUserId");
CREATE INDEX IF NOT EXISTS "attendance_justifications_reviewedByUserId_idx"
  ON "attendance_justifications"("reviewedByUserId");

DO $$ BEGIN
  ALTER TABLE "attendance_justifications"
    ADD CONSTRAINT "attendance_justifications_attendanceRecordId_fkey"
    FOREIGN KEY ("attendanceRecordId") REFERENCES "attendance_records"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "attendance_justifications"
    ADD CONSTRAINT "attendance_justifications_submittedByUserId_fkey"
    FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "attendance_justifications"
    ADD CONSTRAINT "attendance_justifications_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
