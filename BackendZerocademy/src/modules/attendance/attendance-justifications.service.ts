/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AttendanceJustificationStatus,
  AttendanceStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  assertActorCanAccessInstitution,
  resolveActorInstitutionIds,
} from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ATTENDANCE_CONTEXT } from './constants';
import type {
  CreateAttendanceJustificationDto,
  ReviewAttendanceJustificationDto,
} from './dto/attendance-justification.dto';
import { JustificationReviewDecision } from './dto/attendance-justification.dto';

@Injectable()
export class AttendanceJustificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}
  async create(
    actor: AuthenticatedUser,
    attendanceRecordId: string,
    dto: CreateAttendanceJustificationDto,
  ) {
    if (actor.role !== Role.STUDENT && actor.role !== Role.REPRESENTATIVE)
      throw new NotFoundException('Attendance record not found');
    const studentScope =
      actor.role === Role.STUDENT
        ? actor.profileId
          ? { enrollment: { studentId: actor.profileId } }
          : null
        : {
            enrollment: {
              student: {
                representativeStudentRelations: {
                  some: { representativeUserId: actor.id, isActive: true },
                },
              },
            },
          };
    if (!studentScope)
      throw new NotFoundException('Attendance record not found');
    const attendance = await this.prisma.attendanceRecord.findFirst({
      where: {
        id: attendanceRecordId,
        status: AttendanceStatus.ABSENT,
        ...studentScope,
      },
      select: {
        id: true,
        institutionId: true,
        academicPeriod: { select: { status: true } },
        enrollment: {
          select: { student: { select: { institutionId: true } } },
        },
      },
    });
    if (!attendance)
      throw new NotFoundException('Eligible attendance record not found');
    if (
      actor.role === Role.REPRESENTATIVE &&
      attendance.enrollment.student.institutionId !== attendance.institutionId
    )
      throw new NotFoundException('Eligible attendance record not found');
    if (
      attendance.academicPeriod.status === AcademicPeriodStatus.CLOSED ||
      attendance.academicPeriod.status === AcademicPeriodStatus.ARCHIVED
    )
      throw new BadRequestException(
        'Justification submission is closed for this academic period',
      );
    const pending = await this.prisma.attendanceJustification.findFirst({
      where: {
        attendanceRecordId,
        status: AttendanceJustificationStatus.PENDING,
      },
      select: { id: true },
    });
    if (pending)
      throw new ConflictException('A pending justification already exists');
    let result: {
      id: string;
      status: AttendanceJustificationStatus;
      createdAt: Date;
    };
    try {
      result = await this.prisma.attendanceJustification.create({
        data: {
          attendanceRecordId,
          reason: dto.reason.trim(),
          submittedByUserId: actor.id,
        },
        select: { id: true, status: true, createdAt: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A pending justification already exists');
      }
      throw error;
    }
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event:
        actor.role === Role.REPRESENTATIVE
          ? 'REPRESENTATIVE_JUSTIFICATION_SUBMITTED'
          : 'JUSTIFICATION_SUBMITTED',
      message: 'Attendance justification submitted',
      userId: actor.id,
      metadata: {
        attendanceRecordId,
        justificationId: result.id,
        submitterRole: actor.role,
      },
    });
    return result;
  }
  async review(
    actor: AuthenticatedUser,
    justificationId: string,
    dto: ReviewAttendanceJustificationDto,
  ) {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Justification not found');
    if (
      dto.decision === JustificationReviewDecision.REJECT &&
      !dto.comment?.trim()
    )
      throw new BadRequestException(
        'A review comment is required when rejecting a justification',
      );
    const justification = await this.prisma.attendanceJustification.findUnique({
      where: { id: justificationId },
      include: {
        attendanceRecord: { select: { institutionId: true, status: true } },
      },
    });
    if (
      !justification ||
      justification.status !== AttendanceJustificationStatus.PENDING
    )
      throw new ConflictException('Justification is no longer pending');
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      justification.attendanceRecord.institutionId,
    );
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.attendanceJustification.updateMany({
        where: {
          id: justificationId,
          status: AttendanceJustificationStatus.PENDING,
        },
        data: {
          status:
            dto.decision === JustificationReviewDecision.APPROVE
              ? AttendanceJustificationStatus.APPROVED
              : AttendanceJustificationStatus.REJECTED,
          reviewedByUserId: actor.id,
          reviewedAt: new Date(),
          reviewComment: dto.comment?.trim() || null,
        },
      });
      if (updated.count !== 1)
        throw new ConflictException('Justification was already reviewed');
      if (dto.decision === JustificationReviewDecision.APPROVE) {
        const attendanceUpdated = await tx.attendanceRecord.updateMany({
          where: {
            id: justification.attendanceRecordId,
            status: AttendanceStatus.ABSENT,
          },
          data: { status: AttendanceStatus.EXCUSED },
        });
        if (attendanceUpdated.count !== 1)
          throw new ConflictException('Attendance record is no longer absent');
      }
    });
    this.logger.log({
      context: ATTENDANCE_CONTEXT,
      event:
        dto.decision === JustificationReviewDecision.APPROVE
          ? 'JUSTIFICATION_APPROVED'
          : 'JUSTIFICATION_REJECTED',
      message: 'Attendance justification reviewed',
      userId: actor.id,
      metadata: { justificationId },
    });
    return {
      id: justificationId,
      status:
        dto.decision === JustificationReviewDecision.APPROVE
          ? AttendanceJustificationStatus.APPROVED
          : AttendanceJustificationStatus.REJECTED,
    };
  }

  async listForReview(
    actor: AuthenticatedUser,
    status: AttendanceJustificationStatus = AttendanceJustificationStatus.PENDING,
  ) {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Justifications not found');
    const institutionIds = await resolveActorInstitutionIds(this.prisma, actor);
    if (!institutionIds.length) return [];
    return this.prisma.attendanceJustification.findMany({
      where: {
        status,
        attendanceRecord: { institutionId: { in: institutionIds } },
      },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reviewComment: true,
        submittedByUser: {
          select: { firstName: true, lastName: true, role: true },
        },
        attendanceRecord: {
          select: {
            id: true,
            date: true,
            course: { select: { name: true, section: true } },
            enrollment: {
              select: {
                student: {
                  select: {
                    user: { select: { firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
