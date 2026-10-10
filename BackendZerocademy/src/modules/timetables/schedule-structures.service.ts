/* eslint-disable @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  Prisma,
  Role,
  ScheduleBlockKind,
  Weekday,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TIMETABLES_CONTEXT } from './constants';
import type {
  CreateScheduleBlockDto,
  UpdateScheduleBlockDto,
} from './dto/schedule-block.dto';
import type { ReorderScheduleBlocksDto } from './dto/reorder-schedule-blocks.dto';
import {
  type ScheduleBlockResponseDto,
  type ScheduleCapacitySummaryDto,
  type ScheduleStructureDetailResponseDto,
  type ScheduleStructureIssueDto,
  ScheduleStructureIssueSeverity,
  type ScheduleStructureResponseDto,
  ScheduleStructureValidationStatus,
  type ScheduleStructureValidationResponseDto,
} from './dto/schedule-structure-response.dto';
import type { UpdateScheduleStructureDto } from './dto/update-schedule-structure.dto';

const structureInclude =
  Prisma.validator<Prisma.PeriodScheduleStructureInclude>()({
    scheduleBlocks: { orderBy: { position: 'asc' } },
  });
type StructureWithBlocks = Prisma.PeriodScheduleStructureGetPayload<{
  include: typeof structureInclude;
}>;
type BlockInput = Pick<
  CreateScheduleBlockDto,
  'startTime' | 'endTime' | 'kind'
> & { name?: string };

@Injectable()
export class ScheduleStructuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly permissionEnforcer: MembershipPermissionEnforcer,
  ) {}

  async findOne(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<ScheduleStructureDetailResponseDto> {
    await this.authorizeRead(actor, institutionId, academicPeriodId);
    const structure = await this.findStructureForContext(
      institutionId,
      academicPeriodId,
    );
    return this.toDetail(structure);
  }

  async upsert(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: UpdateScheduleStructureDto,
  ): Promise<ScheduleStructureResponseDto> {
    await this.authorizeConfigure(actor, institutionId, academicPeriodId);
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    const structure = await this.prisma.periodScheduleStructure.upsert({
      where: {
        institutionId_academicPeriodId: { institutionId, academicPeriodId },
      },
      create: {
        institutionId,
        academicPeriodId,
        enabledWeekdays: dto.enabledWeekdays,
      },
      update: { enabledWeekdays: dto.enabledWeekdays },
      include: structureInclude,
    });
    this.log('SCHEDULE_STRUCTURE_UPSERTED', actor.id, {
      institutionId,
      academicPeriodId,
    });
    return this.toResponse(structure);
  }

  async createBlock(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: CreateScheduleBlockDto,
  ): Promise<ScheduleBlockResponseDto> {
    await this.authorizeConfigure(actor, institutionId, academicPeriodId);
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    const structure = await this.findStructureForContext(
      institutionId,
      academicPeriodId,
    );
    this.assertBlockFits(dto, structure.scheduleBlocks);
    const block = await this.prisma.scheduleBlock.create({
      data: {
        periodScheduleStructureId: structure.id,
        position: structure.scheduleBlocks.length + 1,
        name: dto.name?.trim() || null,
        startTime: this.toTime(dto.startTime),
        endTime: this.toTime(dto.endTime),
        kind: dto.kind,
      },
    });
    this.log('SCHEDULE_BLOCK_CREATED', actor.id, {
      institutionId,
      academicPeriodId,
      scheduleBlockId: block.id,
    });
    return this.toBlockResponse(block);
  }

  async updateBlock(
    actor: AuthenticatedUser,
    scheduleBlockId: string,
    dto: UpdateScheduleBlockDto,
  ): Promise<ScheduleBlockResponseDto> {
    const current = await this.findBlockOrThrow(scheduleBlockId);
    await this.authorizeConfigure(
      actor,
      current.periodScheduleStructure.institutionId,
      current.periodScheduleStructure.academicPeriodId,
    );
    await this.assertMutablePeriod(
      current.periodScheduleStructure.institutionId,
      current.periodScheduleStructure.academicPeriodId,
    );
    const candidate: BlockInput = {
      name: dto.name === undefined ? (current.name ?? undefined) : dto.name,
      startTime: dto.startTime ?? this.formatTime(current.startTime),
      endTime: dto.endTime ?? this.formatTime(current.endTime),
      kind: dto.kind ?? current.kind,
    };
    this.assertBlockFits(
      candidate,
      current.periodScheduleStructure.scheduleBlocks.filter(
        (block) => block.id !== current.id,
      ),
    );
    const block = await this.prisma.scheduleBlock.update({
      where: { id: scheduleBlockId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(dto.startTime !== undefined
          ? { startTime: this.toTime(dto.startTime) }
          : {}),
        ...(dto.endTime !== undefined
          ? { endTime: this.toTime(dto.endTime) }
          : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
      },
    });
    this.log('SCHEDULE_BLOCK_UPDATED', actor.id, { scheduleBlockId });
    return this.toBlockResponse(block);
  }

  async removeBlock(
    actor: AuthenticatedUser,
    scheduleBlockId: string,
  ): Promise<void> {
    const block = await this.findBlockOrThrow(scheduleBlockId);
    const { institutionId, academicPeriodId } = block.periodScheduleStructure;
    await this.authorizeConfigure(actor, institutionId, academicPeriodId);
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { scheduleBlockId },
      select: { id: true },
    });
    if (slot)
      throw new BadRequestException(
        'Schedule block cannot be deleted while it is referenced by a timetable slot',
      );
    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleBlock.delete({ where: { id: scheduleBlockId } });
      const remaining = await tx.scheduleBlock.findMany({
        where: { periodScheduleStructureId: block.periodScheduleStructureId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      for (const [index, item] of remaining.entries())
        await tx.scheduleBlock.update({
          where: { id: item.id },
          data: { position: index + 1 },
        });
    });
    this.log('SCHEDULE_BLOCK_DELETED', actor.id, {
      scheduleBlockId,
      institutionId,
      academicPeriodId,
    });
  }

  async reorderBlocks(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: ReorderScheduleBlocksDto,
  ): Promise<ScheduleStructureResponseDto> {
    await this.authorizeConfigure(actor, institutionId, academicPeriodId);
    await this.assertMutablePeriod(institutionId, academicPeriodId);
    const structure = await this.findStructureForContext(
      institutionId,
      academicPeriodId,
    );
    const existingIds = new Set(
      structure.scheduleBlocks.map((block) => block.id),
    );
    const submittedIds = new Set(dto.items.map((item) => item.id));
    const positions = new Set(dto.items.map((item) => item.position));
    if (
      submittedIds.size !== dto.items.length ||
      positions.size !== dto.items.length ||
      submittedIds.size !== existingIds.size ||
      [...submittedIds].some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException(
        'Reorder items must include every schedule block exactly once with unique positions',
      );
    }
    await this.prisma.$transaction(async (tx) => {
      for (const [index, item] of dto.items.entries())
        await tx.scheduleBlock.update({
          where: { id: item.id },
          data: { position: 10_000 + index },
        });
      for (const item of dto.items)
        await tx.scheduleBlock.update({
          where: { id: item.id },
          data: { position: item.position },
        });
    });
    const updated = await this.findStructureForContext(
      institutionId,
      academicPeriodId,
    );
    this.log('SCHEDULE_BLOCKS_REORDERED', actor.id, {
      institutionId,
      academicPeriodId,
    });
    return this.toResponse(updated);
  }

  async validate(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<ScheduleStructureValidationResponseDto> {
    await this.authorizeRead(actor, institutionId, academicPeriodId);
    return this.validationFor(
      await this.findStructureForContext(institutionId, academicPeriodId),
    );
  }

  private async authorizeRead(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Schedule structure not found');
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await this.assertPeriodContext(institutionId, academicPeriodId);
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.SCHEDULE_STRUCTURES.READ,
      domain: 'timetables',
      resourceType: 'periodScheduleStructure',
      resourceId: academicPeriodId,
    });
  }

  private async authorizeConfigure(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Schedule structure not found');
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await this.assertPeriodContext(institutionId, academicPeriodId);
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.SCHEDULE_STRUCTURES.CONFIGURE,
      domain: 'timetables',
      resourceType: 'periodScheduleStructure',
      resourceId: academicPeriodId,
    });
  }

  private async assertPeriodContext(
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { institutionId: true },
    });
    if (
      !period ||
      (period.institutionId !== null && period.institutionId !== institutionId)
    )
      throw new NotFoundException('Academic period not found');
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
        'Schedule structure cannot change a closed or archived academic period',
      );
  }

  private async findStructureForContext(
    institutionId: string,
    academicPeriodId: string,
  ): Promise<StructureWithBlocks> {
    const structure = await this.prisma.periodScheduleStructure.findUnique({
      where: {
        institutionId_academicPeriodId: { institutionId, academicPeriodId },
      },
      include: structureInclude,
    });
    if (!structure) throw new NotFoundException('Schedule structure not found');
    return structure;
  }

  private async findBlockOrThrow(id: string) {
    const block = await this.prisma.scheduleBlock.findUnique({
      where: { id },
      include: {
        periodScheduleStructure: {
          include: { scheduleBlocks: { orderBy: { position: 'asc' } } },
        },
      },
    });
    if (!block) throw new NotFoundException('Schedule block not found');
    return block;
  }

  private assertBlockFits(
    candidate: BlockInput,
    existing: Array<{ id: string; startTime: Date; endTime: Date }>,
  ): void {
    const start = this.timeToSeconds(candidate.startTime);
    const end = this.timeToSeconds(candidate.endTime);
    if (start >= end)
      throw new BadRequestException(
        'Schedule block start time must be strictly before end time',
      );
    const overlaps = existing.some(
      (block) =>
        start < this.timeToSeconds(this.formatTime(block.endTime)) &&
        end > this.timeToSeconds(this.formatTime(block.startTime)),
    );
    if (overlaps)
      throw new BadRequestException(
        'Schedule block time range overlaps an existing block',
      );
  }

  private validationFor(
    structure: StructureWithBlocks,
  ): ScheduleStructureValidationResponseDto {
    const issues: ScheduleStructureIssueDto[] = [];
    if (!structure.enabledWeekdays.length)
      issues.push(
        this.issue(
          ScheduleStructureValidationStatus.NO_ENABLED_WEEKDAYS,
          'At least one teaching weekday must be enabled',
        ),
      );
    if (
      !structure.scheduleBlocks.some(
        (block) => block.kind === ScheduleBlockKind.TEACHING,
      )
    )
      issues.push(
        this.issue(
          ScheduleStructureValidationStatus.NO_TEACHING_BLOCKS,
          'At least one teaching block is required',
        ),
      );
    const positions = new Set<number>();
    for (const block of structure.scheduleBlocks) {
      if (
        this.timeToSeconds(this.formatTime(block.startTime)) >=
        this.timeToSeconds(this.formatTime(block.endTime))
      )
        issues.push(
          this.issue(
            ScheduleStructureValidationStatus.INVALID_TIME_RANGE,
            'Block start time must be strictly before end time',
            block.id,
          ),
        );
      if (positions.has(block.position))
        issues.push(
          this.issue(
            ScheduleStructureValidationStatus.DUPLICATE_POSITION,
            'Block position must be unique',
            block.id,
          ),
        );
      positions.add(block.position);
    }
    for (let index = 1; index < structure.scheduleBlocks.length; index += 1) {
      const previous = structure.scheduleBlocks[index - 1];
      const current = structure.scheduleBlocks[index];
      if (
        this.timeToSeconds(this.formatTime(current.startTime)) <
        this.timeToSeconds(this.formatTime(previous.endTime))
      )
        issues.push(
          this.issue(
            ScheduleStructureValidationStatus.OVERLAPPING_BLOCKS,
            'Blocks must not overlap',
            current.id,
          ),
        );
    }
    return {
      structurallyReady: !issues.some(
        (issue) => issue.severity === ScheduleStructureIssueSeverity.ERROR,
      ),
      issues,
    };
  }

  private toDetail(
    structure: StructureWithBlocks,
  ): ScheduleStructureDetailResponseDto {
    const validation = this.validationFor(structure);
    const teaching = structure.scheduleBlocks.filter(
      (block) => block.kind === ScheduleBlockKind.TEACHING,
    ).length;
    const capacity: ScheduleCapacitySummaryDto = {
      enabledWeekdays: structure.enabledWeekdays,
      teachingBlocksPerConfiguredDay: teaching,
      weeklyTeachingSlotsPerCourse: teaching * structure.enabledWeekdays.length,
      breakBlocksPerConfiguredDay: structure.scheduleBlocks.filter(
        (block) => block.kind === ScheduleBlockKind.BREAK,
      ).length,
      nonTeachingBlocksPerConfiguredDay: structure.scheduleBlocks.filter(
        (block) => block.kind === ScheduleBlockKind.NON_TEACHING,
      ).length,
      structurallyReady: validation.structurallyReady,
    };
    return { ...this.toResponse(structure), capacity };
  }

  private toResponse(
    structure: StructureWithBlocks,
  ): ScheduleStructureResponseDto {
    return {
      id: structure.id,
      institutionId: structure.institutionId,
      academicPeriodId: structure.academicPeriodId,
      enabledWeekdays: structure.enabledWeekdays as Weekday[],
      blocks: structure.scheduleBlocks.map((block) =>
        this.toBlockResponse(block),
      ),
    };
  }

  private toBlockResponse(block: {
    id: string;
    position: number;
    name: string | null;
    startTime: Date;
    endTime: Date;
    kind: ScheduleBlockKind;
  }): ScheduleBlockResponseDto {
    return {
      id: block.id,
      position: block.position,
      name: block.name,
      startTime: this.formatTime(block.startTime),
      endTime: this.formatTime(block.endTime),
      kind: block.kind,
    };
  }

  private toTime(value: string): Date {
    return new Date(
      `1970-01-01T${value.length === 5 ? `${value}:00` : value}.000Z`,
    );
  }
  private formatTime(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
  private timeToSeconds(value: string): number {
    const [hours, minutes, seconds = '0'] = value.split(':');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
  }
  private issue(
    status: ScheduleStructureValidationStatus,
    message: string,
    scheduleBlockId: string | null = null,
  ): ScheduleStructureIssueDto {
    return {
      status,
      severity: ScheduleStructureIssueSeverity.ERROR,
      message,
      scheduleBlockId,
    };
  }
  private log(
    event: string,
    userId: string,
    metadata: Record<string, string>,
  ): void {
    this.logger.log({
      context: TIMETABLES_CONTEXT,
      event,
      message: event.replaceAll('_', ' ').toLowerCase(),
      userId,
      metadata,
    });
  }
}
