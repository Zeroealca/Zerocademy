/* eslint-disable @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  Prisma,
  Role,
  ScheduleBlockKind,
  TimetableStatus,
  Weekday,
} from '@prisma/client';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import type { Permission } from '../../common/rbac/permission-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import { TimetableGenerationService } from './timetable-generation.service';
import {
  TimetableValidationMode,
  type TimetableCandidateSlot,
  type TimetableConflictValidationResult,
} from './timetable-conflict.types';
import type { TimetableGenerationResult } from './timetable-generation.types';
import type {
  CreateTimetableDto,
  GenerateTimetableDto,
  ReplaceTimetableSlotsDto,
  TransitionTimetableDto,
  TimetableListResponseDto,
  TimetableResponseDto,
  TimetableSlotInputDto,
} from './dto/timetable-admin.dto';

const timetableInclude = Prisma.validator<Prisma.TimetableInclude>()({
  slots: {
    include: {
      scheduleBlock: true,
      teacherAssignment: {
        include: {
          course: true,
          subject: true,
          teacher: { include: { user: true } },
        },
      },
    },
  },
});
type TimetableDetail = Prisma.TimetableGetPayload<{
  include: typeof timetableInclude;
}>;
type DbClient = PrismaService | Prisma.TransactionClient;
type SchedulingContext = {
  structure: {
    id: string;
    enabledWeekdays: Weekday[];
    scheduleBlocks: Array<{
      id: string;
      periodScheduleStructureId: string;
      position: number;
      kind: ScheduleBlockKind;
      startTime: Date;
      endTime: Date;
    }>;
  };
  assignments: Array<{
    id: string;
    institutionId: string | null;
    academicPeriodId: string;
    teacherId: string;
    courseId: string;
    teachingLoad: { weeklyPeriods: number } | null;
  }>;
};

type TimetableGenerationProposal = Omit<TimetableGenerationResult, 'slots'> & {
  slots: TimetableSlotInputDto[];
};

@Injectable()
export class TimetableAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: MembershipPermissionEnforcer,
    private readonly generator: TimetableGenerationService,
    private readonly conflicts: TimetableConflictEngine,
  ) {}

  async list(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<TimetableListResponseDto> {
    await this.authorize(
      actor,
      institutionId,
      academicPeriodId,
      PERMISSIONS.TIMETABLES.READ,
    );
    const rows = await this.prisma.timetable.findMany({
      where: { institutionId, academicPeriodId },
      include: timetableInclude,
      orderBy: { createdAt: 'asc' },
    });
    return { data: rows.map((row) => this.toResponse(row)) };
  }

  async findOne(
    actor: AuthenticatedUser,
    timetableId: string,
  ): Promise<TimetableResponseDto> {
    const timetable = await this.find(timetableId);
    await this.authorize(
      actor,
      timetable.institutionId,
      timetable.academicPeriodId,
      PERMISSIONS.TIMETABLES.READ,
    );
    return this.toResponse(timetable);
  }

  async generate(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: GenerateTimetableDto,
  ): Promise<TimetableGenerationProposal> {
    await this.authorize(
      actor,
      institutionId,
      academicPeriodId,
      PERMISSIONS.TIMETABLES.GENERATE,
    );
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    const context = await this.loadContext(
      this.prisma,
      institutionId,
      academicPeriodId,
    );
    this.assertReady(context);
    const result = this.generator.generate({
      context: {
        institutionId,
        academicPeriodId,
        periodScheduleStructureId: context.structure.id,
        enabledWeekdays: context.structure.enabledWeekdays,
      },
      assignments: context.assignments.map((assignment) => ({
        id: assignment.id,
        institutionId: assignment.institutionId,
        academicPeriodId: assignment.academicPeriodId,
        teacherId: assignment.teacherId,
        courseId: assignment.courseId,
      })),
      scheduleBlocks: context.structure.scheduleBlocks.map((block) => ({
        ...block,
        startTime: this.time(block.startTime),
        endTime: this.time(block.endTime),
      })),
      teachingLoads: context.assignments.map((assignment) => ({
        teacherAssignmentId: assignment.id,
        weeklyPeriods: assignment.teachingLoad?.weeklyPeriods ?? 0,
      })),
      options: dto.maxSearchNodes
        ? { maxSearchNodes: dto.maxSearchNodes }
        : undefined,
    });
    return {
      ...result,
      // Generation candidates carry an internal id for deterministic search and
      // conflict diagnostics. The public proposal must be directly reusable by
      // the create/replace DTO, whose payload intentionally has no slot id.
      slots: result.slots.map(
        ({ teacherAssignmentId, weekday, scheduleBlockId }) => ({
          teacherAssignmentId,
          weekday,
          scheduleBlockId,
        }),
      ),
    };
  }

  async create(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: CreateTimetableDto,
  ): Promise<TimetableResponseDto> {
    await this.authorize(
      actor,
      institutionId,
      academicPeriodId,
      PERMISSIONS.TIMETABLES.UPDATE,
    );
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.timetable.findUnique({
          where: {
            institutionId_academicPeriodId: { institutionId, academicPeriodId },
          },
          select: { id: true },
        });
        if (existing)
          throw new ConflictException(
            'A timetable already exists for this institution and academic period',
          );
        const context = await this.loadContext(
          tx,
          institutionId,
          academicPeriodId,
        );
        this.assertReady(context);
        const validation = this.validate(
          context,
          institutionId,
          academicPeriodId,
          dto.slots,
          TimetableValidationMode.COMPLETE,
        );
        this.assertValid(validation);
        const timetable = await tx.timetable.create({
          data: {
            institutionId,
            academicPeriodId,
            slots: { create: this.slotData(context, dto.slots) },
          },
          include: timetableInclude,
        });
        return this.toResponse(timetable);
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'A timetable already exists or conflicts with an existing slot',
        );
      throw error;
    }
  }

  async validation(
    actor: AuthenticatedUser,
    timetableId: string,
  ): Promise<TimetableConflictValidationResult> {
    const timetable = await this.find(timetableId);
    await this.authorize(
      actor,
      timetable.institutionId,
      timetable.academicPeriodId,
      PERMISSIONS.TIMETABLES.READ,
    );
    const context = await this.loadContext(
      this.prisma,
      timetable.institutionId,
      timetable.academicPeriodId,
    );
    return this.validate(
      context,
      timetable.institutionId,
      timetable.academicPeriodId,
      timetable.slots.map((slot) => ({
        teacherAssignmentId: slot.teacherAssignmentId,
        weekday: slot.dayOfWeek,
        scheduleBlockId: slot.scheduleBlockId,
      })),
      TimetableValidationMode.COMPLETE,
      timetable.id,
    );
  }

  async replaceSlots(
    actor: AuthenticatedUser,
    timetableId: string,
    dto: ReplaceTimetableSlotsDto,
  ): Promise<TimetableResponseDto> {
    const existing = await this.find(timetableId);
    await this.authorize(
      actor,
      existing.institutionId,
      existing.academicPeriodId,
      PERMISSIONS.TIMETABLES.UPDATE,
    );
    await this.assertMutablePeriod(
      existing.institutionId,
      existing.academicPeriodId,
    );
    if (existing.status !== TimetableStatus.DRAFT)
      throw new ConflictException('Published timetables cannot be modified');
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.timetable.findUnique({
        where: { id: timetableId },
        select: {
          status: true,
          version: true,
          institutionId: true,
          academicPeriodId: true,
        },
      });
      if (!current) throw new NotFoundException('Timetable not found');
      if (current.status !== TimetableStatus.DRAFT)
        throw new ConflictException('Published timetables cannot be modified');
      if (current.version !== dto.expectedVersion)
        throw new ConflictException(
          'Timetable version is stale; reload before editing',
        );
      const context = await this.loadContext(
        tx,
        current.institutionId,
        current.academicPeriodId,
      );
      this.assertReady(context);
      const validation = this.validate(
        context,
        current.institutionId,
        current.academicPeriodId,
        dto.slots,
        TimetableValidationMode.PARTIAL,
        timetableId,
      );
      this.assertValid(validation);
      const claimed = await tx.timetable.updateMany({
        where: {
          id: timetableId,
          version: dto.expectedVersion,
          status: TimetableStatus.DRAFT,
        },
        data: { version: { increment: 1 } },
      });
      if (claimed.count !== 1)
        throw new ConflictException(
          'Timetable version is stale; reload before editing',
        );
      await tx.timetableSlot.deleteMany({ where: { timetableId } });
      await tx.timetableSlot.createMany({
        data: this.slotData(context, dto.slots).map((slot) => ({
          ...slot,
          timetableId,
        })),
      });
      const updated = await tx.timetable.findUnique({
        where: { id: timetableId },
        include: timetableInclude,
      });
      if (!updated) throw new NotFoundException('Timetable not found');
      return this.toResponse(updated);
    });
  }

  async discard(actor: AuthenticatedUser, timetableId: string): Promise<void> {
    const timetable = await this.find(timetableId);
    await this.authorize(
      actor,
      timetable.institutionId,
      timetable.academicPeriodId,
      PERMISSIONS.TIMETABLES.UPDATE,
    );
    await this.assertMutablePeriod(
      timetable.institutionId,
      timetable.academicPeriodId,
    );
    if (timetable.status !== TimetableStatus.DRAFT)
      throw new ConflictException('Published timetables cannot be discarded');
    await this.prisma.timetable.delete({ where: { id: timetableId } });
  }

  async publish(
    actor: AuthenticatedUser,
    timetableId: string,
    dto: TransitionTimetableDto,
  ): Promise<TimetableResponseDto> {
    const existing = await this.find(timetableId);
    await this.authorize(
      actor,
      existing.institutionId,
      existing.academicPeriodId,
      PERMISSIONS.TIMETABLES.UPDATE,
    );
    await this.assertMutablePeriod(
      existing.institutionId,
      existing.academicPeriodId,
    );
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.timetable.findUnique({
        where: { id: timetableId },
        include: timetableInclude,
      });
      if (!current) throw new NotFoundException('Timetable not found');
      if (current.status !== TimetableStatus.DRAFT)
        throw new ConflictException('Only draft timetables can be published');
      if (current.version !== dto.expectedVersion)
        throw new ConflictException(
          'Timetable version is stale; reload before publishing',
        );
      const context = await this.loadContext(
        tx,
        current.institutionId,
        current.academicPeriodId,
      );
      this.assertReady(context);
      this.assertValid(
        this.validate(
          context,
          current.institutionId,
          current.academicPeriodId,
          current.slots.map((slot) => ({
            teacherAssignmentId: slot.teacherAssignmentId,
            weekday: slot.dayOfWeek,
            scheduleBlockId: slot.scheduleBlockId,
          })),
          TimetableValidationMode.COMPLETE,
          timetableId,
        ),
      );
      const claimed = await tx.timetable.updateMany({
        where: {
          id: timetableId,
          version: dto.expectedVersion,
          status: TimetableStatus.DRAFT,
        },
        data: {
          status: TimetableStatus.PUBLISHED,
          version: { increment: 1 },
          publishedAt: new Date(),
          publishedByUserId: actor.id,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException(
          'Timetable version is stale; reload before publishing',
        );
      const published = await tx.timetable.findUnique({
        where: { id: timetableId },
        include: timetableInclude,
      });
      if (!published) throw new NotFoundException('Timetable not found');
      return this.toResponse(published);
    });
  }

  async unpublish(
    actor: AuthenticatedUser,
    timetableId: string,
    dto: TransitionTimetableDto,
  ): Promise<TimetableResponseDto> {
    const existing = await this.find(timetableId);
    await this.authorize(
      actor,
      existing.institutionId,
      existing.academicPeriodId,
      PERMISSIONS.TIMETABLES.UPDATE,
    );
    await this.assertMutablePeriod(
      existing.institutionId,
      existing.academicPeriodId,
    );
    if (existing.status !== TimetableStatus.PUBLISHED)
      throw new ConflictException(
        'Only published timetables can be unpublished',
      );
    const claimed = await this.prisma.timetable.updateMany({
      where: {
        id: timetableId,
        version: dto.expectedVersion,
        status: TimetableStatus.PUBLISHED,
      },
      data: {
        status: TimetableStatus.DRAFT,
        version: { increment: 1 },
        publishedAt: null,
        publishedByUserId: null,
      },
    });
    if (claimed.count !== 1)
      throw new ConflictException(
        'Timetable version is stale; reload before unpublishing',
      );
    return this.findOne(actor, timetableId);
  }

  private async authorize(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    permission: Permission,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Timetable not found');
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { institutionId: true },
    });
    if (
      !period ||
      (period.institutionId !== null && period.institutionId !== institutionId)
    )
      throw new NotFoundException('Academic period not found');
    await this.permissions.requireForInstitutionMembership({
      actor,
      institutionId,
      permission,
      domain: 'timetables',
      resourceType: 'timetable',
      resourceId: academicPeriodId,
    });
  }

  private async assertMutablePeriod(
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { institutionId: true, status: true },
    });
    if (
      !period ||
      (period.institutionId !== null && period.institutionId !== institutionId)
    )
      throw new NotFoundException('Academic period not found');
    if (
      period.status === AcademicPeriodStatus.CLOSED ||
      period.status === AcademicPeriodStatus.ARCHIVED
    )
      throw new BadRequestException(
        'Timetables cannot change a closed or archived academic period',
      );
  }
  private async find(id: string): Promise<TimetableDetail> {
    const row = await this.prisma.timetable.findUnique({
      where: { id },
      include: timetableInclude,
    });
    if (!row) throw new NotFoundException('Timetable not found');
    return row;
  }
  private async loadContext(
    db: DbClient,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<SchedulingContext> {
    const [structure, assignments] = await Promise.all([
      db.periodScheduleStructure.findUnique({
        where: {
          institutionId_academicPeriodId: { institutionId, academicPeriodId },
        },
        include: {
          scheduleBlocks: { orderBy: [{ position: 'asc' }, { id: 'asc' }] },
        },
      }),
      db.teacherAssignment.findMany({
        where: { institutionId, academicPeriodId },
        select: {
          id: true,
          institutionId: true,
          academicPeriodId: true,
          teacherId: true,
          courseId: true,
          teachingLoad: { select: { weeklyPeriods: true } },
        },
        orderBy: { id: 'asc' },
      }),
    ]);
    if (!structure)
      throw new BadRequestException(
        'Schedule structure must be configured before managing a timetable',
      );
    return { structure, assignments };
  }
  private assertReady(context: SchedulingContext): void {
    if (
      !context.structure.enabledWeekdays.length ||
      !context.structure.scheduleBlocks.some(
        (block) => block.kind === ScheduleBlockKind.TEACHING,
      )
    )
      throw new BadRequestException(
        'Schedule structure is not ready for timetable operations',
      );
    if (
      !context.assignments.length ||
      context.assignments.some((assignment) => !assignment.teachingLoad)
    )
      throw new BadRequestException(
        'Every teacher assignment requires a configured teaching load',
      );
  }
  private validate(
    context: SchedulingContext,
    institutionId: string,
    academicPeriodId: string,
    slots: TimetableSlotInputDto[],
    mode: TimetableValidationMode,
    timetableId?: string,
  ): TimetableConflictValidationResult {
    const candidates: TimetableCandidateSlot[] = slots.map((slot, index) => ({
      ...slot,
      id: `candidate-${index}`,
    }));
    return this.conflicts.validate({
      mode,
      context: {
        institutionId,
        academicPeriodId,
        periodScheduleStructureId: context.structure.id,
        enabledWeekdays: context.structure.enabledWeekdays,
        ...(timetableId
          ? { timetable: { id: timetableId, institutionId, academicPeriodId } }
          : {}),
      },
      assignments: context.assignments.map((assignment) => ({
        id: assignment.id,
        institutionId: assignment.institutionId,
        academicPeriodId: assignment.academicPeriodId,
        teacherId: assignment.teacherId,
        courseId: assignment.courseId,
      })),
      scheduleBlocks: context.structure.scheduleBlocks.map(
        ({ id, periodScheduleStructureId, kind }) => ({
          id,
          periodScheduleStructureId,
          kind,
        }),
      ),
      teachingLoads: context.assignments.flatMap((assignment) =>
        assignment.teachingLoad
          ? [
              {
                teacherAssignmentId: assignment.id,
                weeklyPeriods: assignment.teachingLoad.weeklyPeriods,
              },
            ]
          : [],
      ),
      candidates,
    });
  }
  private assertValid(result: TimetableConflictValidationResult): void {
    if (!result.valid)
      throw new BadRequestException({
        message: 'Timetable validation failed',
        conflicts: result.conflicts,
      });
  }
  private slotData(
    context: SchedulingContext,
    slots: TimetableSlotInputDto[],
  ): Array<{
    teacherAssignmentId: string;
    scheduleBlockId: string;
    dayOfWeek: Weekday;
    teacherId: string;
    courseId: string;
  }> {
    const assignments = new Map(
      context.assignments.map((item) => [item.id, item]),
    );
    return slots.map((slot) => {
      const assignment = assignments.get(slot.teacherAssignmentId);
      if (!assignment)
        throw new BadRequestException('Timetable validation failed');
      return {
        teacherAssignmentId: slot.teacherAssignmentId,
        scheduleBlockId: slot.scheduleBlockId,
        dayOfWeek: slot.weekday,
        teacherId: assignment.teacherId,
        courseId: assignment.courseId,
      };
    });
  }
  private toResponse(row: TimetableDetail): TimetableResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      academicPeriodId: row.academicPeriodId,
      status: row.status,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      publishedAt: row.publishedAt,
      publishedByUserId: row.publishedByUserId,
      slots: row.slots
        .sort(
          (a, b) =>
            a.dayOfWeek.localeCompare(b.dayOfWeek) ||
            a.scheduleBlock.position - b.scheduleBlock.position ||
            a.teacherAssignmentId.localeCompare(b.teacherAssignmentId),
        )
        .map((slot) => ({
          id: slot.id,
          teacherAssignmentId: slot.teacherAssignmentId,
          teacherId: slot.teacherId,
          courseId: slot.courseId,
          weekday: slot.dayOfWeek,
          scheduleBlockId: slot.scheduleBlockId,
          scheduleBlockPosition: slot.scheduleBlock.position,
          scheduleBlockStartTime: this.time(slot.scheduleBlock.startTime),
          scheduleBlockEndTime: this.time(slot.scheduleBlock.endTime),
          courseName: slot.teacherAssignment.course.name,
          subjectName: slot.teacherAssignment.subject.name,
          teacherName:
            `${slot.teacherAssignment.teacher.user.firstName} ${slot.teacherAssignment.teacher.user.lastName}`.trim(),
        })),
    };
  }
  private time(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
}
