-- Academic structure: reusable levels/grades and period-scoped classroom courses

CREATE TABLE "academic_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "institutionId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grade_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "description" TEXT,
    "academicLevelId" TEXT NOT NULL,
    "institutionId" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "capacity" INTEGER,
    "academicPeriodId" TEXT NOT NULL,
    "gradeLevelId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grade_levels_academicLevelId_code_key" ON "grade_levels"("academicLevelId", "code");
CREATE UNIQUE INDEX "courses_academicPeriodId_gradeLevelId_section_key" ON "courses"("academicPeriodId", "gradeLevelId", "section");

CREATE INDEX "academic_levels_institutionId_idx" ON "academic_levels"("institutionId");
CREATE INDEX "academic_levels_isActive_idx" ON "academic_levels"("isActive");
CREATE INDEX "academic_levels_order_idx" ON "academic_levels"("order");
CREATE INDEX "academic_levels_isSystem_idx" ON "academic_levels"("isSystem");

CREATE INDEX "grade_levels_academicLevelId_idx" ON "grade_levels"("academicLevelId");
CREATE INDEX "grade_levels_institutionId_idx" ON "grade_levels"("institutionId");
CREATE INDEX "grade_levels_isActive_idx" ON "grade_levels"("isActive");
CREATE INDEX "grade_levels_order_idx" ON "grade_levels"("order");

CREATE INDEX "courses_academicPeriodId_idx" ON "courses"("academicPeriodId");
CREATE INDEX "courses_gradeLevelId_idx" ON "courses"("gradeLevelId");
CREATE INDEX "courses_isActive_idx" ON "courses"("isActive");

CREATE UNIQUE INDEX "academic_levels_global_code_key" ON "academic_levels"("code") WHERE "institutionId" IS NULL;
CREATE UNIQUE INDEX "academic_levels_institution_code_key" ON "academic_levels"("institutionId", "code") WHERE "institutionId" IS NOT NULL;

ALTER TABLE "academic_levels" ADD CONSTRAINT "academic_levels_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_academicLevelId_fkey" FOREIGN KEY ("academicLevelId") REFERENCES "academic_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
