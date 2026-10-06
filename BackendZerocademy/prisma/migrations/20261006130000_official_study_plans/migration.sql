-- CreateEnum
CREATE TYPE "OfficialStudyPlanStatus" AS ENUM ('ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "OfficialStudyPlanValuePolicy" AS ENUM ('FIXED', 'MINIMUM', 'DEFAULT_EDITABLE', 'FLEXIBLE_POOL', 'REFERENCE_ONLY');

-- CreateTable
CREATE TABLE "official_study_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicabilityKey" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "issuedOn" DATE NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "status" "OfficialStudyPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "official_study_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_study_plan_allocation_groups" (
    "id" TEXT NOT NULL,
    "officialStudyPlanId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "valuePolicy" "OfficialStudyPlanValuePolicy" NOT NULL,
    "defaultWeeklyPeriods" INTEGER,
    "minimumWeeklyPeriods" INTEGER,
    "sourceLocator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "official_study_plan_allocation_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_study_plan_entries" (
    "id" TEXT NOT NULL,
    "officialStudyPlanId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "valuePolicy" "OfficialStudyPlanValuePolicy" NOT NULL,
    "defaultWeeklyPeriods" INTEGER,
    "minimumWeeklyPeriods" INTEGER,
    "allocationGroupId" TEXT,
    "sourceLocator" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "official_study_plan_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_study_plan_adoptions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "officialStudyPlanId" TEXT NOT NULL,
    "applicabilityKey" TEXT NOT NULL,
    "adoptedByUserId" TEXT NOT NULL,
    "adoptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "institution_study_plan_adoptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "official_study_plans_code_version_key" ON "official_study_plans"("code", "version");
CREATE INDEX "official_study_plans_applicabilityKey_status_idx" ON "official_study_plans"("applicabilityKey", "status");
CREATE INDEX "official_study_plans_effectiveFrom_effectiveTo_idx" ON "official_study_plans"("effectiveFrom", "effectiveTo");
CREATE UNIQUE INDEX "official_study_plan_allocation_groups_officialStudyPlanId_gradeLevelId_key_key" ON "official_study_plan_allocation_groups"("officialStudyPlanId", "gradeLevelId", "key");
CREATE INDEX "official_study_plan_allocation_groups_officialStudyPlanId_idx" ON "official_study_plan_allocation_groups"("officialStudyPlanId");
CREATE INDEX "official_study_plan_allocation_groups_gradeLevelId_idx" ON "official_study_plan_allocation_groups"("gradeLevelId");
CREATE UNIQUE INDEX "official_study_plan_entries_officialStudyPlanId_gradeLevelId_subjectId_key" ON "official_study_plan_entries"("officialStudyPlanId", "gradeLevelId", "subjectId");
CREATE INDEX "official_study_plan_entries_officialStudyPlanId_idx" ON "official_study_plan_entries"("officialStudyPlanId");
CREATE INDEX "official_study_plan_entries_gradeLevelId_idx" ON "official_study_plan_entries"("gradeLevelId");
CREATE INDEX "official_study_plan_entries_subjectId_idx" ON "official_study_plan_entries"("subjectId");
CREATE INDEX "official_study_plan_entries_allocationGroupId_idx" ON "official_study_plan_entries"("allocationGroupId");
CREATE UNIQUE INDEX "institution_study_plan_adoptions_plan_key" ON "institution_study_plan_adoptions"("institutionId", "academicPeriodId", "officialStudyPlanId");
CREATE UNIQUE INDEX "institution_study_plan_adoptions_scope_key" ON "institution_study_plan_adoptions"("institutionId", "academicPeriodId", "applicabilityKey");
CREATE INDEX "institution_study_plan_adoptions_institutionId_idx" ON "institution_study_plan_adoptions"("institutionId");
CREATE INDEX "institution_study_plan_adoptions_academicPeriodId_idx" ON "institution_study_plan_adoptions"("academicPeriodId");
CREATE INDEX "institution_study_plan_adoptions_officialStudyPlanId_idx" ON "institution_study_plan_adoptions"("officialStudyPlanId");
CREATE INDEX "institution_study_plan_adoptions_adoptedByUserId_idx" ON "institution_study_plan_adoptions"("adoptedByUserId");

-- AddForeignKey
ALTER TABLE "official_study_plan_allocation_groups" ADD CONSTRAINT "official_study_plan_allocation_groups_officialStudyPlanId_fkey" FOREIGN KEY ("officialStudyPlanId") REFERENCES "official_study_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "official_study_plan_allocation_groups" ADD CONSTRAINT "official_study_plan_allocation_groups_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "official_study_plan_entries" ADD CONSTRAINT "official_study_plan_entries_officialStudyPlanId_fkey" FOREIGN KEY ("officialStudyPlanId") REFERENCES "official_study_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "official_study_plan_entries" ADD CONSTRAINT "official_study_plan_entries_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "official_study_plan_entries" ADD CONSTRAINT "official_study_plan_entries_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "official_study_plan_entries" ADD CONSTRAINT "official_study_plan_entries_allocationGroupId_fkey" FOREIGN KEY ("allocationGroupId") REFERENCES "official_study_plan_allocation_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institution_study_plan_adoptions" ADD CONSTRAINT "institution_study_plan_adoptions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institution_study_plan_adoptions" ADD CONSTRAINT "institution_study_plan_adoptions_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institution_study_plan_adoptions" ADD CONSTRAINT "institution_study_plan_adoptions_officialStudyPlanId_fkey" FOREIGN KEY ("officialStudyPlanId") REFERENCES "official_study_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "institution_study_plan_adoptions" ADD CONSTRAINT "institution_study_plan_adoptions_adoptedByUserId_fkey" FOREIGN KEY ("adoptedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
