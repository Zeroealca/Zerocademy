/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  ClassSessionStatus,
  EnrollmentStatus,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ATTENDANCE_CONTEXT } from './constants';
import type {
  ClassSessionAttendanceRosterDto,
  ReplaceClassSessionAttendanceDto,
} from './dto/class-session-attendance.dto';

type SessionContext = {
  id: string;
  status: ClassSessionStatus;
  scheduledDate: Date | null;
  occurredOn: Date | null;
  teacherAssignment: {
    id: string;
    teacherId: string;
    courseId: string;
    academicPeriodId: string;
    institutionId: string | null;
    academicPeriod: { status: AcademicPeriodStatus };
  };
};

@Injectable()
export class ClassSessionAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly permissionEnforcer: MembershipPermissionEnforcer,
  ) {}

  async getRoster(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    classSessionId: string,
  ): Promise<ClassSessionAttendanceRosterDto> {
    const session = await this.findContext(
      actor,
      teacherAssignmentId,
      classSessionId,
    );
    await this.requirePermission(actor, session, PERMISSIONS.ATTENDANCE.READ);
    const records = await this.roster(session);
    return {
      classSession: this.sessionDto(session),
      isReadOnly: this.isReadOnly(session),
      records,
    };
  }

  async replace(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    classSessionId: string,
    dto: ReplaceClassSessionAttendanceDto,
  ): Promise<void> {
    const session = await this.findContext(
      actor,
      teacherAssignmentId,
      classSessionId,
    );
    await this.requirePermission(actor, session, PERMISSIONS.ATTENDANCE.WRITE);
    this.assertWritable(session);
    const enrollmentIds = dto.records.map((record) => record.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length)
      throw new BadRequestException(
        'Attendance records must not repeat an enrollment',
      );
    const expected = await this.expectedEnrollmentIds(session);
    if (
      expected.length !== enrollmentIds.length ||
      expected.some((enrollment) => !enrollmentIds.includes(enrollment.id))
    )
      throw new BadRequestException(
        'Attendance records must exactly match the eligible class session roster',
      );
    const existing = await this.prisma.classSessionAttendanceRecord.count({
      where: { classSessionId: session.id },
    });
    await this.prisma.$transaction(async (tx) => {
      await tx.classSessionAttendanceRecord.deleteMany({
        where: { classSessionId: session.id },
      });
      await tx.classSessionAttendanceRecord.createMany({
        data: dto.records.map((record) => ({
          classSessionId: session.id,
          enrollmentId: record.enrollmentId,
          status: record.status,
          note: record.note?.trim() || null,
          recordedByUserId: actor.id,
        })),
      });
    });
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event: existing
        ? 'CLASS_SESSION_ATTENDANCE_UPDATED'
        : 'CLASS_SESSION_ATTENDANCE_RECORDED',
      message: 'Class session attendance persisted',
      userId: actor.id,
      metadata: {
        classSessionId: session.id,
        teacherAssignmentId: session.teacherAssignment.id,
        count: dto.records.length,
      },
    });
  }

  private async findContext(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    classSessionId: string,
  ): Promise<SessionContext> {
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, teacherAssignmentId },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        occurredOn: true,
        teacherAssignment: {
          select: {
            id: true,
            teacherId: true,
            courseId: true,
            academicPeriodId: true,
            institutionId: true,
            academicPeriod: { select: { status: true } },
          },
        },
      },
    });
    if (
      !session ||
      actor.role !== Role.TEACHER ||
      actor.profileId !== session.teacherAssignment.teacherId
    )
      throw new NotFoundException('Class session attendance not found');
    return session;
  }

  private async requirePermission(
    actor: AuthenticatedUser,
    session: SessionContext,
    permission:
      | typeof PERMISSIONS.ATTENDANCE.READ
      | typeof PERMISSIONS.ATTENDANCE.WRITE,
  ): Promise<void> {
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId: session.teacherAssignment.institutionId,
      permission,
      domain: 'attendance',
      resourceType: 'classSession',
      resourceId: session.id,
    });
  }

  private async roster(session: SessionContext) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: this.expectedEnrollmentWhere(session),
      select: {
        id: true,
        studentId: true,
        student: {
          select: { user: { select: { firstName: true, lastName: true } } },
        },
        classSessionAttendanceRecords: {
          where: { classSessionId: session.id },
          select: { status: true, note: true },
        },
      },
      orderBy: { student: { user: { lastName: 'asc' } } },
    });
    return enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      firstName: enrollment.student.user.firstName,
      lastName: enrollment.student.user.lastName,
      status: enrollment.classSessionAttendanceRecords[0]?.status ?? null,
      note: enrollment.classSessionAttendanceRecords[0]?.note ?? null,
    }));
  }

  private expectedEnrollmentIds(session: SessionContext) {
    return this.prisma.enrollment.findMany({
      where: this.expectedEnrollmentWhere(session),
      select: { id: true },
    });
  }

  private expectedEnrollmentWhere(session: SessionContext) {
    return {
      courseId: session.teacherAssignment.courseId,
      academicPeriodId: session.teacherAssignment.academicPeriodId,
      status: EnrollmentStatus.ACTIVE,
      enrollmentDate: {
        lte: session.occurredOn ?? session.scheduledDate ?? new Date(0),
      },
    };
  }

  private assertWritable(session: SessionContext): void {
    if (session.status !== ClassSessionStatus.COMPLETED)
      throw new BadRequestException(
        'Attendance requires a completed class session',
      );
    if (
      session.teacherAssignment.academicPeriod.status ===
        AcademicPeriodStatus.CLOSED ||
      session.teacherAssignment.academicPeriod.status ===
        AcademicPeriodStatus.ARCHIVED
    )
      throw new BadRequestException(
        'Attendance is read-only for this academic period',
      );
  }

  private isReadOnly(session: SessionContext): boolean {
    return (
      session.status !== ClassSessionStatus.COMPLETED ||
      session.teacherAssignment.academicPeriod.status ===
        AcademicPeriodStatus.CLOSED ||
      session.teacherAssignment.academicPeriod.status ===
        AcademicPeriodStatus.ARCHIVED
    );
  }

  private sessionDto(session: SessionContext) {
    return {
      id: session.id,
      status: session.status,
      scheduledDate: session.scheduledDate?.toISOString().slice(0, 10) ?? null,
      occurredOn: session.occurredOn?.toISOString().slice(0, 10) ?? null,
    };
  }
}
