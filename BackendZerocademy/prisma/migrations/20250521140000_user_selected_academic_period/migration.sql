-- AlterTable
ALTER TABLE "users" ADD COLUMN "selectedAcademicPeriodId" TEXT;

-- CreateIndex
CREATE INDEX "users_selectedAcademicPeriodId_idx" ON "users"("selectedAcademicPeriodId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_selectedAcademicPeriodId_fkey" FOREIGN KEY ("selectedAcademicPeriodId") REFERENCES "academic_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
