-- Institution memberships, active academic period pointer, transition audit

-- CreateEnum
CREATE TYPE "InstitutionMembershipRole" AS ENUM ('ADMIN', 'TEACHER');

-- Institution active period
ALTER TABLE "institutions" ADD COLUMN "activeAcademicPeriodId" TEXT;
CREATE INDEX "institutions_activeAcademicPeriodId_idx" ON "institutions"("activeAcademicPeriodId");
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_activeAcademicPeriodId_fkey" FOREIGN KEY ("activeAcademicPeriodId") REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Institution memberships
CREATE TABLE "institution_memberships" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "InstitutionMembershipRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "institution_memberships_institutionId_userId_key" ON "institution_memberships"("institutionId", "userId");
CREATE INDEX "institution_memberships_institutionId_idx" ON "institution_memberships"("institutionId");
CREATE INDEX "institution_memberships_userId_idx" ON "institution_memberships"("userId");
CREATE INDEX "institution_memberships_institutionId_role_idx" ON "institution_memberships"("institutionId", "role");
CREATE INDEX "institution_memberships_isActive_idx" ON "institution_memberships"("isActive");

ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Academic period transitions (audit)
CREATE TABLE "academic_period_transitions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "fromAcademicPeriodId" TEXT NOT NULL,
    "toAcademicPeriodId" TEXT NOT NULL,
    "executedById" TEXT NOT NULL,
    "copiedCourses" BOOLEAN NOT NULL DEFAULT false,
    "copiedAssignments" BOOLEAN NOT NULL DEFAULT false,
    "copiedStructures" BOOLEAN NOT NULL DEFAULT false,
    "copiedTerms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academic_period_transitions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "academic_period_transitions_institutionId_idx" ON "academic_period_transitions"("institutionId");
CREATE INDEX "academic_period_transitions_fromAcademicPeriodId_idx" ON "academic_period_transitions"("fromAcademicPeriodId");
CREATE INDEX "academic_period_transitions_toAcademicPeriodId_idx" ON "academic_period_transitions"("toAcademicPeriodId");
CREATE INDEX "academic_period_transitions_executedById_idx" ON "academic_period_transitions"("executedById");
CREATE INDEX "academic_period_transitions_createdAt_idx" ON "academic_period_transitions"("createdAt");

ALTER TABLE "academic_period_transitions" ADD CONSTRAINT "academic_period_transitions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "academic_period_transitions" ADD CONSTRAINT "academic_period_transitions_fromAcademicPeriodId_fkey" FOREIGN KEY ("fromAcademicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_period_transitions" ADD CONSTRAINT "academic_period_transitions_toAcademicPeriodId_fkey" FOREIGN KEY ("toAcademicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "academic_period_transitions" ADD CONSTRAINT "academic_period_transitions_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
