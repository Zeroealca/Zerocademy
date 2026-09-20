/* eslint-disable @typescript-eslint/only-throw-error, no-empty -- NestJS HTTP exceptions are the application error contract; role checks intentionally fall through. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcademicPeriodStatus, AcademicPlanStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

type UnitInput = {
  title: string;
  description?: string;
  objectives?: string;
  contents?: string;
  activities?: string;
  resources?: string;
  evaluationNotes?: string;
  startDate?: string;
  endDate?: string;
};
@Injectable()
export class AcademicUnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}
  async list(actor: AuthenticatedUser, planId: string) {
    const plan = await this.plan(actor, planId);
    return this.prisma.academicUnit.findMany({
      where: { academicPlanId: plan.id },
      orderBy: { position: 'asc' },
    });
  }
  async one(actor: AuthenticatedUser, planId: string, id: string) {
    await this.plan(actor, planId);
    const unit = await this.prisma.academicUnit.findFirst({
      where: { id, academicPlanId: planId },
    });
    if (!unit) throw new NotFoundException('Academic unit not found');
    return unit;
  }
  async create(actor: AuthenticatedUser, planId: string, dto: UnitInput) {
    const plan = await this.plan(actor, planId, true);
    const dates = this.dates(plan, dto.startDate, dto.endDate);
    const unit = await this.prisma.$transaction(async (tx) => {
      const last = await tx.academicUnit.aggregate({
        where: { academicPlanId: planId },
        _max: { position: true },
      });
      return tx.academicUnit.create({
        data: {
          academicPlanId: planId,
          position: (last._max.position ?? 0) + 1,
          title: dto.title.trim(),
          ...this.fields(dto),
          ...dates,
        },
      });
    });
    this.log('ACADEMIC_UNIT_CREATED', actor.id, planId, unit.id);
    return unit;
  }
  async update(
    actor: AuthenticatedUser,
    planId: string,
    id: string,
    dto: Partial<UnitInput>,
  ) {
    const plan = await this.plan(actor, planId, true);
    const unit = await this.one(actor, planId, id);
    const dates = this.dates(
      plan,
      dto.startDate ?? this.day(unit.startDate),
      dto.endDate ?? this.day(unit.endDate),
    );
    const updated = await this.prisma.academicUnit.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...this.fields(dto),
        ...dates,
      },
    });
    this.log('ACADEMIC_UNIT_UPDATED', actor.id, planId, id);
    return updated;
  }
  async remove(actor: AuthenticatedUser, planId: string, id: string) {
    await this.plan(actor, planId, true);
    await this.one(actor, planId, id);
    await this.prisma.$transaction(async (tx) => {
      await tx.academicUnit.delete({ where: { id } });
      const units = await tx.academicUnit.findMany({
        where: { academicPlanId: planId },
        orderBy: { position: 'asc' },
      });
      for (const [i, u] of units.entries())
        await tx.academicUnit.update({
          where: { id: u.id },
          data: { position: 10000 + i },
        });
      for (const [i, u] of units.entries())
        await tx.academicUnit.update({
          where: { id: u.id },
          data: { position: i + 1 },
        });
    });
    this.log('ACADEMIC_UNIT_DELETED', actor.id, planId, id);
  }
  async reorder(actor: AuthenticatedUser, planId: string, unitIds: string[]) {
    await this.plan(actor, planId, true);
    if (new Set(unitIds).size !== unitIds.length)
      throw new BadRequestException('Unit ids must not repeat');
    await this.prisma.$transaction(async (tx) => {
      const units = await tx.academicUnit.findMany({
        where: { academicPlanId: planId },
        select: { id: true },
      });
      if (
        units.length !== unitIds.length ||
        units.some((u) => !unitIds.includes(u.id))
      )
        throw new BadRequestException(
          'Unit ids must exactly match the plan units',
        );
      for (const [i, id] of unitIds.entries())
        await tx.academicUnit.update({
          where: { id },
          data: { position: 10000 + i },
        });
      for (const [i, id] of unitIds.entries())
        await tx.academicUnit.update({
          where: { id },
          data: { position: i + 1 },
        });
    });
    this.logger.log({
      context: 'AcademicUnitsService',
      event: 'ACADEMIC_UNITS_REORDERED',
      message: 'Academic units reordered',
      userId: actor.id,
      metadata: { academicPlanId: planId, count: unitIds.length },
    });
  }
  private async plan(actor: AuthenticatedUser, id: string, write = false) {
    const p = await this.prisma.academicPlan.findUnique({
      where: { id },
      include: { teacherAssignment: { include: { academicPeriod: true } } },
    });
    if (!p) throw new NotFoundException('Academic plan not found');
    if (
      actor.role === Role.TEACHER &&
      actor.profileId === p.teacherAssignment.teacherId
    ) {
    } else if (
      actor.role === Role.ADMIN &&
      actor.institutionId === p.teacherAssignment.institutionId
    ) {
    } else if (actor.role !== Role.SUPER_ADMIN)
      throw new NotFoundException('Academic plan not found');
    if (write) {
      if (actor.role !== Role.TEACHER)
        throw new NotFoundException('Academic plan not found');
      if (
        p.status !== AcademicPlanStatus.DRAFT ||
        p.teacherAssignment.academicPeriod.status ===
          AcademicPeriodStatus.CLOSED
      )
        throw new BadRequestException('Academic plan units are read-only');
    }
    return p;
  }
  private fields(dto: Partial<UnitInput>) {
    const o: Record<string, string | null> = {};
    for (const k of [
      'description',
      'objectives',
      'contents',
      'activities',
      'resources',
      'evaluationNotes',
    ] as const)
      if (dto[k] !== undefined) o[k] = dto[k]?.trim() || null;
    return o;
  }
  private dates(
    plan: { startDate: Date | null; endDate: Date | null },
    start?: string,
    end?: string,
  ) {
    if (!start && !end) return {};
    if (!start || !end)
      throw new BadRequestException(
        'Unit startDate and endDate must be provided together',
      );
    const s = new Date(`${start}T00:00:00.000Z`),
      e = new Date(`${end}T00:00:00.000Z`);
    if (s > e)
      throw new BadRequestException('startDate must be on or before endDate');
    if (
      (plan.startDate && s < plan.startDate) ||
      (plan.endDate && e > plan.endDate)
    )
      throw new BadRequestException(
        'Unit dates must fall within the academic plan',
      );
    return { startDate: s, endDate: e };
  }
  private day(d: Date | null) {
    return d?.toISOString().slice(0, 10);
  }
  private log(
    event: string,
    userId: string,
    academicPlanId: string,
    academicUnitId?: string,
  ) {
    this.logger.log({
      context: 'AcademicUnitsService',
      event,
      message: event,
      userId,
      metadata: { academicPlanId, academicUnitId },
    });
  }
}
