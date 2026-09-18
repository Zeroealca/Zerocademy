import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { assertInstitutionExistsAndActive } from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT, ECUADOR_DEFAULT_SCHEME_NAME, ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES } from './constants';
import { GradingSchemeResponseDto } from './dto/grading-scheme-response.dto';
import { InstitutionAcademicConfigurationResponseDto } from './dto/institution-academic-configuration-response.dto';
import { toGradingSchemeResponseDto } from './mappers/academic-evaluation.mapper';
import { InstitutionAcademicConfigurationService } from './institution-academic-configuration.service';
import { PlatformAcademicEvaluationService } from './platform-academic-evaluation.service';

@Injectable()
export class EcuadorDefaultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly platformService: PlatformAcademicEvaluationService,
    private readonly configurationService: InstitutionAcademicConfigurationService,
  ) {}

  async initializeGlobalTemplate(): Promise<GradingSchemeResponseDto> {
    const platform = await this.platformService.initializeEcuadorPlatformDefaults();
    return platform.gradingScheme;
  }

  async initializeForInstitution(
    institutionId: string,
  ): Promise<InstitutionAcademicConfigurationResponseDto> {
    await assertInstitutionExistsAndActive(this.prisma, institutionId);

    const platform =
      (await this.platformService.getPlatformDefaults()) ??
      (await this.platformService.initializeEcuadorPlatformDefaults());

    const institutionScheme = await this.ensureInstitutionGradingScheme(
      institutionId,
      platform.gradingSchemeId,
    );

    await this.copyCategoryTemplatesToInstitution(institutionId);
    await this.copyTermTemplatesToInstitution(institutionId);

    const institution = await this.prisma.institution.findUniqueOrThrow({
      where: { id: institutionId },
      select: { activeAcademicPeriodId: true },
    });

    const config = await this.configurationService.upsert(institutionId, {
      gradingSchemeId: institutionScheme.id,
      activeAcademicPeriodId: institution.activeAcademicPeriodId ?? undefined,
      roundingStrategy: platform.roundingStrategy,
      decimalPlaces: platform.decimalPlaces,
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'INSTITUTION_PLATFORM_DEFAULTS_APPLIED',
      message: 'Platform evaluation defaults applied to institution',
      metadata: { institutionId, schemeId: institutionScheme.id },
    });

    return config;
  }

  private async ensureInstitutionGradingScheme(
    institutionId: string,
    platformSchemeId: string,
  ) {
    const existing = await this.prisma.gradingScheme.findFirst({
      where: { institutionId, name: ECUADOR_DEFAULT_SCHEME_NAME },
      include: { gradeScales: { orderBy: { order: 'asc' } } },
    });

    if (existing) {
      return existing;
    }

    const platformScheme = await this.prisma.gradingScheme.findUniqueOrThrow({
      where: { id: platformSchemeId },
      include: { gradeScales: { orderBy: { order: 'asc' } } },
    });

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.gradingScheme.create({
        data: {
          institutionId,
          name: platformScheme.name,
          minScore: platformScheme.minScore,
          maxScore: platformScheme.maxScore,
          passingScore: platformScheme.passingScore,
          decimalPlaces: platformScheme.decimalPlaces,
          isDefault: true,
          isActive: true,
        },
      });

      await tx.gradeScale.createMany({
        data: platformScheme.gradeScales.map((scale) => ({
          gradingSchemeId: created.id,
          code: scale.code,
          description: scale.description,
          minValue: scale.minValue,
          maxValue: scale.maxValue,
          order: scale.order,
        })),
      });

      return tx.gradingScheme.findUniqueOrThrow({
        where: { id: created.id },
        include: { gradeScales: { orderBy: { order: 'asc' } } },
      });
    });
  }

  private async copyCategoryTemplatesToInstitution(
    institutionId: string,
  ): Promise<void> {
    const templates = await this.prisma.assessmentCategoryTemplate.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    // Upgrade only the exact legacy Ecuador template when making a new copy.
    const isLegacyEcuador = templates.length === 2 &&
      templates.some((template) => template.name === 'Evaluación formativa' && template.weight.equals(40)) &&
      templates.some((template) => template.name === 'Evaluación sumativa' && template.weight.equals(60));

    for (const template of templates) {
      const exists = await this.prisma.assessmentCategory.findFirst({
        where: { institutionId, name: template.name },
      });

      if (exists) continue;

      await this.prisma.assessmentCategory.create({
        data: {
          institutionId,
          name: template.name,
          weight: isLegacyEcuador
            ? ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES.find((category) => category.name === template.name)!.weight
            : template.weight,
          description: template.description,
          isActive: true,
        },
      });
    }
  }

  private async copyTermTemplatesToInstitution(
    institutionId: string,
  ): Promise<void> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { activeAcademicPeriodId: true },
    });

    if (!institution?.activeAcademicPeriodId) {
      return;
    }

    const templates = await this.prisma.evaluationTermTemplate.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    for (const template of templates) {
      const exists = await this.prisma.evaluationTerm.findFirst({
        where: {
          institutionId,
          academicPeriodId: institution.activeAcademicPeriodId,
          name: template.name,
        },
      });

      if (exists) continue;

      await this.prisma.evaluationTerm.create({
        data: {
          institutionId,
          academicPeriodId: institution.activeAcademicPeriodId,
          name: template.name,
          order: template.order,
          weight: template.weight,
          isActive: true,
        },
      });
    }
  }
}
