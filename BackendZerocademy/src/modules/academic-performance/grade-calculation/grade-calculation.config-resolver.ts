import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AppLoggerService } from '../../../common/logger/app-logger.service';
import { decimalToNumber } from '../../academic-evaluation/academic-evaluation.validation';
import { ACADEMIC_PERFORMANCE_CONTEXT } from '../constants';
import type {
  AcademicTermWeight,
  AssessmentCategoryWeight,
  CalculationInstitutionConfig,
} from './grade-calculation.types';

export interface ResolvedCalculationConfig {
  institution: CalculationInstitutionConfig;
  categories: AssessmentCategoryWeight[];
  academicTerms: AcademicTermWeight[];
}

export async function resolveCalculationConfig(
  prisma: PrismaService,
  logger: AppLoggerService,
  institutionId: string,
  academicPeriodId: string,
): Promise<ResolvedCalculationConfig> {
  const config = await prisma.institutionAcademicConfiguration.findUnique({
    where: { institutionId },
    include: { gradingScheme: true },
  });

  if (!config?.gradingScheme.isActive) {
    logger.warn({
      context: ACADEMIC_PERFORMANCE_CONTEXT,
      event: 'CALCULATION_CONFIG_INVALID',
      message: 'Calculation config missing or inactive scheme',
      metadata: { institutionId },
    });

    throw new BadRequestException(
      'Institution academic evaluation configuration is not set',
    );
  }

  const categories = await prisma.assessmentCategory.findMany({
    where: { institutionId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, weight: true },
  });

  const calendarTerms = await prisma.academicTerm.findMany({
    where: { academicPeriodId },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, order: true },
  });

  const evaluationTerms = await prisma.evaluationTerm.findMany({
    where: { institutionId, academicPeriodId, isActive: true },
    orderBy: { order: 'asc' },
    select: { order: true, weight: true },
  });

  const evaluationWeightByOrder = new Map(
    evaluationTerms.map((term) => [term.order, decimalToNumber(term.weight)]),
  );

  const academicTerms: AcademicTermWeight[] = calendarTerms.map((term) => {
    const configuredWeight = evaluationWeightByOrder.get(term.order);

    if (configuredWeight === undefined && evaluationTerms.length > 0) {
      logger.warn({
        context: ACADEMIC_PERFORMANCE_CONTEXT,
        event: 'WEIGHT_MAPPING_INCONSISTENCY',
        message: 'Academic term missing evaluation term weight mapping',
        metadata: {
          institutionId,
          academicPeriodId,
          academicTermOrder: term.order,
        },
      });
    }

    const fallbackWeight =
      calendarTerms.length > 0 ? 100 / calendarTerms.length : 0;

    return {
      academicTermId: term.id,
      academicTermName: term.name,
      order: term.order,
      weight: configuredWeight ?? fallbackWeight,
    };
  });

  if (categories.length === 0) {
    logger.warn({
      context: ACADEMIC_PERFORMANCE_CONTEXT,
      event: 'CALCULATION_CONFIG_INCOMPLETE',
      message: 'No active assessment categories for institution',
      metadata: { institutionId },
    });
  }

  return {
    institution: {
      institutionId,
      gradingSchemeId: config.gradingSchemeId,
      schemeMinScore: decimalToNumber(config.gradingScheme.minScore),
      schemeMaxScore: decimalToNumber(config.gradingScheme.maxScore),
      passingScore: decimalToNumber(config.gradingScheme.passingScore),
      decimalPlaces: config.decimalPlaces,
      roundingStrategy: config.roundingStrategy,
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      weight: decimalToNumber(category.weight),
    })),
    academicTerms,
  };
}
