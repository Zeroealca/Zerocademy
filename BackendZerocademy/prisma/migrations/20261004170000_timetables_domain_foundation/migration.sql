-- CreateEnum
CREATE TYPE "ScheduleBlockKind" AS ENUM ('TEACHING', 'BREAK', 'NON_TEACHING');

-- CreateEnum
CREATE TYPE "TimetableStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI');

-- CreateTable
CREATE TABLE "period_schedule_structures" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "enabledWeekdays" "Weekday"[] DEFAULT ARRAY[]::"Weekday"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "period_schedule_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "periodScheduleStructureId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(120),
    "startTime" TIME(0) NOT NULL,
    "endTime" TIME(0) NOT NULL,
    "kind" "ScheduleBlockKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_loads" (
    "id" TEXT NOT NULL,
    "teacherAssignmentId" TEXT NOT NULL,
    "weeklyPeriods" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_loads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "academicPeriodId" TEXT NOT NULL,
    "status" "TimetableStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" TIMESTAMP(3),
    "publishedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" TEXT NOT NULL,
    "timetableId" TEXT NOT NULL,
    "teacherAssignmentId" TEXT NOT NULL,
    "scheduleBlockId" TEXT NOT NULL,
    "dayOfWeek" "Weekday" NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "period_schedule_structures_institutionId_idx" ON "period_schedule_structures"("institutionId");
CREATE INDEX "period_schedule_structures_academicPeriodId_idx" ON "period_schedule_structures"("academicPeriodId");
CREATE UNIQUE INDEX "period_schedule_structures_institutionId_academicPeriodId_key" ON "period_schedule_structures"("institutionId", "academicPeriodId");
CREATE INDEX "schedule_blocks_periodScheduleStructureId_idx" ON "schedule_blocks"("periodScheduleStructureId");
CREATE INDEX "schedule_blocks_kind_idx" ON "schedule_blocks"("kind");
CREATE UNIQUE INDEX "schedule_blocks_periodScheduleStructureId_position_key" ON "schedule_blocks"("periodScheduleStructureId", "position");
CREATE UNIQUE INDEX "teaching_loads_teacherAssignmentId_key" ON "teaching_loads"("teacherAssignmentId");
CREATE INDEX "timetables_institutionId_idx" ON "timetables"("institutionId");
CREATE INDEX "timetables_academicPeriodId_idx" ON "timetables"("academicPeriodId");
CREATE INDEX "timetables_status_idx" ON "timetables"("status");
CREATE INDEX "timetables_publishedByUserId_idx" ON "timetables"("publishedByUserId");
CREATE UNIQUE INDEX "timetables_institutionId_academicPeriodId_key" ON "timetables"("institutionId", "academicPeriodId");
CREATE INDEX "timetable_slots_timetableId_teacherId_dayOfWeek_idx" ON "timetable_slots"("timetableId", "teacherId", "dayOfWeek");
CREATE INDEX "timetable_slots_timetableId_courseId_dayOfWeek_idx" ON "timetable_slots"("timetableId", "courseId", "dayOfWeek");
CREATE INDEX "timetable_slots_teacherAssignmentId_idx" ON "timetable_slots"("teacherAssignmentId");
CREATE INDEX "timetable_slots_scheduleBlockId_idx" ON "timetable_slots"("scheduleBlockId");
CREATE INDEX "timetable_slots_teacherId_idx" ON "timetable_slots"("teacherId");
CREATE INDEX "timetable_slots_courseId_idx" ON "timetable_slots"("courseId");
CREATE UNIQUE INDEX "timetable_slots_timetableId_dayOfWeek_scheduleBlockId_teach_key" ON "timetable_slots"("timetableId", "dayOfWeek", "scheduleBlockId", "teacherId");
CREATE UNIQUE INDEX "timetable_slots_timetableId_dayOfWeek_scheduleBlockId_cours_key" ON "timetable_slots"("timetableId", "dayOfWeek", "scheduleBlockId", "courseId");
CREATE UNIQUE INDEX "timetable_slots_timetableId_teacherAssignmentId_dayOfWeek_s_key" ON "timetable_slots"("timetableId", "teacherAssignmentId", "dayOfWeek", "scheduleBlockId");

-- AddForeignKey
ALTER TABLE "period_schedule_structures" ADD CONSTRAINT "period_schedule_structures_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "period_schedule_structures" ADD CONSTRAINT "period_schedule_structures_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_periodScheduleStructureId_fkey" FOREIGN KEY ("periodScheduleStructureId") REFERENCES "period_schedule_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_loads" ADD CONSTRAINT "teaching_loads_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_academicPeriodId_fkey" FOREIGN KEY ("academicPeriodId") REFERENCES "academic_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacherAssignmentId_fkey" FOREIGN KEY ("teacherAssignmentId") REFERENCES "teacher_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_scheduleBlockId_fkey" FOREIGN KEY ("scheduleBlockId") REFERENCES "schedule_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
