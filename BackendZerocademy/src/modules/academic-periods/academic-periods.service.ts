import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  Prisma,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertActivatableStatus,
  assertDeletableStatus,
  assertNoOverlappingActivePeriod,
  assertValidPeriodDates,
  parseDateOnly,
} from './academic-period.validation';
import {
  findActiveInstitutionOrThrow,
  resolveInstitutionAcademicRegime,
} from '../institutions/institution.validation';
import {
  assertActorCanAccessPeriod,
  resolveActorInstitutionId,
} from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ACADEMIC_PERIODS_CONTEXT } from './constants';
import { AcademicPeriodContextResponseDto } from './dto/academic-period-context-response.dto';
import { SetSelectedAcademicPeriodDto } from './dto/set-selected-academic-period.dto';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { ListAcademicPeriodsQueryDto } from './dto/list-academic-periods-query.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { AcademicPeriodListResponseDto } from './dto/academic-period-list-response.dto';
import { AcademicPeriodResponseDto } from './dto/academic-period-response.dto';
import {
  academicPeriodWithTermsInclude,
  toAcademicPeriodResponseDto,
} from './mappers/academic-period.mapper';

@Injectable()
export class AcademicPeriodsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListAcademicPeriodsQueryDto,
  ): Promise<AcademicPeriodListResponseDto> {
    const where = await this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, periods] = await this.prisma.$transaction([
      this.prisma.academicPeriod.count({ where }),
      this.prisma.academicPeriod.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ regime: 'asc' }, { startDate: 'desc' }],
      }),
    ]);

    return {
      data: periods.map((period) => toAcademicPeriodResponseDto(period)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<AcademicPeriodResponseDto> {
    const period = await this.findPeriodOrThrow(id, true);
    return toAcademicPeriodResponseDto(period, true);
  }

  async findActiveByRegime(
    regime: AcademicRegime,
  ): Promise<AcademicPeriodResponseDto | null> {
    const period = await this.prisma.academicPeriod.findFirst({
      where: {
        regime,
        status: AcademicPeriodStatus.ACTIVE,
        isActive: true,
      },
      include: academicPeriodWithTermsInclude,
    });

    return period ? toAcademicPeriodResponseDto(period, true) : null;
  }

  async create(dto: CreateAcademicPeriodDto): Promise<AcademicPeriodResponseDto> {
    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    assertValidPeriodDates({ startDate, endDate });

    if (dto.institutionId) {
      await findActiveInstitutionOrThrow(this.prisma, dto.institutionId);
    }

    const period = await this.prisma.academicPeriod.create({
      data: {
        name: dto.name.trim(),
        institutionId: dto.institutionId ?? null,
        regime: dto.regime,
        startDate,
        endDate,
        status: AcademicPeriodStatus.PLANNED,
        isActive: false,
      },
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_CREATED',
      message: 'Academic period created',
      metadata: { periodId: period.id, regime: period.regime },
    });

    return toAcademicPeriodResponseDto(period);
  }

  async update(
    id: string,
    dto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriodResponseDto> {
    const existing = await this.findPeriodOrThrow(id);

    if (existing.status === AcademicPeriodStatus.ACTIVE) {
      throw new BadRequestException(
        'Deactivate the period before editing core calendar fields',
      );
    }

    const startDate = dto.startDate
      ? parseDateOnly(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : existing.endDate;
    assertValidPeriodDates({ startDate, endDate });

    const period = await this.prisma.academicPeriod.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.regime !== undefined ? { regime: dto.regime } : {}),
        ...(dto.startDate !== undefined ? { startDate } : {}),
        ...(dto.endDate !== undefined ? { endDate } : {}),
      },
      include: academicPeriodWithTermsInclude,
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_UPDATED',
      message: 'Academic period updated',
      metadata: { periodId: period.id },
    });

    return toAcademicPeriodResponseDto(period, true);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findPeriodOrThrow(id);
    assertDeletableStatus(existing.status);

    await this.prisma.academicPeriod.delete({ where: { id } });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_DELETED',
      message: 'Academic period deleted',
      metadata: { periodId: id },
    });
  }

  async activate(id: string): Promise<AcademicPeriodResponseDto> {
    const period = await this.findPeriodOrThrow(id, true);
    assertActivatableStatus(period.status);
    assertValidPeriodDates({
      startDate: period.startDate,
      endDate: period.endDate,
    });

    const otherActive = await this.prisma.academicPeriod.findMany({
      where: {
        regime: period.regime,
        status: AcademicPeriodStatus.ACTIVE,
        isActive: true,
        id: { not: id },
      },
      select: { id: true, name: true, startDate: true, endDate: true },
    });

    assertNoOverlappingActivePeriod(
      { startDate: period.startDate, endDate: period.endDate },
      otherActive,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      const deactivated = await tx.academicPeriod.updateMany({
        where: {
          regime: period.regime,
          status: AcademicPeriodStatus.ACTIVE,
          isActive: true,
          id: { not: id },
        },
        data: {
          status: AcademicPeriodStatus.CLOSED,
          isActive: false,
        },
      });

      if (deactivated.count > 0) {
        this.logger.log({
          context: ACADEMIC_PERIODS_CONTEXT,
          event: 'PERIOD_AUTO_DEACTIVATED',
          message: 'Other active periods in the same regime were closed',
          metadata: {
            regime: period.regime,
            deactivatedCount: deactivated.count,
            activatedPeriodId: id,
          },
        });
      }

      return tx.academicPeriod.update({
        where: { id },
        data: {
          status: AcademicPeriodStatus.ACTIVE,
          isActive: true,
        },
        include: academicPeriodWithTermsInclude,
      });
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_ACTIVATED',
      message: 'Academic period activated',
      metadata: { periodId: id, regime: period.regime },
    });

    return toAcademicPeriodResponseDto(updated, true);
  }

  async deactivate(id: string): Promise<AcademicPeriodResponseDto> {
    const period = await this.findPeriodOrThrow(id);

    if (period.status !== AcademicPeriodStatus.ACTIVE) {
      throw new BadRequestException('Only active periods can be deactivated');
    }

    const updated = await this.prisma.academicPeriod.update({
      where: { id },
      data: {
        status: AcademicPeriodStatus.CLOSED,
        isActive: false,
      },
      include: academicPeriodWithTermsInclude,
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_DEACTIVATED',
      message: 'Academic period deactivated',
      metadata: { periodId: id },
    });

    return toAcademicPeriodResponseDto(updated, true);
  }

  async archive(id: string): Promise<AcademicPeriodResponseDto> {
    const period = await this.findPeriodOrThrow(id);

    if (period.status === AcademicPeriodStatus.ACTIVE) {
      throw new BadRequestException('Deactivate the period before archiving');
    }

    const updated = await this.prisma.academicPeriod.update({
      where: { id },
      data: {
        status: AcademicPeriodStatus.ARCHIVED,
        isActive: false,
      },
      include: academicPeriodWithTermsInclude,
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'PERIOD_ARCHIVED',
      message: 'Academic period archived',
      metadata: { periodId: id },
    });

    return toAcademicPeriodResponseDto(updated, true);
  }

  async getContext(
    actor: AuthenticatedUser,
  ): Promise<AcademicPeriodContextResponseDto> {
    const institutionId = await resolveActorInstitutionId(this.prisma, actor);

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: actor.id },
      select: { selectedAcademicPeriodId: true },
    });

    const activeByRegime = await Promise.all(
      ([AcademicRegime.COSTA_GALAPAGOS, AcademicRegime.SIERRA_AMAZONIA] as const).map(
        async (regime) => {
          const period = await this.findActiveByRegime(regime);
          return { regime, period };
        },
      ),
    );

    let selectedPeriod: AcademicPeriodResponseDto | null = null;

    if (user.selectedAcademicPeriodId) {
      const period = await this.prisma.academicPeriod.findUnique({
        where: { id: user.selectedAcademicPeriodId },
        include: academicPeriodWithTermsInclude,
      });

      if (period) {
        try {
          await assertActorCanAccessPeriod(this.prisma, actor, period);
          selectedPeriod = toAcademicPeriodResponseDto(period, true);
        } catch {
          selectedPeriod = null;
        }
      }
    }

    const effectivePeriod =
      selectedPeriod ??
      (await this.resolveDefaultPeriod(actor, institutionId, activeByRegime));

    const institutionRegime = institutionId
      ? await resolveInstitutionAcademicRegime(this.prisma, institutionId)
      : undefined;

    return {
      selectedPeriod,
      effectivePeriod,
      activeByRegime,
      institutionId,
      institutionRegime: institutionRegime ?? undefined,
    };
  }

  async setSelectedPeriod(
    actor: AuthenticatedUser,
    dto: SetSelectedAcademicPeriodDto,
  ): Promise<AcademicPeriodContextResponseDto> {
    if (!RoleUtils.canSelectAcademicPeriod(actor.role)) {
      throw new ForbiddenException(
        'Your role cannot select an academic period context',
      );
    }

    const period = await this.findPeriodOrThrow(dto.academicPeriodId, true);
    await assertActorCanAccessPeriod(this.prisma, actor, period);

    await this.prisma.user.update({
      where: { id: actor.id },
      data: { selectedAcademicPeriodId: period.id },
    });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'ACADEMIC_PERIOD_SELECTED',
      message: 'User selected academic period context',
      metadata: {
        userId: actor.id,
        periodId: period.id,
        regime: period.regime,
      },
    });

    return this.getContext(actor);
  }

  private async resolveDefaultPeriod(
    actor: AuthenticatedUser,
    institutionId: string | undefined,
    activeByRegime: AcademicPeriodContextResponseDto['activeByRegime'],
  ): Promise<AcademicPeriodResponseDto | null> {
    if (institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { activeAcademicPeriodId: true, regime: true },
      });

      if (institution?.activeAcademicPeriodId) {
        const period = await this.prisma.academicPeriod.findUnique({
          where: { id: institution.activeAcademicPeriodId },
          include: academicPeriodWithTermsInclude,
        });
        if (period) {
          return toAcademicPeriodResponseDto(period, true);
        }
      }

      if (institution?.regime) {
        const match = activeByRegime.find((r) => r.regime === institution.regime);
        return match?.period ?? null;
      }
    }

    return activeByRegime.find((r) => r.period)?.period ?? null;
  }

  private async buildListWhere(
    query: ListAcademicPeriodsQueryDto,
  ): Promise<Prisma.AcademicPeriodWhereInput> {
    const where: Prisma.AcademicPeriodWhereInput = {};

    let regimeFilter = query.regime;

    if (query.institutionId) {
      const institutionRegime = await resolveInstitutionAcademicRegime(
        this.prisma,
        query.institutionId,
      );

      if (institutionRegime) {
        regimeFilter = institutionRegime;
        where.OR = [
          { institutionId: null },
          { institutionId: query.institutionId },
        ];
      } else {
        where.institutionId = query.institutionId;
      }
    }

    if (regimeFilter) {
      where.regime = regimeFilter;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return where;
  }

  private async findPeriodOrThrow(id: string, includeTerms = false) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id },
      include: includeTerms ? academicPeriodWithTermsInclude : undefined,
    });

    if (!period) {
      throw new NotFoundException('Academic period not found');
    }

    return period;
  }
}
