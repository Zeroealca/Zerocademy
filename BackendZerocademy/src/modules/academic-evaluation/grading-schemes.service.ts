import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertInstitutionExistsAndActive,
  assertValidDecimalPlaces,
  assertValidGradingRange,
} from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT } from './constants';
import { CreateGradingSchemeDto } from './dto/create-grading-scheme.dto';
import { GradingSchemeListResponseDto } from './dto/grading-scheme-list-response.dto';
import { GradingSchemeResponseDto } from './dto/grading-scheme-response.dto';
import { ListGradingSchemesQueryDto } from './dto/list-grading-schemes-query.dto';
import { UpdateGradingSchemeDto } from './dto/update-grading-scheme.dto';
import { toGradingSchemeResponseDto } from './mappers/academic-evaluation.mapper';

const schemeWithScalesInclude = {
  gradeScales: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.GradingSchemeInclude;

@Injectable()
export class GradingSchemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListGradingSchemesQueryDto,
  ): Promise<GradingSchemeListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, schemes] = await this.prisma.$transaction([
      this.prisma.gradingScheme.count({ where }),
      this.prisma.gradingScheme.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        include: schemeWithScalesInclude,
      }),
    ]);

    return {
      data: schemes.map(toGradingSchemeResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<GradingSchemeResponseDto> {
    const scheme = await this.findSchemeOrThrow(id);
    return toGradingSchemeResponseDto(scheme);
  }

  async create(dto: CreateGradingSchemeDto): Promise<GradingSchemeResponseDto> {
    const institutionId = dto.institutionId ?? null;

    if (institutionId) {
      await assertInstitutionExistsAndActive(this.prisma, institutionId);
    }

    const decimalPlaces = dto.decimalPlaces ?? 2;
    assertValidGradingRange(dto.minScore, dto.maxScore, dto.passingScore);
    assertValidDecimalPlaces(decimalPlaces);

    if (dto.isDefault) {
      await this.clearDefaultFlag(institutionId);
    }

    const scheme = await this.prisma.gradingScheme.create({
      data: {
        institutionId,
        name: dto.name.trim(),
        minScore: dto.minScore,
        maxScore: dto.maxScore,
        passingScore: dto.passingScore,
        decimalPlaces,
        isDefault: dto.isDefault ?? false,
        isActive: true,
      },
      include: schemeWithScalesInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADING_SCHEME_CREATED',
      message: 'Grading scheme created',
      metadata: { schemeId: scheme.id, institutionId },
    });

    return toGradingSchemeResponseDto(scheme);
  }

  async updatePlatformScheme(
    id: string,
    dto: UpdateGradingSchemeDto,
  ): Promise<GradingSchemeResponseDto> {
    const existing = await this.findSchemeOrThrow(id);

    if (existing.institutionId !== null) {
      throw new BadRequestException(
        'Only global platform grading schemes can be updated via this route',
      );
    }

    return this.update(id, dto);
  }

  async update(
    id: string,
    dto: UpdateGradingSchemeDto,
  ): Promise<GradingSchemeResponseDto> {
    const existing = await this.findSchemeOrThrow(id);

    if (existing.institutionId === null) {
      throw new BadRequestException(
        'Global grading schemes must be updated via the platform route',
      );
    }
    const minScore = dto.minScore ?? Number(existing.minScore);
    const maxScore = dto.maxScore ?? Number(existing.maxScore);
    const passingScore = dto.passingScore ?? Number(existing.passingScore);
    const decimalPlaces = dto.decimalPlaces ?? existing.decimalPlaces;

    assertValidGradingRange(minScore, maxScore, passingScore);
    assertValidDecimalPlaces(decimalPlaces);

    if (dto.isDefault) {
      await this.clearDefaultFlag(existing.institutionId, id);
    }

    const scheme = await this.prisma.gradingScheme.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.minScore !== undefined ? { minScore: dto.minScore } : {}),
        ...(dto.maxScore !== undefined ? { maxScore: dto.maxScore } : {}),
        ...(dto.passingScore !== undefined
          ? { passingScore: dto.passingScore }
          : {}),
        ...(dto.decimalPlaces !== undefined
          ? { decimalPlaces: dto.decimalPlaces }
          : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
      include: schemeWithScalesInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADING_SCHEME_UPDATED',
      message: 'Grading scheme updated',
      metadata: { schemeId: scheme.id },
    });

    return toGradingSchemeResponseDto(scheme);
  }

  async activate(id: string): Promise<GradingSchemeResponseDto> {
    const scheme = await this.prisma.gradingScheme.update({
      where: { id },
      data: { isActive: true },
      include: schemeWithScalesInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADING_SCHEME_ACTIVATED',
      message: 'Grading scheme activated',
      metadata: { schemeId: id },
    });

    return toGradingSchemeResponseDto(scheme);
  }

  async deactivate(id: string): Promise<GradingSchemeResponseDto> {
    const inUse = await this.prisma.institutionAcademicConfiguration.count({
      where: { gradingSchemeId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Cannot deactivate a grading scheme linked to an institution configuration',
      );
    }

    const scheme = await this.prisma.gradingScheme.update({
      where: { id },
      data: { isActive: false },
      include: schemeWithScalesInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADING_SCHEME_DEACTIVATED',
      message: 'Grading scheme deactivated',
      metadata: { schemeId: id },
    });

    return toGradingSchemeResponseDto(scheme);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findSchemeOrThrow(id);

    const inUse = await this.prisma.institutionAcademicConfiguration.count({
      where: { gradingSchemeId: id },
    });

    if (inUse > 0) {
      throw new BadRequestException(
        'Cannot delete a grading scheme referenced by institution configuration',
      );
    }

    await this.prisma.gradingScheme.delete({ where: { id: existing.id } });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADING_SCHEME_DELETED',
      message: 'Grading scheme deleted',
      metadata: { schemeId: id },
    });
  }

  private buildListWhere(
    query: ListGradingSchemesQueryDto,
  ): Prisma.GradingSchemeWhereInput {
    const where: Prisma.GradingSchemeWhereInput = {};

    if (query.institutionId) {
      where.OR = [
        { institutionId: query.institutionId },
        { institutionId: null },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isDefault !== undefined) {
      where.isDefault = query.isDefault;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.name = { contains: term, mode: 'insensitive' };
    }

    return where;
  }

  private async clearDefaultFlag(
    institutionId: string | null,
    excludeId?: string,
  ): Promise<void> {
    await this.prisma.gradingScheme.updateMany({
      where: {
        institutionId,
        isDefault: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      data: { isDefault: false },
    });
  }

  private async findSchemeOrThrow(id: string) {
    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id },
      include: schemeWithScalesInclude,
    });

    if (!scheme) {
      throw new NotFoundException('Grading scheme not found');
    }

    return scheme;
  }

  mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Grading scheme constraint violation');
    }
  }
}
