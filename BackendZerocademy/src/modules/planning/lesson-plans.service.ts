/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicPlanStatus,
  LessonPlan,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  CreateLessonPlanDto,
  UpdateLessonPlanDto,
} from './dto/lesson-plan.dto';

type LessonTextFields = Pick<
  Prisma.LessonPlanUncheckedCreateInput,
  | 'objectives'
  | 'introduction'
  | 'development'
  | 'closure'
  | 'resources'
  | 'evaluationStrategy'
  | 'notes'
>;
type UnitContext = Awaited<ReturnType<LessonPlansService['findUnitOrThrow']>>;
type AggregateLessonPlan = LessonPlan & {
  academicUnit: { title: string };
};

@Injectable()
export class LessonPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async list(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
  ): Promise<LessonPlan[]> {
    await this.findUnitOrThrow(actor, planId, unitId);
    return this.prisma.lessonPlan.findMany({
      where: { academicUnitId: unitId },
      orderBy: { position: 'asc' },
    });
  }

  async listForAcademicPlan(
    actor: AuthenticatedUser,
    planId: string,
  ): Promise<AggregateLessonPlan[]> {
    await this.findPlanForReadOrThrow(actor, planId);

    return this.prisma.lessonPlan.findMany({
      where: { academicUnit: { academicPlanId: planId } },
      include: { academicUnit: { select: { title: true } } },
      orderBy: [
        { academicUnit: { position: 'asc' } },
        { position: 'asc' },
      ],
    });
  }

  async one(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    lessonPlanId: string,
  ): Promise<LessonPlan> {
    await this.findUnitOrThrow(actor, planId, unitId);
    const lesson = await this.prisma.lessonPlan.findFirst({
      where: { id: lessonPlanId, academicUnitId: unitId },
    });
    if (!lesson) throw new NotFoundException('Lesson plan not found');
    return lesson;
  }

  async create(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    dto: CreateLessonPlanDto,
  ): Promise<LessonPlan> {
    const unit = await this.findUnitOrThrow(actor, planId, unitId, true);
    const lessonDate = this.validateLessonDate(unit, dto.lessonDate);
    const lesson = await this.prisma.$transaction(async (tx) => {
      const last = await tx.lessonPlan.aggregate({
        where: { academicUnitId: unitId },
        _max: { position: true },
      });
      return tx.lessonPlan.create({
        data: {
          academicUnitId: unitId,
          title: dto.title.trim(),
          lessonDate,
          durationMinutes: dto.durationMinutes,
          position: (last._max.position ?? 0) + 1,
          ...this.textFields(dto),
        },
      });
    });
    this.log('LESSON_PLAN_CREATED', actor.id, unitId, lesson.id);
    return lesson;
  }

  async reorder(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    lessonPlanIds: string[],
  ): Promise<void> {
    await this.findUnitOrThrow(actor, planId, unitId, true);
    if (new Set(lessonPlanIds).size !== lessonPlanIds.length) {
      throw new BadRequestException('Lesson plan ids must not repeat');
    }
    await this.prisma.$transaction(async (tx) => {
      const lessons = await tx.lessonPlan.findMany({
        where: { academicUnitId: unitId },
        select: { id: true },
      });
      if (
        lessons.length !== lessonPlanIds.length ||
        lessons.some((lesson) => !lessonPlanIds.includes(lesson.id))
      ) {
        throw new BadRequestException(
          'Lesson plan ids must exactly match the academic unit lessons',
        );
      }
      for (const [index, id] of lessonPlanIds.entries()) {
        await tx.lessonPlan.update({
          where: { id },
          data: { position: 10000 + index },
        });
      }
      for (const [index, id] of lessonPlanIds.entries()) {
        await tx.lessonPlan.update({
          where: { id },
          data: { position: index + 1 },
        });
      }
    });
    this.logger.log({
      context: 'LessonPlansService',
      event: 'LESSON_PLANS_REORDERED',
      message: 'Lesson plans reordered',
      userId: actor.id,
      metadata: { academicUnitId: unitId, count: lessonPlanIds.length },
    });
  }

  async update(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    lessonPlanId: string,
    dto: UpdateLessonPlanDto,
  ): Promise<LessonPlan> {
    const unit = await this.findUnitOrThrow(actor, planId, unitId, true);
    const existing = await this.findNestedLessonOrThrow(unitId, lessonPlanId);
    const lesson = await this.prisma.lessonPlan.update({
      where: { id: lessonPlanId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.lessonDate !== undefined
          ? { lessonDate: this.validateLessonDate(unit, dto.lessonDate) }
          : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: dto.durationMinutes }
          : {}),
        ...this.textFields(dto),
      },
    });
    this.log('LESSON_PLAN_UPDATED', actor.id, unitId, existing.id);
    return lesson;
  }

  async remove(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    lessonPlanId: string,
  ): Promise<void> {
    await this.findUnitOrThrow(actor, planId, unitId, true);
    await this.findNestedLessonOrThrow(unitId, lessonPlanId);
    await this.prisma.$transaction(async (tx) => {
      await tx.lessonPlan.delete({ where: { id: lessonPlanId } });
      const lessons = await tx.lessonPlan.findMany({
        where: { academicUnitId: unitId },
        orderBy: { position: 'asc' },
      });
      for (const [index, lesson] of lessons.entries()) {
        await tx.lessonPlan.update({
          where: { id: lesson.id },
          data: { position: 10000 + index },
        });
      }
      for (const [index, lesson] of lessons.entries()) {
        await tx.lessonPlan.update({
          where: { id: lesson.id },
          data: { position: index + 1 },
        });
      }
    });
    this.log('LESSON_PLAN_DELETED', actor.id, unitId, lessonPlanId);
  }

  private async findUnitOrThrow(
    actor: AuthenticatedUser,
    planId: string,
    unitId: string,
    write = false,
  ) {
    const unit = await this.prisma.academicUnit.findFirst({
      where: { id: unitId, academicPlanId: planId },
      include: {
        academicPlan: {
          include: { teacherAssignment: { include: { academicPeriod: true } } },
        },
      },
    });
    if (!unit) throw new NotFoundException('Academic unit not found');

    const assignment = unit.academicPlan.teacherAssignment;
    const teacherOwnsPlan =
      actor.role === Role.TEACHER && actor.profileId === assignment.teacherId;
    if (teacherOwnsPlan) {
      // Ownership is verified above.
    } else if (actor.role === Role.ADMIN && assignment.institutionId) {
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        assignment.institutionId,
      );
    } else if (actor.role !== Role.SUPER_ADMIN) {
      throw new NotFoundException('Academic unit not found');
    }

    if (write) {
      if (!teacherOwnsPlan)
        throw new NotFoundException('Academic unit not found');
      if (
        unit.academicPlan.status !== AcademicPlanStatus.DRAFT ||
        assignment.academicPeriod.status === AcademicPeriodStatus.CLOSED
      ) {
        throw new BadRequestException('Academic plan lessons are read-only');
      }
    }
    return unit;
  }

  private async findPlanForReadOrThrow(
    actor: AuthenticatedUser,
    planId: string,
  ) {
    const plan = await this.prisma.academicPlan.findUnique({
      where: { id: planId },
      select: {
        teacherAssignment: {
          select: { teacherId: true, institutionId: true },
        },
      },
    });
    if (!plan) throw new NotFoundException('Academic plan not found');

    const assignment = plan.teacherAssignment;
    if (actor.role === Role.TEACHER && actor.profileId === assignment.teacherId)
      return;
    if (actor.role === Role.ADMIN && assignment.institutionId) {
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        assignment.institutionId,
      );
      return;
    }
    if (actor.role !== Role.SUPER_ADMIN)
      throw new NotFoundException('Academic plan not found');
  }

  private async findNestedLessonOrThrow(unitId: string, lessonPlanId: string) {
    const lesson = await this.prisma.lessonPlan.findFirst({
      where: { id: lessonPlanId, academicUnitId: unitId },
    });
    if (!lesson) throw new NotFoundException('Lesson plan not found');
    return lesson;
  }

  private validateLessonDate(unit: UnitContext, value: string): Date {
    const lessonDate = new Date(`${value}T00:00:00.000Z`);
    if (
      (unit.startDate && lessonDate < unit.startDate) ||
      (unit.endDate && lessonDate > unit.endDate)
    ) {
      throw new BadRequestException(
        'Lesson date must fall within the academic unit date range',
      );
    }
    return lessonDate;
  }

  private textFields(dto: Partial<CreateLessonPlanDto>): LessonTextFields {
    const result: LessonTextFields = {};
    for (const key of [
      'objectives',
      'introduction',
      'development',
      'closure',
      'resources',
      'evaluationStrategy',
      'notes',
    ] as const) {
      if (dto[key] !== undefined) result[key] = dto[key]?.trim() || null;
    }
    return result;
  }

  private log(
    event: string,
    userId: string,
    academicUnitId: string,
    lessonPlanId: string,
  ): void {
    this.logger.log({
      context: 'LessonPlansService',
      event,
      message: event,
      userId,
      metadata: { academicUnitId, lessonPlanId },
    });
  }
}
