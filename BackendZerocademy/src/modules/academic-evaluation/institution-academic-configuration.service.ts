import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertAcademicPeriodForInstitution,
  assertGradingSchemeAccessible,
  assertInstitutionExistsAndActive,
  assertValidDecimalPlaces,
  decimalToNumber,
} from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT } from './constants';
import { EvaluationConfigPreviewDto } from './dto/evaluation-config-preview.dto';
import { InstitutionAcademicConfigurationResponseDto } from './dto/institution-academic-configuration-response.dto';
import { UpsertInstitutionAcademicConfigurationDto } from './dto/upsert-institution-academic-configuration.dto';
import {
  toAssessmentCategoryResponseDto,
  toEvaluationTermResponseDto,
  toGradingSchemeResponseDto,
  toInstitutionAcademicConfigurationResponseDto,
} from './mappers/academic-evaluation.mapper';

const configInclude = {
  gradingScheme: {
    include: {
      gradeScales: { orderBy: { order: 'asc' as const } },
    },
  },
} satisfies Prisma.InstitutionAcademicConfigurationInclude;

@Injectable()
export class InstitutionAcademicConfigurationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findByInstitution(
    institutionId: string,
  ): Promise<InstitutionAcademicConfigurationResponseDto | null> {
    await assertInstitutionExistsAndActive(this.prisma, institutionId);

    const config = await this.prisma.institutionAcademicConfiguration.findUnique(
      {
        where: { institutionId },
        include: configInclude,
      },
    );

    if (!config) {
      return null;
    }

    return toInstitutionAcademicConfigurationResponseDto(config);
  }

  async upsert(
    institutionId: string,
    dto: UpsertInstitutionAcademicConfigurationDto,
  ): Promise<InstitutionAcademicConfigurationResponseDto> {
    await assertInstitutionExistsAndActive(this.prisma, institutionId);
    await assertGradingSchemeAccessible(
      this.prisma,
      dto.gradingSchemeId,
      institutionId,
    );

    if (dto.activeAcademicPeriodId) {
      await assertAcademicPeriodForInstitution(
        this.prisma,
        institutionId,
        dto.activeAcademicPeriodId,
      );
    }

    const decimalPlaces = dto.decimalPlaces ?? 2;
    assertValidDecimalPlaces(decimalPlaces);

    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id: dto.gradingSchemeId },
    });

    if (!scheme?.isActive) {
      throw new BadRequestException('Selected grading scheme is not active');
    }

    const config = await this.prisma.institutionAcademicConfiguration.upsert({
      where: { institutionId },
      create: {
        institutionId,
        gradingSchemeId: dto.gradingSchemeId,
        activeAcademicPeriodId: dto.activeAcademicPeriodId ?? null,
        roundingStrategy: dto.roundingStrategy,
        decimalPlaces,
      },
      update: {
        gradingSchemeId: dto.gradingSchemeId,
        ...(dto.activeAcademicPeriodId !== undefined
          ? { activeAcademicPeriodId: dto.activeAcademicPeriodId }
          : {}),
        ...(dto.roundingStrategy !== undefined
          ? { roundingStrategy: dto.roundingStrategy }
          : {}),
        decimalPlaces,
      },
      include: configInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'INSTITUTION_CONFIG_UPSERTED',
      message: 'Institution academic configuration saved',
      metadata: {
        institutionId,
        configId: config.id,
        gradingSchemeId: dto.gradingSchemeId,
      },
    });

    return toInstitutionAcademicConfigurationResponseDto(config);
  }

  async getPreview(
    institutionId: string,
    academicPeriodId?: string,
  ): Promise<EvaluationConfigPreviewDto> {
    await assertInstitutionExistsAndActive(this.prisma, institutionId);

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { activeAcademicPeriodId: true },
    });

    const resolvedPeriodId =
      academicPeriodId ??
      institution?.activeAcademicPeriodId ??
      undefined;

    const config = await this.prisma.institutionAcademicConfiguration.findUnique(
      {
        where: { institutionId },
        include: configInclude,
      },
    );

    const evaluationTerms = resolvedPeriodId
      ? await this.prisma.evaluationTerm.findMany({
          where: {
            institutionId,
            academicPeriodId: resolvedPeriodId,
            isActive: true,
          },
          orderBy: { order: 'asc' },
        })
      : [];

    const assessmentCategories = await this.prisma.assessmentCategory.findMany({
      where: { institutionId, isActive: true },
      orderBy: { name: 'asc' },
    });

    const evaluationTermWeightTotal = evaluationTerms.reduce<number>(
      (sum, term) => sum + decimalToNumber(term.weight),
      0,
    );
    const assessmentCategoryWeightTotal = assessmentCategories.reduce<number>(
      (sum, category) => sum + decimalToNumber(category.weight),
      0,
    );

    return {
      configuration: config
        ? toInstitutionAcademicConfigurationResponseDto(config)
        : null,
      activeGradingScheme: config?.gradingScheme
        ? toGradingSchemeResponseDto(config.gradingScheme)
        : null,
      evaluationTerms: evaluationTerms.map(toEvaluationTermResponseDto),
      assessmentCategories: assessmentCategories.map(
        toAssessmentCategoryResponseDto,
      ),
      evaluationTermWeightTotal,
      assessmentCategoryWeightTotal,
    };
  }
}
