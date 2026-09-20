/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicPlanStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  assertActorCanAccessInstitution,
  resolveActorInstitutionIds,
} from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PLANNING_CONTEXT } from './constants';
import { AcademicPlanListResponseDto } from './dto/academic-plan-list-response.dto';
import { AcademicPlanResponseDto } from './dto/academic-plan-response.dto';
import { CreateAcademicPlanDto } from './dto/create-academic-plan.dto';
import { ListAcademicPlansQueryDto } from './dto/list-academic-plans-query.dto';
import { UpdateAcademicPlanDto } from './dto/update-academic-plan.dto';
import {
  academicPlanInclude,
  toAcademicPlanResponseDto,
} from './mappers/academic-plan.mapper';

type AssignmentContext = {
  id: string;
  teacherId: string;
  academicPeriodId: string;
  institutionId: string | null;
  academicPeriod: { status: AcademicPeriodStatus };
};
type PlanTextFields = Pick<
  Prisma.AcademicPlanUncheckedCreateInput,
  | 'description'
  | 'objectives'
  | 'contents'
  | 'activities'
  | 'resources'
  | 'evaluationNotes'
  | 'notes'
>;
type PlanDateFields = Pick<
  Prisma.AcademicPlanUncheckedCreateInput,
  'startDate' | 'endDate'
>;

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListAcademicPlansQueryDto,
  ): Promise<AcademicPlanListResponseDto> {
    const where = await this.buildListWhere(actor, query);
    const [total, plans] = await this.prisma.$transaction([
      this.prisma.academicPlan.count({ where }),
      this.prisma.academicPlan.findMany({
        where,
        skip: getPaginationSkip(query.page, query.limit),
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }],
        include: academicPlanInclude,
      }),
    ]);
    return {
      data: plans.map(toAcademicPlanResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<AcademicPlanResponseDto> {
    const plan = await this.findPlanOrThrow(id);
    await this.assertReadAccess(actor, plan);
    return toAcademicPlanResponseDto(plan);
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateAcademicPlanDto,
  ): Promise<AcademicPlanResponseDto> {
    const assignment = await this.getOwnedAssignment(
      actor,
      dto.teacherAssignmentId,
    );
    this.assertPeriodMutable(assignment.academicPeriod.status);
    const range = await this.validateTermAndDates(
      assignment.academicPeriodId,
      dto.academicTermId,
      dto.startDate,
      dto.endDate,
    );
    const plan = await this.prisma.academicPlan.create({
      data: {
        teacherAssignmentId: assignment.id,
        academicTermId: dto.academicTermId,
        title: dto.title.trim(),
        ...this.textFields(dto),
        ...range,
        createdByUserId: actor.id,
        status: AcademicPlanStatus.DRAFT,
      },
      include: academicPlanInclude,
    });
    this.log(
      'ACADEMIC_PLAN_CREATED',
      'Academic plan draft created',
      actor.id,
      plan.id,
      assignment.id,
    );
    return toAcademicPlanResponseDto(plan);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateAcademicPlanDto,
  ): Promise<AcademicPlanResponseDto> {
    const existing = await this.findPlanOrThrow(id);
    this.assertTeacherOwnsPlan(actor, existing);
    this.assertDraft(existing.status);
    this.assertPeriodMutable(existing.teacherAssignment.academicPeriod.status);
    const termId = dto.academicTermId ?? existing.academicTermId;
    const startDate = dto.startDate ?? this.dateOnly(existing.startDate);
    const endDate = dto.endDate ?? this.dateOnly(existing.endDate);
    const range = await this.validateTermAndDates(
      existing.teacherAssignment.academicPeriodId,
      termId,
      startDate,
      endDate,
    );
    const plan = await this.prisma.academicPlan.update({
      where: { id },
      data: {
        ...(dto.academicTermId !== undefined
          ? { academicTermId: dto.academicTermId }
          : {}),
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...this.textFields(dto),
        ...range,
      },
      include: academicPlanInclude,
    });
    this.log(
      'ACADEMIC_PLAN_UPDATED',
      'Academic plan draft updated',
      actor.id,
      plan.id,
      plan.teacherAssignmentId,
    );
    return toAcademicPlanResponseDto(plan);
  }

  async publish(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<AcademicPlanResponseDto> {
    const existing = await this.findPlanOrThrow(id);
    this.assertTeacherOwnsPlan(actor, existing);
    this.assertDraft(existing.status);
    this.assertPeriodMutable(existing.teacherAssignment.academicPeriod.status);
    if (
      !existing.startDate ||
      !existing.endDate ||
      !this.hasText(existing.title) ||
      !this.hasText(existing.objectives) ||
      !this.hasText(existing.contents) ||
      !this.hasText(existing.activities)
    ) {
      throw new BadRequestException(
        'A published plan requires title, dates, objectives, contents, and activities',
      );
    }
    await this.validateTermAndDates(
      existing.teacherAssignment.academicPeriodId,
      existing.academicTermId,
      this.dateOnly(existing.startDate),
      this.dateOnly(existing.endDate),
    );
    const plan = await this.prisma.academicPlan.update({
      where: { id },
      data: {
        status: AcademicPlanStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedByUserId: actor.id,
      },
      include: academicPlanInclude,
    });
    this.log(
      'ACADEMIC_PLAN_PUBLISHED',
      'Academic plan published',
      actor.id,
      plan.id,
      plan.teacherAssignmentId,
    );
    return toAcademicPlanResponseDto(plan);
  }

  async remove(actor: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.findPlanOrThrow(id);
    this.assertTeacherOwnsPlan(actor, existing);
    this.assertDraft(existing.status);
    this.assertPeriodMutable(existing.teacherAssignment.academicPeriod.status);
    await this.prisma.academicPlan.delete({ where: { id } });
    this.log(
      'ACADEMIC_PLAN_DELETED',
      'Academic plan draft deleted',
      actor.id,
      id,
      existing.teacherAssignmentId,
    );
  }

  private async buildListWhere(
    actor: AuthenticatedUser,
    query: ListAcademicPlansQueryDto,
  ): Promise<Prisma.AcademicPlanWhereInput> {
    const assignment: Prisma.TeacherAssignmentWhereInput = {
      ...(query.academicPeriodId
        ? { academicPeriodId: query.academicPeriodId }
        : {}),
      ...(query.teacherAssignmentId ? { id: query.teacherAssignmentId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
    };
    const where: Prisma.AcademicPlanWhereInput = {
      ...(query.academicTermId ? { academicTermId: query.academicTermId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: 'insensitive' } }
        : {}),
      ...(query.startDateFrom || query.startDateTo
        ? {
            startDate: {
              ...(query.startDateFrom
                ? { gte: this.calendarDate(query.startDateFrom) }
                : {}),
              ...(query.startDateTo
                ? { lte: this.calendarDate(query.startDateTo) }
                : {}),
            },
          }
        : {}),
    };
    if (actor.role === Role.TEACHER && actor.profileId)
      assignment.teacherId = actor.profileId;
    else if (actor.role === Role.ADMIN) {
      const institutionIds = await resolveActorInstitutionIds(
        this.prisma,
        actor,
      );
      assignment.institutionId = { in: institutionIds };
    } else if (!RoleUtils.isSuperAdmin(actor.role))
      where.id = '00000000-0000-0000-0000-000000000000';
    return { ...where, teacherAssignment: assignment };
  }

  private async findPlanOrThrow(id: string) {
    const plan = await this.prisma.academicPlan.findUnique({
      where: { id },
      include: academicPlanInclude,
    });
    if (!plan) throw new NotFoundException('Academic plan not found');
    return plan;
  }

  private async assertReadAccess(
    actor: AuthenticatedUser,
    plan: Awaited<ReturnType<PlanningService['findPlanOrThrow']>>,
  ): Promise<void> {
    if (RoleUtils.isSuperAdmin(actor.role)) return;
    if (
      actor.role === Role.TEACHER &&
      actor.profileId === plan.teacherAssignment.teacherId
    )
      return;
    if (actor.role === Role.ADMIN && plan.teacherAssignment.institutionId) {
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        plan.teacherAssignment.institutionId,
      );
      return;
    }
    throw new NotFoundException('Academic plan not found');
  }

  private assertTeacherOwnsPlan(
    actor: AuthenticatedUser,
    plan: Awaited<ReturnType<PlanningService['findPlanOrThrow']>>,
  ): void {
    if (
      actor.role !== Role.TEACHER ||
      !actor.profileId ||
      plan.teacherAssignment.teacherId !== actor.profileId
    )
      throw new NotFoundException('Academic plan not found');
  }

  private async getOwnedAssignment(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<AssignmentContext> {
    if (actor.role !== Role.TEACHER || !actor.profileId)
      throw new NotFoundException('Teacher assignment not found');
    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { id, teacherId: actor.profileId },
      select: {
        id: true,
        teacherId: true,
        academicPeriodId: true,
        institutionId: true,
        academicPeriod: { select: { status: true } },
      },
    });
    if (!assignment)
      throw new NotFoundException('Teacher assignment not found');
    return assignment;
  }

  private async validateTermAndDates(
    periodId: string,
    termId: string,
    startDate?: string | null,
    endDate?: string | null,
  ): Promise<PlanDateFields> {
    const term = await this.prisma.academicTerm.findUnique({
      where: { id: termId },
      select: { academicPeriodId: true, startDate: true, endDate: true },
    });
    if (!term || term.academicPeriodId !== periodId)
      throw new BadRequestException(
        'Academic term does not belong to the teacher assignment academic period',
      );
    if (!startDate && !endDate) return {};
    if (!startDate || !endDate)
      throw new BadRequestException(
        'Plan startDate and endDate must be provided together',
      );
    const start = this.calendarDate(startDate);
    const end = this.calendarDate(endDate);
    if (start > end)
      throw new BadRequestException('startDate must be on or before endDate');
    if (start < term.startDate || end > term.endDate)
      throw new BadRequestException(
        'Plan dates must fall within the selected academic term',
      );
    return { startDate: start, endDate: end };
  }

  private textFields(dto: Partial<CreateAcademicPlanDto>): PlanTextFields {
    const result: PlanTextFields = {};
    for (const key of [
      'description',
      'objectives',
      'contents',
      'activities',
      'resources',
      'evaluationNotes',
      'notes',
    ] as const) {
      if (dto[key] !== undefined) result[key] = dto[key]?.trim() || null;
    }
    return result;
  }
  private assertDraft(status: AcademicPlanStatus): void {
    if (status !== AcademicPlanStatus.DRAFT)
      throw new BadRequestException('Only draft academic plans can be changed');
  }
  private assertPeriodMutable(status: AcademicPeriodStatus): void {
    if (status === AcademicPeriodStatus.CLOSED)
      throw new BadRequestException(
        'Academic plans are read-only for a closed academic period',
      );
  }
  private calendarDate(value: string): Date {
    return new Date(`${value}T00:00:00.000Z`);
  }
  private dateOnly(value: Date | null): string | undefined {
    return value?.toISOString().slice(0, 10);
  }
  private hasText(value: string | null): boolean {
    return Boolean(value?.trim());
  }
  private log(
    event: string,
    message: string,
    actorId: string,
    planId: string,
    assignmentId: string,
  ): void {
    this.logger.log({
      context: PLANNING_CONTEXT,
      event,
      message,
      userId: actorId,
      metadata: { planId, teacherAssignmentId: assignmentId },
    });
  }
}
