/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  ClassSession,
  ClassSessionStatus,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

export type CreateClassSessionFoundationInput = {
  teacherAssignmentId: string;
  lessonPlanId?: string | null;
  status?: ClassSessionStatus;
  scheduledDate?: string;
  occurredOn?: string;
};

type AssignmentExecutionContext = {
  id: string;
  teacherId: string;
  institutionId: string | null;
  academicPeriod: {
    status: AcademicPeriodStatus;
    startDate: Date;
    endDate: Date;
  };
};

/**
 * Phase 2C.1 internal foundation. Route-level behavior is intentionally
 * deferred to Phase 2C.2; this service centralizes persistence invariants
 * that must not depend on a future controller or frontend.
 */
@Injectable()
export class ClassSessionsFoundationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    input: CreateClassSessionFoundationInput,
  ): Promise<ClassSession> {
    const assignment = await this.findAssignment(
      actor,
      input.teacherAssignmentId,
      true,
    );
    return this.persistCreate(actor, assignment, input);
  }

  async list(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
  ): Promise<ClassSession[]> {
    await this.findAssignment(actor, teacherAssignmentId);
    return this.prisma.classSession.findMany({
      where: { teacherAssignmentId },
      orderBy: [
        { scheduledDate: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ],
    });
  }

  async one(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    classSessionId: string,
  ): Promise<ClassSession> {
    await this.findAssignment(actor, teacherAssignmentId);
    const session = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, teacherAssignmentId },
    });
    if (!session) throw new NotFoundException('Class session not found');
    return session;
  }

  async update(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    classSessionId: string,
    input: Partial<
      Omit<CreateClassSessionFoundationInput, 'teacherAssignmentId'>
    >,
  ): Promise<ClassSession> {
    const assignment = await this.findAssignment(
      actor,
      teacherAssignmentId,
      true,
    );
    const existing = await this.prisma.classSession.findFirst({
      where: { id: classSessionId, teacherAssignmentId },
    });
    if (!existing) throw new NotFoundException('Class session not found');
    const status = input.status ?? existing.status;
    const scheduledDate =
      input.scheduledDate === undefined
        ? existing.scheduledDate
        : this.calendarDate(input.scheduledDate, 'scheduledDate');
    const occurredOn =
      input.occurredOn === undefined
        ? existing.occurredOn
        : this.calendarDate(input.occurredOn, 'occurredOn');
    const lessonPlanId =
      input.lessonPlanId === undefined
        ? existing.lessonPlanId
        : input.lessonPlanId;
    this.assertStatusDateRequirements(status, scheduledDate, occurredOn);
    this.assertDatesWithinPeriod(
      assignment.academicPeriod,
      scheduledDate,
      occurredOn,
    );
    if (lessonPlanId)
      await this.assertCompatibleLessonPlan(lessonPlanId, assignment.id);
    const session = await this.prisma.classSession.update({
      where: { id: classSessionId },
      data: { status, scheduledDate, occurredOn, lessonPlanId },
    });
    this.log('CLASS_SESSION_UPDATED', actor.id, session);
    return session;
  }

  private async persistCreate(
    actor: AuthenticatedUser,
    assignment: AssignmentExecutionContext,
    input: CreateClassSessionFoundationInput,
  ): Promise<ClassSession> {
    const status = input.status ?? ClassSessionStatus.SCHEDULED;
    const scheduledDate = this.calendarDate(
      input.scheduledDate,
      'scheduledDate',
    );
    const occurredOn = this.calendarDate(input.occurredOn, 'occurredOn');

    this.assertStatusDateRequirements(status, scheduledDate, occurredOn);
    this.assertDatesWithinPeriod(
      assignment.academicPeriod,
      scheduledDate,
      occurredOn,
    );

    if (input.lessonPlanId) {
      await this.assertCompatibleLessonPlan(input.lessonPlanId, assignment.id);
    }

    const session = await this.prisma.classSession.create({
      data: {
        teacherAssignmentId: assignment.id,
        lessonPlanId: input.lessonPlanId,
        status,
        scheduledDate,
        occurredOn,
      },
    });

    this.log('CLASS_SESSION_CREATED', actor.id, session);
    return session;
  }

  private async findAssignment(
    actor: AuthenticatedUser,
    teacherAssignmentId: string,
    write = false,
  ): Promise<AssignmentExecutionContext> {
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id: teacherAssignmentId },
      select: {
        id: true,
        teacherId: true,
        institutionId: true,
        academicPeriod: {
          select: { status: true, startDate: true, endDate: true },
        },
      },
    });
    if (!assignment)
      throw new NotFoundException('Teacher assignment not found');
    const teacherOwns =
      actor.role === Role.TEACHER && actor.profileId === assignment.teacherId;
    if (teacherOwns) {
      // Authorized.
    } else if (actor.role === Role.ADMIN && assignment.institutionId) {
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        assignment.institutionId,
      );
    } else if (actor.role !== Role.SUPER_ADMIN)
      throw new NotFoundException('Teacher assignment not found');
    if (write && !teacherOwns)
      throw new NotFoundException('Teacher assignment not found');
    if (
      write &&
      (assignment.academicPeriod.status === AcademicPeriodStatus.CLOSED ||
        assignment.academicPeriod.status === AcademicPeriodStatus.ARCHIVED)
    ) {
      throw new BadRequestException(
        'Class sessions are read-only for a closed or archived academic period',
      );
    }
    return assignment;
  }

  private async assertCompatibleLessonPlan(
    lessonPlanId: string,
    teacherAssignmentId: string,
  ): Promise<void> {
    const lessonPlan = await this.prisma.lessonPlan.findFirst({
      where: {
        id: lessonPlanId,
        academicUnit: {
          academicPlan: { teacherAssignmentId },
        },
      },
      select: { id: true },
    });
    if (!lessonPlan) {
      throw new BadRequestException(
        'Lesson plan must belong to the class session teacher assignment',
      );
    }
  }

  private assertStatusDateRequirements(
    status: ClassSessionStatus,
    scheduledDate: Date | null,
    occurredOn: Date | null,
  ): void {
    if (
      (status === ClassSessionStatus.SCHEDULED ||
        status === ClassSessionStatus.CANCELLED) &&
      !scheduledDate
    ) {
      throw new BadRequestException(
        'Scheduled and cancelled class sessions require a scheduled calendar date',
      );
    }
    if (status === ClassSessionStatus.COMPLETED && !occurredOn) {
      throw new BadRequestException(
        'Completed class sessions require an actual occurrence calendar date',
      );
    }
  }

  private assertDatesWithinPeriod(
    period: AssignmentExecutionContext['academicPeriod'],
    scheduledDate: Date | null,
    occurredOn: Date | null,
  ): void {
    for (const [name, value] of [
      ['scheduledDate', scheduledDate],
      ['occurredOn', occurredOn],
    ] as const) {
      if (value && (value < period.startDate || value > period.endDate)) {
        throw new BadRequestException(
          `${name} must fall within the teacher assignment academic period`,
        );
      }
    }
  }

  private calendarDate(value: string | undefined, field: string): Date | null {
    if (value === undefined) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${field} must use YYYY-MM-DD`);
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`${field} must be a valid calendar date`);
    }
    return date;
  }

  private log(event: string, userId: string, session: ClassSession): void {
    this.logger.log({
      context: 'ClassSessionsFoundationService',
      event,
      message: event,
      userId,
      metadata: {
        classSessionId: session.id,
        teacherAssignmentId: session.teacherAssignmentId,
        status: session.status,
      },
    });
  }
}
