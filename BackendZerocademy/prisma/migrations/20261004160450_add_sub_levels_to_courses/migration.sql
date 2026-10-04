-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "subLevelId" TEXT;

-- CreateTable
CREATE TABLE "sub_levels" (
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

    CONSTRAINT "sub_levels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sub_levels_academicLevelId_idx" ON "sub_levels"("academicLevelId");

-- CreateIndex
CREATE INDEX "sub_levels_institutionId_idx" ON "sub_levels"("institutionId");

-- CreateIndex
CREATE INDEX "sub_levels_isActive_idx" ON "sub_levels"("isActive");

-- CreateIndex
CREATE INDEX "sub_levels_order_idx" ON "sub_levels"("order");

-- CreateIndex
CREATE UNIQUE INDEX "sub_levels_academicLevelId_code_key" ON "sub_levels"("academicLevelId", "code");

-- CreateIndex
CREATE INDEX "courses_subLevelId_idx" ON "courses"("subLevelId");

-- AddForeignKey
ALTER TABLE "sub_levels" ADD CONSTRAINT "sub_levels_academicLevelId_fkey" FOREIGN KEY ("academicLevelId") REFERENCES "academic_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_levels" ADD CONSTRAINT "sub_levels_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_subLevelId_fkey" FOREIGN KEY ("subLevelId") REFERENCES "sub_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
