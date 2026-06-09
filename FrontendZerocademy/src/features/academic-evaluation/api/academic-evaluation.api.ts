import { apiClient } from "@/lib/api-client";
import type {
  AssessmentCategoriesFilters,
  AssessmentCategoriesListResponse,
  AssessmentCategory,
  AssessmentCategoryTemplate,
  CreateAssessmentCategoryInput,
  CreateAssessmentCategoryTemplateInput,
  CreateEvaluationTermInput,
  CreateEvaluationTermTemplateInput,
  CreateGradeScaleInput,
  CreateGradingSchemeInput,
  EvaluationConfigPreview,
  EvaluationTerm,
  EvaluationTermTemplate,
  EvaluationTermsFilters,
  EvaluationTermsListResponse,
  GradeScale,
  GradingScheme,
  GradingSchemesFilters,
  GradingSchemesListResponse,
  InstitutionAcademicConfiguration,
  PlatformAcademicEvaluation,
  UpdateAssessmentCategoryInput,
  UpdateAssessmentCategoryTemplateInput,
  UpdateEvaluationTermInput,
  UpdateEvaluationTermTemplateInput,
  UpdateGradeScaleInput,
  UpdateGradingSchemeInput,
  UpsertInstitutionConfigurationInput,
  UpsertPlatformAcademicEvaluationInput,
} from "@/features/academic-evaluation/types";

function buildPaginationQuery(
  filters: object & { page: number; limit: number },
): string {
  const params = new URLSearchParams();
  const entries = Object.entries(filters as Record<string, unknown>);

  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  return params.toString();
}

export function fetchGradingSchemes(
  filters: GradingSchemesFilters,
): Promise<GradingSchemesListResponse> {
  const query = buildPaginationQuery(filters);
  return apiClient<GradingSchemesListResponse>(`/v1/grading-schemes?${query}`);
}

export function fetchGradingScheme(id: string): Promise<GradingScheme> {
  return apiClient<GradingScheme>(`/v1/grading-schemes/${id}`);
}

export function createGradingScheme(
  payload: CreateGradingSchemeInput,
): Promise<GradingScheme> {
  return apiClient<GradingScheme>("/v1/grading-schemes", {
    method: "POST",
    body: payload,
  });
}

export function updateGradingScheme(
  id: string,
  payload: UpdateGradingSchemeInput,
): Promise<GradingScheme> {
  return apiClient<GradingScheme>(`/v1/grading-schemes/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function updatePlatformGradingScheme(
  id: string,
  payload: UpdateGradingSchemeInput,
): Promise<GradingScheme> {
  return apiClient<GradingScheme>(`/v1/grading-schemes/platform/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function fetchPlatformAcademicEvaluation(): Promise<PlatformAcademicEvaluation | null> {
  return apiClient<PlatformAcademicEvaluation | null>(
    "/v1/academic-evaluation/platform",
  );
}

export function upsertPlatformAcademicEvaluation(
  payload: UpsertPlatformAcademicEvaluationInput,
): Promise<PlatformAcademicEvaluation> {
  return apiClient<PlatformAcademicEvaluation>(
    "/v1/academic-evaluation/platform",
    { method: "PUT", body: payload },
  );
}

export function initializePlatformEcuadorDefaults(): Promise<PlatformAcademicEvaluation> {
  return apiClient<PlatformAcademicEvaluation>(
    "/v1/academic-evaluation/platform/initialize-ecuador-defaults",
    { method: "POST" },
  );
}

export function createAssessmentCategoryTemplate(
  payload: CreateAssessmentCategoryTemplateInput,
): Promise<AssessmentCategoryTemplate> {
  return apiClient<AssessmentCategoryTemplate>(
    "/v1/academic-evaluation/platform/assessment-category-templates",
    { method: "POST", body: payload },
  );
}

export function updateAssessmentCategoryTemplate(
  id: string,
  payload: UpdateAssessmentCategoryTemplateInput,
): Promise<AssessmentCategoryTemplate> {
  return apiClient<AssessmentCategoryTemplate>(
    `/v1/academic-evaluation/platform/assessment-category-templates/${id}`,
    { method: "PATCH", body: payload },
  );
}

export function deleteAssessmentCategoryTemplate(id: string): Promise<void> {
  return apiClient<void>(
    `/v1/academic-evaluation/platform/assessment-category-templates/${id}`,
    { method: "DELETE" },
  );
}

export function createEvaluationTermTemplate(
  payload: CreateEvaluationTermTemplateInput,
): Promise<EvaluationTermTemplate> {
  return apiClient<EvaluationTermTemplate>(
    "/v1/academic-evaluation/platform/evaluation-term-templates",
    { method: "POST", body: payload },
  );
}

export function updateEvaluationTermTemplate(
  id: string,
  payload: UpdateEvaluationTermTemplateInput,
): Promise<EvaluationTermTemplate> {
  return apiClient<EvaluationTermTemplate>(
    `/v1/academic-evaluation/platform/evaluation-term-templates/${id}`,
    { method: "PATCH", body: payload },
  );
}

export function deleteEvaluationTermTemplate(id: string): Promise<void> {
  return apiClient<void>(
    `/v1/academic-evaluation/platform/evaluation-term-templates/${id}`,
    { method: "DELETE" },
  );
}

export function fetchGradeScales(schemeId: string): Promise<GradeScale[]> {
  return apiClient<GradeScale[]>(
    `/v1/grading-schemes/${schemeId}/grade-scales`,
  );
}

export function createGradeScale(
  schemeId: string,
  payload: CreateGradeScaleInput,
): Promise<GradeScale> {
  return apiClient<GradeScale>(
    `/v1/grading-schemes/${schemeId}/grade-scales`,
    { method: "POST", body: payload },
  );
}

export function updateGradeScale(
  schemeId: string,
  scaleId: string,
  payload: UpdateGradeScaleInput,
): Promise<GradeScale> {
  return apiClient<GradeScale>(
    `/v1/grading-schemes/${schemeId}/grade-scales/${scaleId}`,
    { method: "PATCH", body: payload },
  );
}

export function deleteGradeScale(
  schemeId: string,
  scaleId: string,
): Promise<void> {
  return apiClient<void>(
    `/v1/grading-schemes/${schemeId}/grade-scales/${scaleId}`,
    { method: "DELETE" },
  );
}

export function fetchEvaluationTerms(
  filters: EvaluationTermsFilters,
): Promise<EvaluationTermsListResponse> {
  const query = buildPaginationQuery(filters);
  return apiClient<EvaluationTermsListResponse>(`/v1/evaluation-terms?${query}`);
}

export function createEvaluationTerm(
  payload: CreateEvaluationTermInput,
): Promise<EvaluationTerm> {
  return apiClient<EvaluationTerm>("/v1/evaluation-terms", {
    method: "POST",
    body: payload,
  });
}

export function updateEvaluationTerm(
  id: string,
  payload: UpdateEvaluationTermInput,
): Promise<EvaluationTerm> {
  return apiClient<EvaluationTerm>(`/v1/evaluation-terms/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function reorderEvaluationTerms(
  institutionId: string,
  academicPeriodId: string,
  items: Array<{ id: string; order: number }>,
): Promise<EvaluationTerm[]> {
  const params = new URLSearchParams({
    institutionId,
    academicPeriodId,
  });

  return apiClient<EvaluationTerm[]>(
    `/v1/evaluation-terms/reorder?${params.toString()}`,
    { method: "POST", body: { items } },
  );
}

export function deleteEvaluationTerm(id: string): Promise<void> {
  return apiClient<void>(`/v1/evaluation-terms/${id}`, { method: "DELETE" });
}

export function fetchAssessmentCategories(
  filters: AssessmentCategoriesFilters,
): Promise<AssessmentCategoriesListResponse> {
  const query = buildPaginationQuery(filters);
  return apiClient<AssessmentCategoriesListResponse>(
    `/v1/assessment-categories?${query}`,
  );
}

export function createAssessmentCategory(
  payload: CreateAssessmentCategoryInput,
): Promise<AssessmentCategory> {
  return apiClient<AssessmentCategory>("/v1/assessment-categories", {
    method: "POST",
    body: payload,
  });
}

export function updateAssessmentCategory(
  id: string,
  payload: UpdateAssessmentCategoryInput,
): Promise<AssessmentCategory> {
  return apiClient<AssessmentCategory>(`/v1/assessment-categories/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteAssessmentCategory(id: string): Promise<void> {
  return apiClient<void>(`/v1/assessment-categories/${id}`, {
    method: "DELETE",
  });
}

export function fetchInstitutionConfiguration(
  institutionId: string,
): Promise<InstitutionAcademicConfiguration | null> {
  return apiClient<InstitutionAcademicConfiguration | null>(
    `/v1/institutions/${institutionId}/academic-evaluation/configuration`,
  );
}

export function upsertInstitutionConfiguration(
  institutionId: string,
  payload: UpsertInstitutionConfigurationInput,
): Promise<InstitutionAcademicConfiguration> {
  return apiClient<InstitutionAcademicConfiguration>(
    `/v1/institutions/${institutionId}/academic-evaluation/configuration`,
    { method: "PUT", body: payload },
  );
}

export function fetchEvaluationPreview(
  institutionId: string,
  academicPeriodId?: string,
): Promise<EvaluationConfigPreview> {
  const params = academicPeriodId
    ? `?academicPeriodId=${academicPeriodId}`
    : "";

  return apiClient<EvaluationConfigPreview>(
    `/v1/institutions/${institutionId}/academic-evaluation/preview${params}`,
  );
}

export function applyPlatformDefaultsForInstitution(
  institutionId: string,
): Promise<InstitutionAcademicConfiguration> {
  return apiClient<InstitutionAcademicConfiguration>(
    `/v1/institutions/${institutionId}/academic-evaluation/apply-platform-defaults`,
    { method: "POST" },
  );
}
