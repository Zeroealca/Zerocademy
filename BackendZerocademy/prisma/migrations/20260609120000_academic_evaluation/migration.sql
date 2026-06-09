-- CreateEnum
CREATE TYPE "RoundingStrategy" AS ENUM ('ROUND_HALF_UP', 'ROUND_DOWN', 'ROUND_UP', 'TRUNCATE');

-- CreateTable
CREATE TABLE "grading_schemes" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "name" TEXT NOT NULL,
    "minScore" DECIMAL(6,2) NOT NULL,
    "maxScore" DECIMAL(6,2) NOT NULL,
    "passingScore" DECIMAL(6,2) NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grading_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_terms" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "startDate" DATE,
    "endDate" DATE,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_categories" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scales" (
    "id" TEXT NOT NULL,
    "gradingSchemeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minValue" DECIMAL(6,2) NOT NULL,
    "maxValue" DECIMAL(6,2) NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_scales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institution_academic_configurations" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "gradingSchemeId" TEXT NOT NULL,
    "activeAcademicPeriodId" TEXT,
    "roundingStrategy" "RoundingStrategy" NOT NULL DEFAULT 'ROUND_HALF_UP',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_academic_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grading_schemes_institutionId_idx" ON "grading_schemes"("institutionId");

-- CreateIndex
CREATE INDEX "grading_schemes_institutionId_isDefault_idx" ON "grading_schemes"("institutionId");

-- CreateIndex
CREATE INDEX "grading_schemes_isActive_idx" ON "grading_schemes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_terms_institutionId_academicPeriodId_order_key" ON "evaluation_terms"("institutionId", "academicPeriodId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_terms_institutionId_academicPeriodId_name_key" ON "evaluation_terms"("institutionId", "academicPeriodId", "name");

-- CreateIndex
CREATE INDEX "evaluation_terms_institutionId_idx" ON "evaluation_terms"("institutionId");

-- CreateIndex
CREATE INDEX "evaluation_terms_academicPeriodId_idx" ON "evaluation_terms"("academicPeriodId");

-- CreateIndex
CREATE INDEX "evaluation_terms_isActive_idx" ON "evaluation_terms"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_categories_institutionId_name_key" ON "assessment_categories"("institutionId", "name");

-- CreateIndex
CREATE INDEX "assessment_categories_institutionId_idx" ON "assessment_categories"("institutionId");

-- CreateIndex
CREATE INDEX "assessment_categories_isActive_idx" ON "assessment_categories"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_gradingSchemeId_code_key" ON "grade_scales"("gradingSchemeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scales_gradingSchemeId_order_key" ON "grade_scales"("gradingSchemeId", "order");

-- CreateIndex
CREATE INDEX "grade_scales_gradingSchemeId_idx" ON "grade_scales"("gradingSchemeId");

-- CreateIndex
CREATE UNIQUE INDEX "institution_academic_configurations_institutionId_key" ON "institution_academic_configurations"("institutionId");

-- CreateIndex
CREATE INDEX "institution_academic_configurations_gradingSchemeId_idx" ON "institution_academic_configurations"("gradingSchemeId");

-- CreateIndex
CREATE INDEX "institution_academic_configurations_activeAcademicPeriodId_idx" ON "institution_academic_configurations"("activeAcademicPeriodId");

-- AddForeignKey
ALTER TABLE "grading_schemes" ADD CONSTRAINT "grading_schemes_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_terms" ADD CONSTRAINT "evaluation_terms_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_terms" ADD CONSTRAINT "evaluation_terms_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_categories" ADD CONSTRAINT "assessment_categories_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scales" ADD CONSTRAINT "grade_scales_gradingSchemeId_fkey" FOREIGN KEY ("gradingSchemeId") REFERENCES "grading_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_academic_configurations" ADD CONSTRAINT "institution_academic_configurations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_academic_configurations" ADD CONSTRAINT "institution_academic_configurations_gradingSchemeId_fkey" FOREIGN KEY ("gradingSchemeId") REFERENCES "grading_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "institution_academic_configurations" ADD CONSTRAINT "institution_academic_configurations_activeAcademicPeriodId_fkey" FOREIGN KEY ("activeAcademicPeriodId") REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
