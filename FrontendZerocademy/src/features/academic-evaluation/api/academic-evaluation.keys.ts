import type {
  AssessmentCategoriesFilters,
  EvaluationTermsFilters,
  GradingSchemesFilters,
} from "@/features/academic-evaluation/types";

export const academicEvaluationKeys = {
  all: ["academic-evaluation"] as const,
  gradingSchemes: {
    all: () => [...academicEvaluationKeys.all, "grading-schemes"] as const,
    list: (filters: GradingSchemesFilters) =>
      [...academicEvaluationKeys.gradingSchemes.all(), "list", filters] as const,
    detail: (id: string) =>
      [...academicEvaluationKeys.gradingSchemes.all(), "detail", id] as const,
    scales: (schemeId: string) =>
      [...academicEvaluationKeys.gradingSchemes.all(), "scales", schemeId] as const,
  },
  evaluationTerms: {
    all: () => [...academicEvaluationKeys.all, "evaluation-terms"] as const,
    list: (filters: EvaluationTermsFilters) =>
      [...academicEvaluationKeys.evaluationTerms.all(), "list", filters] as const,
    detail: (id: string) =>
      [...academicEvaluationKeys.evaluationTerms.all(), "detail", id] as const,
  },
  assessmentCategories: {
    all: () => [...academicEvaluationKeys.all, "assessment-categories"] as const,
    list: (filters: AssessmentCategoriesFilters) =>
      [
        ...academicEvaluationKeys.assessmentCategories.all(),
        "list",
        filters,
      ] as const,
    detail: (id: string) =>
      [
        ...academicEvaluationKeys.assessmentCategories.all(),
        "detail",
        id,
      ] as const,
  },
  configuration: {
    all: () => [...academicEvaluationKeys.all, "configuration"] as const,
    byInstitution: (institutionId: string) =>
      [
        ...academicEvaluationKeys.configuration.all(),
        institutionId,
      ] as const,
    preview: (institutionId: string, academicPeriodId?: string) =>
      [
        ...academicEvaluationKeys.configuration.all(),
        "preview",
        institutionId,
        academicPeriodId ?? "default",
      ] as const,
  },
  platform: {
    all: () => [...academicEvaluationKeys.all, "platform"] as const,
    defaults: () =>
      [...academicEvaluationKeys.platform.all(), "defaults"] as const,
  },
};
