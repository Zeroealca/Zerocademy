import {
  BadRequestException,
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
import { ACADEMIC_PERIODS_CONTEXT } from './constants';
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
    const where = this.buildListWhere(query);
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

    const period = await this.prisma.academicPeriod.create({
      data: {
        name: dto.name.trim(),
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
      select: { startDate: true, endDate: true },
    });

    assertNoOverlappingActivePeriod(
      { startDate: period.startDate, endDate: period.endDate },
      otherActive,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.academicPeriod.updateMany({
        where: {
          regime: period.regime,
          status: AcademicPeriodStatus.ACTIVE,
          id: { not: id },
        },
        data: {
          status: AcademicPeriodStatus.CLOSED,
          isActive: false,
        },
      });

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

  private buildListWhere(
    query: ListAcademicPeriodsQueryDto,
  ): Prisma.AcademicPeriodWhereInput {
    const where: Prisma.AcademicPeriodWhereInput = {};

    if (query.regime) {
      where.regime = query.regime;
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
