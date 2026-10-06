/* eslint-disable @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the application error contract. */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  OfficialStudyPlanStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { STUDY_PLANS_CONTEXT } from './constants';
import type { AdoptStudyPlanDto } from './dto/adopt-study-plan.dto';
import {
  InstitutionStudyPlanAdoptionResponseDto,
  OfficialStudyPlanResponseDto,
} from './dto/study-plan-response.dto';

const planInclude = Prisma.validator<Prisma.OfficialStudyPlanInclude>()({
  entries: {
    include: {
      gradeLevel: { select: { code: true } },
      subject: { select: { code: true } },
    },
    orderBy: [{ gradeLevel: { order: 'asc' } }, { subject: { code: 'asc' } }],
  },
  allocationGroups: {
    include: { gradeLevel: { select: { code: true } } },
    orderBy: [{ gradeLevel: { order: 'asc' } }, { key: 'asc' }],
  },
});
type OfficialStudyPlanWithDetails = Prisma.OfficialStudyPlanGetPayload<{
  include: typeof planInclude;
}>;

@Injectable()
export class StudyPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly permissionEnforcer: MembershipPermissionEnforcer,
  ) {}

  async list(): Promise<OfficialStudyPlanResponseDto[]> {
    const plans = await this.prisma.officialStudyPlan.findMany({
      orderBy: [{ applicabilityKey: 'asc' }, { effectiveFrom: 'desc' }],
      include: planInclude,
    });
    return plans.map((plan) => this.toPlanResponse(plan));
  }

  async findOne(id: string): Promise<OfficialStudyPlanResponseDto> {
    const plan = await this.prisma.officialStudyPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('Official study plan not found');
    return this.toPlanResponse(plan);
  }

  async listAdoptions(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<InstitutionStudyPlanAdoptionResponseDto[]> {
    this.assertInstitutionAdmin(actor);
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await this.assertPeriodBelongsToInstitution(institutionId, academicPeriodId);
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.STUDY_PLANS.READ,
      domain: 'study-plans',
      resourceType: 'institutionAcademicPeriod',
      resourceId: academicPeriodId,
    });
    const adoptions = await this.prisma.institutionStudyPlanAdoption.findMany({
      where: { institutionId, academicPeriodId },
      orderBy: { applicabilityKey: 'asc' },
    });
    return adoptions.map((adoption) => this.toAdoptionResponse(adoption));
  }

  async adopt(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    dto: AdoptStudyPlanDto,
  ): Promise<InstitutionStudyPlanAdoptionResponseDto> {
    this.assertInstitutionAdmin(actor);
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    const period = await this.assertPeriodBelongsToInstitution(
      institutionId,
      academicPeriodId,
    );
    if (
      period.status === AcademicPeriodStatus.CLOSED ||
      period.status === AcademicPeriodStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Study-plan adoption cannot change a closed or archived academic period',
      );
    }
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.STUDY_PLANS.ADOPT,
      domain: 'study-plans',
      resourceType: 'institutionAcademicPeriod',
      resourceId: academicPeriodId,
    });
    const plan = await this.prisma.officialStudyPlan.findUnique({
      where: { id: dto.officialStudyPlanId },
      select: {
        id: true,
        status: true,
        applicabilityKey: true,
        effectiveFrom: true,
        effectiveTo: true,
      },
    });
    if (!plan) throw new BadRequestException('Official study plan is not available');
    if (plan.status !== OfficialStudyPlanStatus.ACTIVE) {
      throw new BadRequestException('Official study plan is not active');
    }
    if (period.startDate < plan.effectiveFrom || (plan.effectiveTo && period.endDate > plan.effectiveTo)) {
      throw new BadRequestException('Official study plan is not applicable to the academic period dates');
    }
    try {
      const adoption = await this.prisma.institutionStudyPlanAdoption.create({
        data: {
          institutionId,
          academicPeriodId,
          officialStudyPlanId: plan.id,
          applicabilityKey: plan.applicabilityKey,
          adoptedByUserId: actor.id,
        },
      });
      this.logger.log({
        context: STUDY_PLANS_CONTEXT,
        event: 'INSTITUTION_STUDY_PLAN_ADOPTED',
        message: 'Institution adopted an official study plan',
        userId: actor.id,
        metadata: { adoptionId: adoption.id, institutionId, academicPeriodId, officialStudyPlanId: plan.id },
      });
      return this.toAdoptionResponse(adoption);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('An official study plan is already adopted for this institution, academic period, and applicability scope');
      }
      throw error;
    }
  }

  private assertInstitutionAdmin(actor: AuthenticatedUser): void {
    if (actor.role !== Role.ADMIN) {
      throw new NotFoundException('Institution study-plan adoption not found');
    }
  }

  private async assertPeriodBelongsToInstitution(institutionId: string, academicPeriodId: string) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { id: true, institutionId: true, status: true, startDate: true, endDate: true },
    });
    if (!period || (period.institutionId !== null && period.institutionId !== institutionId)) {
      throw new NotFoundException('Academic period not found');
    }
    return period;
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private toPlanResponse(plan: OfficialStudyPlanWithDetails): OfficialStudyPlanResponseDto {
    return {
      id: plan.id, code: plan.code, version: plan.version, name: plan.name,
      applicabilityKey: plan.applicabilityKey, sourceTitle: plan.sourceTitle,
      sourceReference: plan.sourceReference, sourceUrl: plan.sourceUrl,
      issuedOn: plan.issuedOn.toISOString().slice(0, 10),
      effectiveFrom: plan.effectiveFrom.toISOString().slice(0, 10),
      effectiveTo: plan.effectiveTo?.toISOString().slice(0, 10) ?? null,
      status: plan.status,
      entries: plan.entries.map((entry) => ({ id: entry.id, gradeLevelId: entry.gradeLevelId, gradeLevelCode: entry.gradeLevel.code, subjectId: entry.subjectId, subjectCode: entry.subject.code, valuePolicy: entry.valuePolicy, defaultWeeklyPeriods: entry.defaultWeeklyPeriods, minimumWeeklyPeriods: entry.minimumWeeklyPeriods, allocationGroupId: entry.allocationGroupId, sourceLocator: entry.sourceLocator })),
      allocationGroups: plan.allocationGroups.map((group) => ({ id: group.id, gradeLevelId: group.gradeLevelId, gradeLevelCode: group.gradeLevel.code, key: group.key, name: group.name, valuePolicy: group.valuePolicy, defaultWeeklyPeriods: group.defaultWeeklyPeriods, minimumWeeklyPeriods: group.minimumWeeklyPeriods, sourceLocator: group.sourceLocator })),
    };
  }

  private toAdoptionResponse(adoption: { id: string; institutionId: string; academicPeriodId: string; officialStudyPlanId: string; applicabilityKey: string; adoptedByUserId: string; adoptedAt: Date }): InstitutionStudyPlanAdoptionResponseDto {
    return { ...adoption, adoptedAt: adoption.adoptedAt.toISOString() };
  }
}
