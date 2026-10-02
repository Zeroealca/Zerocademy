-- Grade-entry integrity and append-only audit history.
CREATE TYPE "GradeAuditOperation" AS ENUM ('CREATED', 'UPDATED', 'CLEARED');

CREATE TABLE "grade_audit_events" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "operation" "GradeAuditOperation" NOT NULL,
    "previousScore" DECIMAL(6,2),
    "newScore" DECIMAL(6,2),
    "previousObservations" TEXT,
    "newObservations" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grade_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "grade_audit_events_assessmentId_idx" ON "grade_audit_events"("assessmentId");
CREATE INDEX "grade_audit_events_enrollmentId_idx" ON "grade_audit_events"("enrollmentId");
CREATE INDEX "grade_audit_events_actorId_idx" ON "grade_audit_events"("actorId");
CREATE INDEX "grade_audit_events_createdAt_idx" ON "grade_audit_events"("createdAt");

ALTER TABLE "grade_audit_events" ADD CONSTRAINT "grade_audit_events_assessmentId_fkey"
  FOREIGN KEY ("assessmentId") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grade_audit_events" ADD CONSTRAINT "grade_audit_events_enrollmentId_fkey"
  FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "grade_audit_events" ADD CONSTRAINT "grade_audit_events_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
