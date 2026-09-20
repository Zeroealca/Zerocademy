CREATE TYPE "RepresentativeRelationshipType" AS ENUM (
  'MOTHER',
  'FATHER',
  'LEGAL_GUARDIAN',
  'GRANDPARENT',
  'OTHER'
);

CREATE TABLE "representative_students" (
  "id" TEXT NOT NULL,
  "representativeUserId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "relationshipType" "RepresentativeRelationshipType" NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "representative_students_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "representative_students_representativeUserId_fkey"
    FOREIGN KEY ("representativeUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "representative_students_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "representative_students_representativeUserId_studentId_key"
  ON "representative_students"("representativeUserId", "studentId");
CREATE INDEX "representative_students_representativeUserId_isActive_idx"
  ON "representative_students"("representativeUserId", "isActive");
CREATE INDEX "representative_students_studentId_isActive_idx"
  ON "representative_students"("studentId", "isActive");
CREATE UNIQUE INDEX "representative_students_one_active_primary_per_student_key"
  ON "representative_students"("studentId") WHERE "isPrimary" = true AND "isActive" = true;
