import {
  AssessmentCategory,
  AssessmentCategoryTemplate,
  EvaluationTerm,
  EvaluationTermTemplate,
  GradeScale,
  GradingScheme,
  InstitutionAcademicConfiguration,
  PlatformAcademicEvaluationConfig,
  RoundingStrategy,
} from '@prisma/client';
import { decimalToNumber } from '../academic-evaluation.validation';
import { AssessmentCategoryResponseDto } from '../dto/assessment-category-response.dto';
import { AssessmentCategoryTemplateResponseDto } from '../dto/assessment-category-template-response.dto';
import { EvaluationTermTemplateResponseDto } from '../dto/evaluation-term-template-response.dto';
import { PlatformAcademicEvaluationResponseDto } from '../dto/platform-academic-evaluation-response.dto';
import { EvaluationTermResponseDto } from '../dto/evaluation-term-response.dto';
import { GradeScaleResponseDto } from '../dto/grade-scale-response.dto';
import { GradingSchemeResponseDto } from '../dto/grading-scheme-response.dto';
import { InstitutionAcademicConfigurationResponseDto } from '../dto/institution-academic-configuration-response.dto';

export function toGradingSchemeResponseDto(
  scheme: GradingScheme & { gradeScales?: GradeScale[] },
): GradingSchemeResponseDto {
  return {
    id: scheme.id,
    institutionId: scheme.institutionId,
    name: scheme.name,
    minScore: decimalToNumber(scheme.minScore),
    maxScore: decimalToNumber(scheme.maxScore),
    passingScore: decimalToNumber(scheme.passingScore),
    decimalPlaces: scheme.decimalPlaces,
    isDefault: scheme.isDefault,
    isActive: scheme.isActive,
    gradeScales: scheme.gradeScales
      ? scheme.gradeScales.map(toGradeScaleResponseDto)
      : undefined,
    createdAt: scheme.createdAt.toISOString(),
    updatedAt: scheme.updatedAt.toISOString(),
  };
}

export function toGradeScaleResponseDto(scale: GradeScale): GradeScaleResponseDto {
  return {
    id: scale.id,
    gradingSchemeId: scale.gradingSchemeId,
    code: scale.code,
    description: scale.description,
    minValue: decimalToNumber(scale.minValue),
    maxValue: decimalToNumber(scale.maxValue),
    order: scale.order,
    createdAt: scale.createdAt.toISOString(),
    updatedAt: scale.updatedAt.toISOString(),
  };
}

export function toEvaluationTermResponseDto(
  term: EvaluationTerm,
): EvaluationTermResponseDto {
  return {
    id: term.id,
    institutionId: term.institutionId,
    academicPeriodId: term.academicPeriodId,
    name: term.name,
    order: term.order,
    weight: decimalToNumber(term.weight),
    startDate: term.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: term.endDate?.toISOString().slice(0, 10) ?? null,
    isActive: term.isActive,
    createdAt: term.createdAt.toISOString(),
    updatedAt: term.updatedAt.toISOString(),
  };
}

export function toAssessmentCategoryResponseDto(
  category: AssessmentCategory,
): AssessmentCategoryResponseDto {
  return {
    id: category.id,
    institutionId: category.institutionId,
    name: category.name,
    weight: decimalToNumber(category.weight),
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toAssessmentCategoryTemplateResponseDto(
  template: AssessmentCategoryTemplate,
): AssessmentCategoryTemplateResponseDto {
  return {
    id: template.id,
    name: template.name,
    weight: decimalToNumber(template.weight),
    description: template.description,
    order: template.order,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toEvaluationTermTemplateResponseDto(
  template: EvaluationTermTemplate,
): EvaluationTermTemplateResponseDto {
  return {
    id: template.id,
    name: template.name,
    order: template.order,
    weight: decimalToNumber(template.weight),
    description: template.description,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toPlatformAcademicEvaluationResponseDto(
  config: PlatformAcademicEvaluationConfig & {
    gradingScheme: GradingScheme & { gradeScales?: GradeScale[] };
    assessmentCategoryTemplates?: AssessmentCategoryTemplate[];
    evaluationTermTemplates?: EvaluationTermTemplate[];
  },
): PlatformAcademicEvaluationResponseDto {
  return {
    id: config.id,
    gradingSchemeId: config.gradingSchemeId,
    roundingStrategy: config.roundingStrategy,
    decimalPlaces: config.decimalPlaces,
    gradingScheme: toGradingSchemeResponseDto(config.gradingScheme),
    assessmentCategoryTemplates: (config.assessmentCategoryTemplates ?? []).map(
      toAssessmentCategoryTemplateResponseDto,
    ),
    evaluationTermTemplates: (config.evaluationTermTemplates ?? []).map(
      toEvaluationTermTemplateResponseDto,
    ),
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function toInstitutionAcademicConfigurationResponseDto(
  config: InstitutionAcademicConfiguration & {
    gradingScheme?: GradingScheme & { gradeScales?: GradeScale[] };
  },
): InstitutionAcademicConfigurationResponseDto {
  return {
    id: config.id,
    institutionId: config.institutionId,
    gradingSchemeId: config.gradingSchemeId,
    activeAcademicPeriodId: config.activeAcademicPeriodId,
    roundingStrategy: config.roundingStrategy as RoundingStrategy,
    decimalPlaces: config.decimalPlaces,
    gradingScheme: config.gradingScheme
      ? toGradingSchemeResponseDto(config.gradingScheme)
      : undefined,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  };
}
