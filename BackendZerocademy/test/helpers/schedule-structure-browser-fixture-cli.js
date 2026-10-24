const { PrismaClient, AcademicPeriodStatus, Role, ScheduleBlockKind, Weekday } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { readFile, rm, writeFile } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const outputPath = process.env.SCHEDULE_BROWSER_FIXTURE_PATH;

async function cleanupOrphanedFixturePeriods(prisma) {
  // Older cleanup runs removed their institutions but left these fixture-only
  // lifecycle periods as global records. Remove only that recognizable,
  // orphaned test data so it cannot crowd the selector's first page.
  await prisma.academicPeriod.deleteMany({ where: { institutionId: null, OR: [{ name: { startsWith: "Planned schedule-browser-e2e-" } }, { name: { startsWith: "Closed schedule-browser-e2e-" } }, { name: { startsWith: "Archived schedule-browser-e2e-" } }] } });
}

async function main() {
  if (!outputPath) throw new Error("SCHEDULE_BROWSER_FIXTURE_PATH is required.");
  if (!/zerocademy_e2e/.test(process.env.DATABASE_URL || "")) throw new Error("Fixture requires DATABASE_URL for zerocademy_e2e.");
  const prisma = new PrismaClient();
  try {
    const [{ database }] = await prisma.$queryRawUnsafe("SELECT current_database() AS database");
    if (database !== "zerocademy_e2e") throw new Error("Fixture requires the zerocademy_e2e database.");
    if (process.argv[2] === "cleanup") {
      const fixture = JSON.parse(await readFile(outputPath, "utf8"));
      await prisma.institution.deleteMany({ where: { id: fixture.institutionId } });
      await prisma.academicPeriod.deleteMany({ where: { id: { in: [fixture.plannedAcademicPeriodId, fixture.closedAcademicPeriodId, fixture.archivedAcademicPeriodId] } } });
      await prisma.user.deleteMany({ where: { email: { in: [fixture.admin.email, fixture.teacher.email] } } });
      await cleanupOrphanedFixturePeriods(prisma);
      await rm(outputPath, { force: true });
      return;
    }
    await cleanupOrphanedFixturePeriods(prisma);
    const active = await prisma.academicPeriod.findFirst({ where: { institutionId: null, status: AcademicPeriodStatus.ACTIVE, isActive: true }, orderBy: { createdAt: "asc" } });
    if (!active) throw new Error("Fixture requires an active global academic period.");
    const gradeLevel = await prisma.gradeLevel.findFirst({ where: { isActive: true }, orderBy: { order: "asc" } });
    if (!gradeLevel) throw new Error("Fixture requires an active grade level.");
    // `Course.section` is unique per academic period and grade level, even
    // across institutions. A UUID prevents collisions after an interrupted
    // run or when independent workers create fixtures concurrently.
    const suffix = `schedule-browser-e2e-${randomUUID()}`;
    const accountSuffix = randomUUID();
    const password = "ScheduleBrowserE2e!123";
    const passwordHash = await bcrypt.hash(password, 10);
    const profile = await prisma.permissionProfile.findUniqueOrThrow({ where: { key: "ADMIN_BASELINE" } });
    const fixture = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({ data: { name: `Browser fixture ${suffix}`, code: `BROWSER-FIXTURE-${suffix}`, regime: active.regime, activeAcademicPeriodId: active.id } });
      // The workspace loads page 1 only; these dates keep all lifecycle
      // options ahead of older, interrupted fixture records.
      const planned = await tx.academicPeriod.create({ data: { name: `Planned ${suffix}`, institutionId: institution.id, regime: active.regime, startDate: new Date("2200-04-01"), endDate: new Date("2201-03-31"), status: AcademicPeriodStatus.PLANNED } });
      const closed = await tx.academicPeriod.create({ data: { name: `Closed ${suffix}`, institutionId: institution.id, regime: active.regime, startDate: new Date("2199-04-01"), endDate: new Date("2200-03-31"), status: AcademicPeriodStatus.CLOSED } });
      const archived = await tx.academicPeriod.create({ data: { name: `Archived ${suffix}`, institutionId: institution.id, regime: active.regime, startDate: new Date("2198-04-01"), endDate: new Date("2199-03-31"), status: AcademicPeriodStatus.ARCHIVED } });
      // Keep the local part below the email-validation limit used by login.
      const admin = await tx.user.create({ data: { email: `admin-${accountSuffix}@example.test`, passwordHash, firstName: "Browser", lastName: "Admin", role: Role.ADMIN } });
      const teacher = await tx.user.create({ data: { email: `teacher-${accountSuffix}@example.test`, passwordHash, firstName: "Browser", lastName: "Teacher", role: Role.TEACHER } });
      await tx.institutionMembership.createMany({ data: [{ institutionId: institution.id, userId: admin.id, role: "ADMIN", permissionProfileId: profile.id }, { institutionId: institution.id, userId: teacher.id, role: "TEACHER" }] });
      const structures = await Promise.all([[active.id, `Activo ${suffix}`], [planned.id, `Planificado ${suffix}`], [closed.id, `Cerrado ${suffix}`], [archived.id, `Archivado ${suffix}`]].map(([academicPeriodId, name]) => tx.periodScheduleStructure.create({ data: { institutionId: institution.id, academicPeriodId, enabledWeekdays: [Weekday.MON, Weekday.TUE], scheduleBlocks: { create: [{ position: 1, name, startTime: new Date("1970-01-01T08:00:00.000Z"), endTime: new Date("1970-01-01T08:40:00.000Z"), kind: ScheduleBlockKind.TEACHING }, { position: 2, name: `Recreo ${suffix}`, startTime: new Date("1970-01-01T08:40:00.000Z"), endTime: new Date("1970-01-01T09:00:00.000Z"), kind: ScheduleBlockKind.BREAK }, { position: 3, name: `No lectivo ${suffix}`, startTime: new Date("1970-01-01T09:00:00.000Z"), endTime: new Date("1970-01-01T09:20:00.000Z"), kind: ScheduleBlockKind.NON_TEACHING }] } }, include: { scheduleBlocks: true } })));
      const activeStructure = structures[0];
      const teacherProfile = await tx.teacherProfile.create({ data: { userId: teacher.id, institutionId: institution.id } });
      const subject = await tx.subject.create({ data: { name: `Matemática ${suffix}`, code: `MATH-${suffix}`, institutionId: institution.id } });
      const course = await tx.course.create({ data: { name: `10.º E2E ${suffix}`, section: suffix, institutionId: institution.id, academicPeriodId: active.id, gradeLevelId: gradeLevel.id } });
      const assignment = await tx.teacherAssignment.create({ data: { institutionId: institution.id, teacherId: teacherProfile.id, subjectId: subject.id, courseId: course.id, academicPeriodId: active.id } });
      await tx.teachingLoad.create({ data: { teacherAssignmentId: assignment.id, weeklyPeriods: 1 } });
      const timetable = await tx.timetable.create({ data: { institutionId: institution.id, academicPeriodId: active.id, slots: { create: { teacherAssignmentId: assignment.id, scheduleBlockId: activeStructure.scheduleBlocks[0].id, dayOfWeek: Weekday.MON, teacherId: teacherProfile.id, courseId: course.id } } } });
      return { institutionId: institution.id, activeAcademicPeriodId: active.id, plannedAcademicPeriodId: planned.id, closedAcademicPeriodId: closed.id, archivedAcademicPeriodId: archived.id, timetableId: timetable.id, admin: { email: admin.email, password }, teacher: { email: teacher.email, password } };
    });
    await writeFile(outputPath, JSON.stringify(fixture), "utf8");
  } finally { await prisma.$disconnect(); }
}

main();
