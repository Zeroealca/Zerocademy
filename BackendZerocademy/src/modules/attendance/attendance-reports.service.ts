/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceJustificationStatus,
  AttendanceStatus,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ATTENDANCE_CONTEXT } from './constants';
import type {
  AttendanceReportQueryDto,
  MyAttendanceHistoryQueryDto,
} from './dto/attendance-report-query.dto';
import type {
  AttendanceCountsDto,
  CourseAttendanceReportDto,
  MyAttendanceHistoryResponseDto,
} from './dto/attendance-report-response.dto';
import { AttendanceService } from './attendance.service';

type StatusCount = { status: AttendanceStatus; _count: { _all: number } };

@Injectable()
export class AttendanceReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
    private readonly logger: AppLoggerService,
  ) {}

  async getMyHistory(
    actor: AuthenticatedUser,
    query: MyAttendanceHistoryQueryDto,
  ): Promise<MyAttendanceHistoryResponseDto> {
    if (actor.role !== Role.STUDENT || !actor.profileId)
      throw new NotFoundException('Attendance history not found');
    this.assertRange(query.startDate, query.endDate);
    const date = query.startDate
      ? {
          gte: this.date(query.startDate),
          ...(query.endDate ? { lte: this.date(query.endDate) } : {}),
        }
      : undefined;
    const scope = {
      enrollment: {
        studentId: actor.profileId,
        academicPeriodId: query.academicPeriodId,
      },
      ...(date ? { date } : {}),
    };
    const records = await this.prisma.attendanceRecord.findMany({
      where: { ...scope, ...(query.status ? { status: query.status } : {}) },
      select: {
        id: true,
        date: true,
        status: true,
        notes: true,
        course: { select: { name: true, section: true } },
        justifications: {
          where: { status: AttendanceJustificationStatus.PENDING },
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { date: 'desc' },
    });
    const allCounts = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: scope,
      _count: { _all: true },
    });
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event: 'ATTENDANCE_HISTORY_QUERIED',
      message: 'Student attendance history queried',
      userId: actor.id,
      metadata: {
        academicPeriodId: query.academicPeriodId,
        recordCount: records.length,
      },
    });
    return {
      summary: this.counts(allCounts),
      records: records.map((record) => ({
        id: record.id,
        date: record.date.toISOString().slice(0, 10),
        status: record.status,
        notes: record.notes,
        courseName: `${record.course.name} ${record.course.section}`,
        pendingJustification: record.justifications[0] ?? null,
      })),
    };
  }

  async getCourseReport(
    actor: AuthenticatedUser,
    query: AttendanceReportQueryDto,
  ): Promise<CourseAttendanceReportDto> {
    this.assertRange(query.startDate, query.endDate);
    const course = await this.attendanceService.getScopedCourse(
      actor,
      query.courseId,
      query.academicPeriodId,
    );
    const date = {
      gte: this.date(query.startDate),
      lte: this.date(query.endDate),
    };
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId: query.courseId,
        academicPeriodId: query.academicPeriodId,
        OR: [{ status: 'ACTIVE' }, { attendanceRecords: { some: { date } } }],
      },
      select: {
        id: true,
        student: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { student: { user: { lastName: 'asc' } } },
    });
    const grouped = await this.prisma.attendanceRecord.groupBy({
      by: ['enrollmentId', 'status'],
      where: {
        courseId: query.courseId,
        academicPeriodId: query.academicPeriodId,
        date,
      },
      _count: { _all: true },
    });
    const byEnrollment = new Map<string, StatusCount[]>();
    for (const item of grouped)
      byEnrollment.set(item.enrollmentId, [
        ...(byEnrollment.get(item.enrollmentId) ?? []),
        item,
      ]);
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: query.academicPeriodId },
      select: { name: true },
    });
    if (!period) throw new NotFoundException('Academic period not found');
    const report: CourseAttendanceReportDto = {
      course: {
        id: course.id,
        name: course.name,
        section: course.section,
        gradeLevelName: course.gradeLevel.name,
      },
      academicPeriodName: period.name,
      startDate: query.startDate,
      endDate: query.endDate,
      students: enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        fullName: `${enrollment.student.user.lastName} ${enrollment.student.user.firstName}`,
        ...this.counts(byEnrollment.get(enrollment.id) ?? []),
      })),
    };
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event: 'COURSE_ATTENDANCE_REPORT_GENERATED',
      message: 'Course attendance report generated',
      userId: actor.id,
      metadata: {
        courseId: query.courseId,
        academicPeriodId: query.academicPeriodId,
        studentCount: report.students.length,
      },
    });
    return report;
  }
  private counts(items: StatusCount[]): AttendanceCountsDto {
    const value = (status: AttendanceStatus) =>
      items.find((item) => item.status === status)?._count._all ?? 0;
    const present = value(AttendanceStatus.PRESENT);
    const late = value(AttendanceStatus.LATE);
    const absent = value(AttendanceStatus.ABSENT);
    const excused = value(AttendanceStatus.EXCUSED);
    const recordedDays = present + late + absent + excused;
    return {
      recordedDays,
      present,
      absent,
      late,
      excused,
      attendancePercentage: recordedDays
        ? Number((((present + late) / recordedDays) * 100).toFixed(2))
        : null,
    };
  }
  private assertRange(startDate?: string, endDate?: string): void {
    if (startDate && endDate && startDate > endDate)
      throw new BadRequestException('Start date must not be after end date');
  }
  private date(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }
}
