-- CreateTable
CREATE TABLE "lesson_plans" (
    "id" TEXT NOT NULL,
    "academicUnitId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "lessonDate" DATE NOT NULL,
    "durationMinutes" INTEGER,
    "objectives" TEXT,
    "introduction" TEXT,
    "development" TEXT,
    "closure" TEXT,
    "resources" TEXT,
    "evaluationStrategy" TEXT,
    "notes" TEXT,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_plans_academicUnitId_position_key" ON "lesson_plans"("academicUnitId", "position");

-- CreateIndex
CREATE INDEX "lesson_plans_academicUnitId_position_idx" ON "lesson_plans"("academicUnitId", "position");

-- AddForeignKey
ALTER TABLE "lesson_plans" ADD CONSTRAINT "lesson_plans_academicUnitId_fkey" FOREIGN KEY ("academicUnitId") REFERENCES "academic_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
