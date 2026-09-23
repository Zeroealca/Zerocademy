import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  assertCompleteGradeScaleCoverage,
  decimalToNumber,
} from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT } from './constants';
import { CreateGradeScaleDto } from './dto/create-grade-scale.dto';
import { GradeScaleResponseDto } from './dto/grade-scale-response.dto';
import { UpdateGradeScaleDto } from './dto/update-grade-scale.dto';
import { ReplaceGradeScalesDto } from './dto/replace-grade-scales.dto';
import { toGradeScaleResponseDto } from './mappers/academic-evaluation.mapper';

@Injectable()
export class GradeScalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAllByScheme(schemeId: string): Promise<GradeScaleResponseDto[]> {
    await this.assertSchemeExists(schemeId);

    const scales = await this.prisma.gradeScale.findMany({
      where: { gradingSchemeId: schemeId },
      orderBy: { order: 'asc' },
    });

    return scales.map(toGradeScaleResponseDto);
  }

  async replaceAll(
    schemeId: string,
    dto: ReplaceGradeScalesDto,
    actor: AuthenticatedUser,
  ): Promise<GradeScaleResponseDto[]> {
    const scheme = await this.assertSchemeExists(schemeId);
    if (!scheme.institutionId) {
      throw new BadRequestException('Global grading scheme scales cannot be edited here');
    }
    await assertActorCanAccessInstitution(this.prisma, actor, scheme.institutionId);
    const scales = dto.scales.map((scale) => ({
      code: scale.code.trim().toUpperCase(),
      description: scale.description.trim(),
      minValue: scale.minValue,
      maxValue: scale.maxValue,
      order: scale.order,
    }));
    assertCompleteGradeScaleCoverage(
      scales,
      decimalToNumber(scheme.minScore),
      decimalToNumber(scheme.maxScore),
    );

    try {
      const saved = await this.prisma.$transaction(async (transaction) => {
        await transaction.gradeScale.deleteMany({ where: { gradingSchemeId: schemeId } });
        await transaction.gradeScale.createMany({
          data: scales.map((scale) => ({ ...scale, gradingSchemeId: schemeId })),
        });
        return transaction.gradeScale.findMany({
          where: { gradingSchemeId: schemeId },
          orderBy: { order: 'asc' },
        });
      });
      this.logger.log({
        context: ACADEMIC_EVALUATION_CONTEXT,
        event: 'GRADE_SCALES_REPLACED',
        message: 'Complete grade scale set saved',
        metadata: { schemeId, count: saved.length },
      });
      return saved.map(toGradeScaleResponseDto);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async create(
    schemeId: string,
    dto: CreateGradeScaleDto,
  ): Promise<GradeScaleResponseDto> {
    const scheme = await this.assertSchemeExists(schemeId);
    const existing = await this.prisma.gradeScale.findMany({
      where: { gradingSchemeId: schemeId },
    });

    const candidateScales = [
      ...existing.map((scale) => ({
        id: scale.id,
        code: scale.code,
        order: scale.order,
        minValue: decimalToNumber(scale.minValue),
        maxValue: decimalToNumber(scale.maxValue),
      })),
      {
        code: dto.code.trim().toUpperCase(),
        order: dto.order,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
      },
    ];

    assertCompleteGradeScaleCoverage(
      candidateScales,
      decimalToNumber(scheme.minScore),
      decimalToNumber(scheme.maxScore),
    );

    try {
      const scale = await this.prisma.gradeScale.create({
        data: {
          gradingSchemeId: schemeId,
          code: dto.code.trim().toUpperCase(),
          description: dto.description.trim(),
          minValue: dto.minValue,
          maxValue: dto.maxValue,
          order: dto.order,
        },
      });

      this.logger.log({
        context: ACADEMIC_EVALUATION_CONTEXT,
        event: 'GRADE_SCALE_CREATED',
        message: 'Grade scale created',
        metadata: { schemeId, scaleId: scale.id },
      });

      return toGradeScaleResponseDto(scale);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(
    schemeId: string,
    scaleId: string,
    dto: UpdateGradeScaleDto,
  ): Promise<GradeScaleResponseDto> {
    const scheme = await this.assertSchemeExists(schemeId);
    const existing = await this.findScaleOrThrow(schemeId, scaleId);
    const siblings = await this.prisma.gradeScale.findMany({
      where: { gradingSchemeId: schemeId, NOT: { id: scaleId } },
    });

    const candidateScales = [
      ...siblings.map((scale) => ({
        id: scale.id,
        code: scale.code,
        order: scale.order,
        minValue: decimalToNumber(scale.minValue),
        maxValue: decimalToNumber(scale.maxValue),
      })),
      {
        id: scaleId,
        code: (dto.code ?? existing.code).trim().toUpperCase(),
        order: dto.order ?? existing.order,
        minValue: dto.minValue ?? decimalToNumber(existing.minValue),
        maxValue: dto.maxValue ?? decimalToNumber(existing.maxValue),
      },
    ];

    assertCompleteGradeScaleCoverage(
      candidateScales,
      decimalToNumber(scheme.minScore),
      decimalToNumber(scheme.maxScore),
    );

    const scale = await this.prisma.gradeScale.update({
      where: { id: scaleId },
      data: {
        ...(dto.code !== undefined
          ? { code: dto.code.trim().toUpperCase() }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.minValue !== undefined ? { minValue: dto.minValue } : {}),
        ...(dto.maxValue !== undefined ? { maxValue: dto.maxValue } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADE_SCALE_UPDATED',
      message: 'Grade scale updated',
      metadata: { schemeId, scaleId },
    });

    return toGradeScaleResponseDto(scale);
  }

  async remove(schemeId: string, scaleId: string): Promise<void> {
    const scheme = await this.assertSchemeExists(schemeId);
    await this.findScaleOrThrow(schemeId, scaleId);
    const remaining = await this.prisma.gradeScale.findMany({
      where: { gradingSchemeId: schemeId, NOT: { id: scaleId } },
    });
    assertCompleteGradeScaleCoverage(
      remaining.map((scale) => ({
        code: scale.code,
        order: scale.order,
        minValue: decimalToNumber(scale.minValue),
        maxValue: decimalToNumber(scale.maxValue),
      })),
      decimalToNumber(scheme.minScore),
      decimalToNumber(scheme.maxScore),
    );
    await this.prisma.gradeScale.delete({ where: { id: scaleId } });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'GRADE_SCALE_DELETED',
      message: 'Grade scale deleted',
      metadata: { schemeId, scaleId },
    });
  }

  private async assertSchemeExists(schemeId: string) {
    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id: schemeId },
    });

    if (!scheme) {
      throw new NotFoundException('Grading scheme not found');
    }

    return scheme;
  }

  private async findScaleOrThrow(schemeId: string, scaleId: string) {
    const scale = await this.prisma.gradeScale.findFirst({
      where: { id: scaleId, gradingSchemeId: schemeId },
    });

    if (!scale) {
      throw new NotFoundException('Grade scale not found');
    }

    return scale;
  }

  private mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Grade scale code or order already exists');
    }
  }
}
