import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  AcademicPeriodStatus,
  EnrollmentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ATTENDANCE_CONTEXT } from './constants';
import type {
  AttendanceCourseDto,
  BulkAttendanceResultDto,
  DailyAttendanceResponseDto,
} from './dto/attendance-response.dto';
import type { BulkUpsertAttendanceDto } from './dto/bulk-upsert-attendance.dto';
import type { DailyAttendanceQueryDto } from './dto/daily-attendance-query.dto';

type AttendanceCourse = {
  id: string;
  name: string;
  section: string;
  gradeLevel: { name: string };
};
type ScopedCourse = AttendanceCourse & {
  institutionId: string | null;
  academicPeriod: { status: AcademicPeriodStatus };
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getCourses(
    actor: AuthenticatedUser,
    academicPeriodId: string,
  ): Promise<AttendanceCourseDto[]> {
    const where: Prisma.CourseWhereInput = { academicPeriodId, isActive: true };
    if (actor.role === Role.TEACHER) {
      if (!actor.profileId) return [];
      where.teacherAssignments = {
        some: { teacherId: actor.profileId, academicPeriodId },
      };
    } else if (actor.role === Role.ADMIN) {
      const institutionIds = await this.accessibleInstitutionIds(actor);
      where.institutionId = { in: institutionIds };
    }
    const courses = await this.prisma.course.findMany({
      where,
      select: {
        id: true,
        name: true,
        section: true,
        gradeLevel: { select: { name: true } },
      },
      orderBy: [{ gradeLevel: { order: 'asc' } }, { section: 'asc' }],
    });
    return courses.map((course) => this.toCourseDto(course));
  }

  async getDaily(
    actor: AuthenticatedUser,
    query: DailyAttendanceQueryDto,
  ): Promise<DailyAttendanceResponseDto> {
    const course = await this.getScopedCourse(
      actor,
      query.courseId,
      query.academicPeriodId,
    );
    this.assertDateWithinPeriod(
      query.date,
      await this.findPeriodDates(query.academicPeriodId),
    );
    const date = this.toCalendarDate(query.date);
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId: course.id,
        academicPeriodId: query.academicPeriodId,
        OR: [
          { status: EnrollmentStatus.ACTIVE, enrollmentDate: { lte: date } },
          { attendanceRecords: { some: { date } } },
        ],
      },
      select: {
        id: true,
        studentId: true,
        student: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        attendanceRecords: {
          where: { date },
          select: { status: true, notes: true },
        },
      },
      orderBy: { student: { user: { lastName: 'asc' } } },
    });
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event: 'DAILY_ATTENDANCE_LOADED',
      message: 'Daily attendance loaded',
      userId: actor.id,
      metadata: {
        courseId: course.id,
        academicPeriodId: query.academicPeriodId,
        date: query.date,
        rosterSize: enrollments.length,
      },
    });
    return {
      course: this.toCourseDto(course),
      date: query.date,
      isReadOnly: this.isReadOnly(course.academicPeriod.status),
      students: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        fullName: `${enrollment.student.user.lastName} ${enrollment.student.user.firstName}`,
        status: enrollment.attendanceRecords[0]?.status ?? null,
        notes: enrollment.attendanceRecords[0]?.notes ?? null,
      })),
    };
  }

  async bulkUpsert(
    actor: AuthenticatedUser,
    dto: BulkUpsertAttendanceDto,
  ): Promise<BulkAttendanceResultDto> {
    const course = await this.getScopedCourse(
      actor,
      dto.courseId,
      dto.academicPeriodId,
    );
    const institutionId = course.institutionId;
    if (!institutionId) throw new NotFoundException('Course not found');
    if (this.isReadOnly(course.academicPeriod.status))
      throw new BadRequestException(
        'Attendance is read-only for a closed academic period',
      );
    const period = await this.findPeriodDates(dto.academicPeriodId);
    this.assertDateWithinPeriod(dto.date, period);
    const date = this.toCalendarDate(dto.date);
    const enrollmentIds = dto.records.map((record) => record.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length)
      throw new BadRequestException(
        'Attendance records must not repeat an enrollment',
      );
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        id: { in: enrollmentIds },
        courseId: course.id,
        academicPeriodId: dto.academicPeriodId,
        status: EnrollmentStatus.ACTIVE,
        enrollmentDate: { lte: date },
      },
      select: { id: true },
    });
    if (enrollments.length !== enrollmentIds.length) {
      this.logger.warn({
        context: ATTENDANCE_CONTEXT,
        event: 'ATTENDANCE_INVALID_ENROLLMENT_SUBMISSION',
        message: 'Attendance submission contains an out-of-scope enrollment',
        userId: actor.id,
        metadata: {
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
        },
      });
      throw new BadRequestException(
        'Every enrollment must be active in the selected course and academic period',
      );
    }
    const existing = await this.prisma.attendanceRecord.findMany({
      where: { enrollmentId: { in: enrollmentIds }, date },
      select: { enrollmentId: true },
    });
    const existingIds = new Set(existing.map((record) => record.enrollmentId));
    await this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        await tx.attendanceRecord.upsert({
          where: {
            enrollmentId_date: { enrollmentId: record.enrollmentId, date },
          },
          create: {
            institutionId,
            academicPeriodId: dto.academicPeriodId,
            courseId: course.id,
            enrollmentId: record.enrollmentId,
            date,
            status: record.status,
            notes: record.notes?.trim() || null,
            recordedByUserId: actor.id,
          },
          update: {
            status: record.status,
            notes: record.notes?.trim() || null,
            recordedByUserId: actor.id,
          },
        });
      }
    });
    const created = dto.records.filter(
      (record) => !existingIds.has(record.enrollmentId),
    ).length;
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event: created ? 'ATTENDANCE_BATCH_CREATED' : 'ATTENDANCE_BATCH_UPDATED',
      message: 'Attendance batch persisted',
      userId: actor.id,
      metadata: {
        courseId: course.id,
        academicPeriodId: dto.academicPeriodId,
        date: dto.date,
        count: dto.records.length,
      },
    });
    return {
      processed: dto.records.length,
      created,
      updated: dto.records.length - created,
    };
  }

  async getScopedCourse(
    actor: AuthenticatedUser,
    courseId: string,
    academicPeriodId: string,
  ): Promise<ScopedCourse> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, academicPeriodId },
      select: {
        id: true,
        name: true,
        section: true,
        institutionId: true,
        gradeLevel: { select: { name: true } },
        academicPeriod: { select: { status: true } },
      },
    });
    if (!course || !course.institutionId)
      throw new NotFoundException('Course not found');
    if (actor.role === Role.ADMIN)
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        course.institutionId,
      );
    if (actor.role === Role.TEACHER) {
      const assignment =
        actor.profileId &&
        (await this.prisma.teacherAssignment.findFirst({
          where: { teacherId: actor.profileId, courseId, academicPeriodId },
          select: { id: true },
        }));
      if (!assignment) throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async accessibleInstitutionIds(
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const memberships = await this.prisma.institutionMembership.findMany({
      where: { userId: actor.id, isActive: true, role: 'ADMIN' },
      select: { institutionId: true },
    });
    return [
      ...new Set(
        [
          actor.institutionId,
          ...memberships.map((membership) => membership.institutionId),
        ].filter((id): id is string => Boolean(id)),
      ),
    ];
  }
  private async findPeriodDates(
    academicPeriodId: string,
  ): Promise<{ startDate: Date; endDate: Date }> {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { startDate: true, endDate: true },
    });
    if (!period) throw new NotFoundException('Academic period not found');
    return period;
  }
  private assertDateWithinPeriod(
    date: string,
    period: { startDate: Date; endDate: Date },
  ): void {
    const start = period.startDate.toISOString().slice(0, 10);
    const end = period.endDate.toISOString().slice(0, 10);
    if (date < start || date > end)
      throw new BadRequestException(
        'Attendance date must be within the academic period',
      );
  }
  private toCalendarDate(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }
  private isReadOnly(status: AcademicPeriodStatus): boolean {
    return (
      status === AcademicPeriodStatus.CLOSED ||
      status === AcademicPeriodStatus.ARCHIVED
    );
  }
  private toCourseDto(course: AttendanceCourse): AttendanceCourseDto {
    return {
      id: course.id,
      name: course.name,
      section: course.section,
      gradeLevelName: course.gradeLevel.name,
    };
  }
}
