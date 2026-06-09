import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoundingStrategy } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertValidDecimalPlaces,
  assertValidWeight,
  assertWeightsSumToTarget,
  decimalToNumber,
} from './academic-evaluation.validation';
import {
  ACADEMIC_EVALUATION_CONTEXT,
  ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES,
  ECUADOR_DEFAULT_GRADE_SCALES,
  ECUADOR_DEFAULT_SCHEME_NAME,
  ECUADOR_EVALUATION_TERM_TEMPLATES,
  ECUADOR_GRADING_SCHEME,
  PLATFORM_CONFIG_ID,
} from './constants';
import { AssessmentCategoryTemplateResponseDto } from './dto/assessment-category-template-response.dto';
import { CreateAssessmentCategoryTemplateDto } from './dto/create-assessment-category-template.dto';
import { CreateEvaluationTermTemplateDto } from './dto/create-evaluation-term-template.dto';
import { EvaluationTermTemplateResponseDto } from './dto/evaluation-term-template-response.dto';
import { PlatformAcademicEvaluationResponseDto } from './dto/platform-academic-evaluation-response.dto';
import { UpdateAssessmentCategoryTemplateDto } from './dto/update-assessment-category-template.dto';
import { UpdateEvaluationTermTemplateDto } from './dto/update-evaluation-term-template.dto';
import { UpsertPlatformAcademicEvaluationDto } from './dto/upsert-platform-academic-evaluation.dto';
import {
  toAssessmentCategoryTemplateResponseDto,
  toEvaluationTermTemplateResponseDto,
  toPlatformAcademicEvaluationResponseDto,
} from './mappers/academic-evaluation.mapper';

const platformInclude = {
  gradingScheme: {
    include: { gradeScales: { orderBy: { order: 'asc' as const } } },
  },
} satisfies Prisma.PlatformAcademicEvaluationConfigInclude;

@Injectable()
export class PlatformAcademicEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getPlatformDefaults(): Promise<PlatformAcademicEvaluationResponseDto | null> {
    const config = await this.prisma.platformAcademicEvaluationConfig.findUnique(
      {
        where: { id: PLATFORM_CONFIG_ID },
        include: platformInclude,
      },
    );

    if (!config) {
      return null;
    }

    const [assessmentCategoryTemplates, evaluationTermTemplates] =
      await Promise.all([
        this.prisma.assessmentCategoryTemplate.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
        this.prisma.evaluationTermTemplate.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
      ]);

    return toPlatformAcademicEvaluationResponseDto({
      ...config,
      assessmentCategoryTemplates,
      evaluationTermTemplates,
    });
  }

  async initializeEcuadorPlatformDefaults(): Promise<PlatformAcademicEvaluationResponseDto> {
    const scheme = await this.ensureGlobalGradingScheme();

    for (const template of ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES) {
      await this.prisma.assessmentCategoryTemplate.upsert({
        where: { name: template.name },
        create: {
          name: template.name,
          weight: template.weight,
          order: template.order,
          description: template.description,
          isActive: true,
        },
        update: {
          weight: template.weight,
          order: template.order,
          description: template.description,
          isActive: true,
        },
      });
    }

    for (const template of ECUADOR_EVALUATION_TERM_TEMPLATES) {
      await this.prisma.evaluationTermTemplate.upsert({
        where: { name: template.name },
        create: {
          name: template.name,
          weight: template.weight,
          order: template.order,
          description: template.description,
          isActive: true,
        },
        update: {
          weight: template.weight,
          order: template.order,
          description: template.description,
          isActive: true,
        },
      });
    }

    const config = await this.prisma.platformAcademicEvaluationConfig.upsert({
      where: { id: PLATFORM_CONFIG_ID },
      create: {
        id: PLATFORM_CONFIG_ID,
        gradingSchemeId: scheme.id,
        roundingStrategy: RoundingStrategy.ROUND_HALF_UP,
        decimalPlaces: ECUADOR_GRADING_SCHEME.decimalPlaces,
      },
      update: {
        gradingSchemeId: scheme.id,
        decimalPlaces: ECUADOR_GRADING_SCHEME.decimalPlaces,
      },
      include: platformInclude,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'PLATFORM_DEFAULTS_INITIALIZED',
      message: 'Platform Ecuador evaluation defaults initialized',
      metadata: { schemeId: scheme.id },
    });

    return this.getPlatformDefaultsOrThrow(config);
  }

  async upsertPlatformConfig(
    dto: UpsertPlatformAcademicEvaluationDto,
  ): Promise<PlatformAcademicEvaluationResponseDto> {
    const existing = await this.prisma.platformAcademicEvaluationConfig.findUnique(
      { where: { id: PLATFORM_CONFIG_ID } },
    );

    if (!existing) {
      throw new NotFoundException(
        'Platform evaluation defaults not initialized. Run initialize-ecuador-defaults first.',
      );
    }

    if (dto.gradingSchemeId) {
      const scheme = await this.prisma.gradingScheme.findFirst({
        where: { id: dto.gradingSchemeId, institutionId: null },
      });

      if (!scheme) {
        throw new BadRequestException('Grading scheme must be a global template');
      }
    }

    const decimalPlaces = dto.decimalPlaces ?? existing.decimalPlaces;
    assertValidDecimalPlaces(decimalPlaces);

    await this.prisma.platformAcademicEvaluationConfig.update({
      where: { id: PLATFORM_CONFIG_ID },
      data: {
        ...(dto.gradingSchemeId ? { gradingSchemeId: dto.gradingSchemeId } : {}),
        ...(dto.roundingStrategy ? { roundingStrategy: dto.roundingStrategy } : {}),
        decimalPlaces,
      },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'PLATFORM_CONFIG_UPDATED',
      message: 'Platform evaluation configuration updated',
    });

    return this.getPlatformDefaultsOrThrow();
  }

  async createCategoryTemplate(
    dto: CreateAssessmentCategoryTemplateDto,
  ): Promise<AssessmentCategoryTemplateResponseDto> {
    assertValidWeight(dto.weight, 'Assessment category template');

    try {
      const template = await this.prisma.assessmentCategoryTemplate.create({
        data: {
          name: dto.name.trim(),
          weight: dto.weight,
          order: dto.order,
          description: dto.description?.trim(),
          isActive: true,
        },
      });

      await this.validateCategoryTemplateWeights();

      return toAssessmentCategoryTemplateResponseDto(template);
    } catch (error) {
      this.mapTemplatePrismaError(error, 'Assessment category template');
      throw error;
    }
  }

  async updateCategoryTemplate(
    id: string,
    dto: UpdateAssessmentCategoryTemplateDto,
  ): Promise<AssessmentCategoryTemplateResponseDto> {
    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Assessment category template');
    }

    const template = await this.prisma.assessmentCategoryTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
      },
    });

    await this.validateCategoryTemplateWeights();

    return toAssessmentCategoryTemplateResponseDto(template);
  }

  async deleteCategoryTemplate(id: string): Promise<void> {
    await this.prisma.assessmentCategoryTemplate.delete({ where: { id } });
  }

  async createTermTemplate(
    dto: CreateEvaluationTermTemplateDto,
  ): Promise<EvaluationTermTemplateResponseDto> {
    assertValidWeight(dto.weight, 'Evaluation term template');

    try {
      const template = await this.prisma.evaluationTermTemplate.create({
        data: {
          name: dto.name.trim(),
          weight: dto.weight,
          order: dto.order,
          description: dto.description?.trim(),
          isActive: true,
        },
      });

      await this.validateTermTemplateWeights();

      return toEvaluationTermTemplateResponseDto(template);
    } catch (error) {
      this.mapTemplatePrismaError(error, 'Evaluation term template');
      throw error;
    }
  }

  async updateTermTemplate(
    id: string,
    dto: UpdateEvaluationTermTemplateDto,
  ): Promise<EvaluationTermTemplateResponseDto> {
    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Evaluation term template');
    }

    const template = await this.prisma.evaluationTermTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
      },
    });

    await this.validateTermTemplateWeights();

    return toEvaluationTermTemplateResponseDto(template);
  }

  async deleteTermTemplate(id: string): Promise<void> {
    await this.prisma.evaluationTermTemplate.delete({ where: { id } });
  }

  private async getPlatformDefaultsOrThrow(
    config?: Prisma.PlatformAcademicEvaluationConfigGetPayload<{
      include: typeof platformInclude;
    }>,
  ): Promise<PlatformAcademicEvaluationResponseDto> {
    const result = await this.getPlatformDefaults();

    if (!result) {
      throw new NotFoundException('Platform evaluation defaults not found');
    }

    return result;
  }

  private async ensureGlobalGradingScheme() {
    const existing = await this.prisma.gradingScheme.findFirst({
      where: {
        institutionId: null,
        name: ECUADOR_DEFAULT_SCHEME_NAME,
        isDefault: true,
      },
      include: { gradeScales: true },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.gradingScheme.create({
        data: {
          institutionId: null,
          name: ECUADOR_DEFAULT_SCHEME_NAME,
          ...ECUADOR_GRADING_SCHEME,
          isDefault: true,
          isActive: true,
        },
      });

      await tx.gradeScale.createMany({
        data: ECUADOR_DEFAULT_GRADE_SCALES.map((scale) => ({
          gradingSchemeId: created.id,
          ...scale,
        })),
      });

      return tx.gradingScheme.findUniqueOrThrow({
        where: { id: created.id },
        include: { gradeScales: true },
      });
    });
  }

  private async validateCategoryTemplateWeights(): Promise<void> {
    const templates = await this.prisma.assessmentCategoryTemplate.findMany({
      where: { isActive: true },
      select: { weight: true },
    });

    if (templates.length === 0) return;

    assertWeightsSumToTarget(
      templates.map((item) => decimalToNumber(item.weight)),
      'Assessment category template',
    );
  }

  private async validateTermTemplateWeights(): Promise<void> {
    const templates = await this.prisma.evaluationTermTemplate.findMany({
      where: { isActive: true },
      select: { weight: true },
    });

    if (templates.length === 0) return;

    assertWeightsSumToTarget(
      templates.map((item) => decimalToNumber(item.weight)),
      'Evaluation term template',
    );
  }

  private mapTemplatePrismaError(error: unknown, label: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(`${label} name or order already exists`);
    }
  }
}
