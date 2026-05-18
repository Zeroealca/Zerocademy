-- CreateEnum
CREATE TYPE "AcademicRegime" AS ENUM ('COSTA_GALAPAGOS', 'SIERRA_AMAZONIA');

-- CreateEnum
CREATE TYPE "AcademicPeriodStatus" AS ENUM ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "academic_periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regime" "AcademicRegime" NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" "AcademicPeriodStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_periods_regime_idx" ON "academic_periods"("regime");

-- CreateIndex
CREATE INDEX "academic_periods_status_idx" ON "academic_periods"("status");

-- CreateIndex
CREATE INDEX "academic_periods_isActive_idx" ON "academic_periods"("isActive");

-- CreateIndex
CREATE INDEX "academic_periods_regime_status_idx" ON "academic_periods"("regime", "status");

-- CreateIndex
CREATE INDEX "academic_periods_startDate_endDate_idx" ON "academic_periods"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "academic_terms_academicPeriodId_idx" ON "academic_terms"("academicPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_academicPeriodId_order_key" ON "academic_terms"("academicPeriodId", "order");

-- AddForeignKey
ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
