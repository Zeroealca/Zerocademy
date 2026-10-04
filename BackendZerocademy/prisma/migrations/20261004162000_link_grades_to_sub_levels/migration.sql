-- AlterTable
ALTER TABLE "grade_levels" ADD COLUMN "subLevelId" TEXT;

-- CreateIndex
CREATE INDEX "grade_levels_subLevelId_idx" ON "grade_levels"("subLevelId");

-- AddForeignKey
ALTER TABLE "grade_levels" ADD CONSTRAINT "grade_levels_subLevelId_fkey" FOREIGN KEY ("subLevelId") REFERENCES "sub_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
