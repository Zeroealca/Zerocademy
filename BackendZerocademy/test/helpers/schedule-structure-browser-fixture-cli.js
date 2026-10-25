const { PrismaClient, AcademicPeriodStatus, Role, ScheduleBlockKind, Weekday } = require("@prisma/client");
const bcrypt = require("bcrypt");
const { readFile, rm, writeFile } = require("node:fs/promises");
const { randomUUID } = require("node:crypto");

const outputPath = process.env.SCHEDULE_BROWSER_FIXTURE_PATH;

function assertGuardedUrl() {
  let url;
  try {
    url = new URL(process.env.DATABASE_URL || "");
  } catch {
    throw new Error("Fixture requires a valid DATABASE_URL.");
  }
  if (url.hostname !== "postgres" || url.pathname !== "/zerocademy_e2e") {
    throw new Error("Fixture requires DATABASE_URL host postgres and database zerocademy_e2e.");
  }
}

async function cleanupOrphanedFixturePeriods(prisma) {
  // Older cleanup runs removed their institutions but left these fixture-only
  // lifecycle periods as global records. Remove only that recognizable,
  // orphaned test data so it cannot crowd the selector's first page.
  await prisma.academicPeriod.deleteMany({ where: { institutionId: null, OR: [{ name: { startsWith: "Planned schedule-browser-e2e-" } }, { name: { startsWith: "Closed schedule-browser-e2e-" } }, { name: { startsWith: "Archived schedule-browser-e2e-" } }] } });
}

async function main() {
  if (!outputPath) throw new Error("SCHEDULE_BROWSER_FIXTURE_PATH is required.");
  assertGuardedUrl();
  const prisma = new PrismaClient();
  try {
    const [{ database }] = await prisma.$queryRawUnsafe("SELECT current_database() AS database");
    if (database !== "zerocademy_e2e") throw new Error("Fixture requires the zerocademy_e2e database.");
    if (process.argv[2] === "cleanup") {
      const fixture = JSON.parse(await readFile(outputPath, "utf8"));
      await prisma.institution.deleteMany({ where: { id: fixture.institutionId } });
      if (fixture.foreignInstitutionId) await prisma.institution.deleteMany({ where: { id: fixture.foreignInstitutionId } });
      await prisma.academicPeriod.deleteMany({ where: { id: { in: [fixture.plannedAcademicPeriodId, fixture.closedAcademicPeriodId, fixture.archivedAcademicPeriodId] } } });
      await prisma.user.deleteMany({ where: { email: { in: [fixture.admin.email, fixture.teacher.email, fixture.secondTeacher?.email, fixture.foreignTeacher?.email].filter(Boolean) } } });
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
      if (!process.env.TEACHER_TIMETABLE_FIXTURE) return { institutionId: institution.id, activeAcademicPeriodId: active.id, plannedAcademicPeriodId: planned.id, closedAcademicPeriodId: closed.id, archivedAcademicPeriodId: archived.id, timetableId: timetable.id, admin: { email: admin.email, password }, teacher: { email: teacher.email, password } };
      const [middleBlock, lateBlock] = await Promise.all([
        tx.scheduleBlock.create({ data: { periodScheduleStructureId: activeStructure.id, position: 4, name: `Segundo ${suffix}`, startTime: new Date("1970-01-01T09:00:00.000Z"), endTime: new Date("1970-01-01T09:40:00.000Z"), kind: ScheduleBlockKind.TEACHING } }),
        tx.scheduleBlock.create({ data: { periodScheduleStructureId: activeStructure.id, position: 5, name: `Tercero ${suffix}`, startTime: new Date("1970-01-01T10:00:00.000Z"), endTime: new Date("1970-01-01T10:40:00.000Z"), kind: ScheduleBlockKind.TEACHING } }),
      ]);
      await tx.periodScheduleStructure.update({ where: { id: activeStructure.id }, data: { enabledWeekdays: [Weekday.MON, Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI] } });
      await tx.teachingLoad.update({ where: { teacherAssignmentId: assignment.id }, data: { weeklyPeriods: 10 } });
      await tx.timetableSlot.create({ data: { timetableId: timetable.id, teacherAssignmentId: assignment.id, scheduleBlockId: lateBlock.id, dayOfWeek: Weekday.MON, teacherId: teacherProfile.id, courseId: course.id } });
      const secondTeacher = await tx.user.create({ data: { email: `teacher-two-${accountSuffix}@example.test`, passwordHash, firstName: "Browser", lastName: "Teacher Two", role: Role.TEACHER } });
      await tx.institutionMembership.create({ data: { institutionId: institution.id, userId: secondTeacher.id, role: "TEACHER" } });
      const secondTeacherProfile = await tx.teacherProfile.create({ data: { userId: secondTeacher.id, institutionId: institution.id } });
      const secondSubject = await tx.subject.create({ data: { name: `Ciencias ${suffix}`, code: `SCI-${suffix}`, institutionId: institution.id } });
      const secondCourse = await tx.course.create({ data: { name: `9.º E2E ${suffix}`, section: `two-${suffix}`, institutionId: institution.id, academicPeriodId: active.id, gradeLevelId: gradeLevel.id } });
      const secondAssignment = await tx.teacherAssignment.create({ data: { institutionId: institution.id, teacherId: secondTeacherProfile.id, subjectId: secondSubject.id, courseId: secondCourse.id, academicPeriodId: active.id } });
      await tx.teachingLoad.create({ data: { teacherAssignmentId: secondAssignment.id, weeklyPeriods: 1 } });
      await tx.timetableSlot.create({ data: { timetableId: timetable.id, teacherAssignmentId: secondAssignment.id, scheduleBlockId: middleBlock.id, dayOfWeek: Weekday.MON, teacherId: secondTeacherProfile.id, courseId: secondCourse.id } });
      for (const dayOfWeek of [Weekday.TUE, Weekday.WED, Weekday.THU, Weekday.FRI]) {
        await tx.timetableSlot.createMany({ data: [
          { timetableId: timetable.id, teacherAssignmentId: assignment.id, scheduleBlockId: activeStructure.scheduleBlocks[0].id, dayOfWeek, teacherId: teacherProfile.id, courseId: course.id },
          { timetableId: timetable.id, teacherAssignmentId: assignment.id, scheduleBlockId: lateBlock.id, dayOfWeek, teacherId: teacherProfile.id, courseId: course.id },
          { timetableId: timetable.id, teacherAssignmentId: secondAssignment.id, scheduleBlockId: middleBlock.id, dayOfWeek, teacherId: secondTeacherProfile.id, courseId: secondCourse.id },
        ] });
      }
      await tx.teachingLoad.update({ where: { teacherAssignmentId: secondAssignment.id }, data: { weeklyPeriods: 5 } });
      const plannedStructure = structures[1];
      const periodCourse = await tx.course.create({ data: { name: `Periodo E2E ${suffix}`, section: `period-${suffix}`, institutionId: institution.id, academicPeriodId: planned.id, gradeLevelId: gradeLevel.id } });
      const periodAssignment = await tx.teacherAssignment.create({ data: { institutionId: institution.id, teacherId: teacherProfile.id, subjectId: subject.id, courseId: periodCourse.id, academicPeriodId: planned.id } });
      await tx.teachingLoad.create({ data: { teacherAssignmentId: periodAssignment.id, weeklyPeriods: 1 } });
      const secondaryTimetable = await tx.timetable.create({ data: { institutionId: institution.id, academicPeriodId: planned.id, status: "PUBLISHED", publishedAt: new Date(), publishedByUserId: admin.id, slots: { create: { teacherAssignmentId: periodAssignment.id, scheduleBlockId: plannedStructure.scheduleBlocks[0].id, dayOfWeek: Weekday.MON, teacherId: teacherProfile.id, courseId: periodCourse.id } } } });
      const foreignInstitution = await tx.institution.create({ data: { name: `Foreign fixture ${suffix}`, code: `FOREIGN-FIXTURE-${suffix}`, regime: active.regime, activeAcademicPeriodId: active.id } });
      const foreignTeacher = await tx.user.create({ data: { email: `teacher-foreign-${accountSuffix}@example.test`, passwordHash, firstName: "Foreign", lastName: "Teacher", role: Role.TEACHER } });
      await tx.institutionMembership.create({ data: { institutionId: foreignInstitution.id, userId: foreignTeacher.id, role: "TEACHER" } });
      const foreignProfile = await tx.teacherProfile.create({ data: { userId: foreignTeacher.id, institutionId: foreignInstitution.id } });
      const foreignStructure = await tx.periodScheduleStructure.create({ data: { institutionId: foreignInstitution.id, academicPeriodId: active.id, enabledWeekdays: [Weekday.MON], scheduleBlocks: { create: { position: 1, name: `Foreign ${suffix}`, startTime: new Date("1970-01-01T08:00:00.000Z"), endTime: new Date("1970-01-01T08:40:00.000Z"), kind: ScheduleBlockKind.TEACHING } } }, include: { scheduleBlocks: true } });
      const foreignSubject = await tx.subject.create({ data: { name: `Historia privada ${suffix}`, code: `HIST-${suffix}`, institutionId: foreignInstitution.id } });
      const foreignCourse = await tx.course.create({ data: { name: `Extranjero ${suffix}`, section: `foreign-${suffix}`, institutionId: foreignInstitution.id, academicPeriodId: active.id, gradeLevelId: gradeLevel.id } });
      const foreignAssignment = await tx.teacherAssignment.create({ data: { institutionId: foreignInstitution.id, teacherId: foreignProfile.id, subjectId: foreignSubject.id, courseId: foreignCourse.id, academicPeriodId: active.id } });
      await tx.teachingLoad.create({ data: { teacherAssignmentId: foreignAssignment.id, weeklyPeriods: 1 } });
      const foreignTimetable = await tx.timetable.create({ data: { institutionId: foreignInstitution.id, academicPeriodId: active.id, status: "PUBLISHED", publishedAt: new Date(), publishedByUserId: admin.id, slots: { create: { teacherAssignmentId: foreignAssignment.id, scheduleBlockId: foreignStructure.scheduleBlocks[0].id, dayOfWeek: Weekday.MON, teacherId: foreignProfile.id, courseId: foreignCourse.id } } } });
      return { institutionId: institution.id, activeAcademicPeriodId: active.id, plannedAcademicPeriodId: planned.id, closedAcademicPeriodId: closed.id, archivedAcademicPeriodId: archived.id, timetableId: timetable.id, secondaryAcademicPeriodId: planned.id, secondaryTimetableId: secondaryTimetable.id, foreignInstitutionId: foreignInstitution.id, foreignTimetableId: foreignTimetable.id, admin: { email: admin.email, password }, teacher: { email: teacher.email, password }, secondTeacher: { email: secondTeacher.email, password }, foreignTeacher: { email: foreignTeacher.email, password } };
    });
    await writeFile(outputPath, JSON.stringify(fixture), "utf8");
  } finally { await prisma.$disconnect(); }
}

main();
