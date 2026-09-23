"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyPlatformDefaultsForInstitution,
  createAssessmentCategory,
  createAssessmentCategoryTemplate,
  createEvaluationTerm,
  createEvaluationTermTemplate,
  createGradeScale,
  createGradingScheme,
  deleteAssessmentCategory,
  deleteAssessmentCategoryTemplate,
  deleteEvaluationTerm,
  deleteEvaluationTermTemplate,
  deleteGradeScale,
  fetchAssessmentCategories,
  fetchEvaluationPreview,
  fetchEvaluationTerms,
  fetchGradeScales,
  fetchGradingScheme,
  fetchGradingSchemes,
  fetchInstitutionConfiguration,
  fetchPlatformAcademicEvaluation,
  initializePlatformEcuadorDefaults,
  reorderEvaluationTerms,
  replaceGradeScales,
  updateAssessmentCategory,
  updateAssessmentCategoryTemplate,
  updateEvaluationTerm,
  updateEvaluationTermTemplate,
  updateGradeScale,
  updateGradingScheme,
  updatePlatformGradingScheme,
  upsertInstitutionConfiguration,
  upsertPlatformAcademicEvaluation,
} from "@/features/academic-evaluation/api/academic-evaluation.api";
import { academicEvaluationKeys } from "@/features/academic-evaluation/api/academic-evaluation.keys";
import type {
  AssessmentCategoriesFilters,
  CreateAssessmentCategoryInput,
  CreateAssessmentCategoryTemplateInput,
  CreateEvaluationTermInput,
  CreateEvaluationTermTemplateInput,
  CreateGradeScaleInput,
  CreateGradingSchemeInput,
  EvaluationTermsFilters,
  GradingSchemesFilters,
  UpdateAssessmentCategoryInput,
  UpdateAssessmentCategoryTemplateInput,
  UpdateEvaluationTermInput,
  UpdateEvaluationTermTemplateInput,
  UpdateGradeScaleInput,
  UpdateGradingSchemeInput,
  UpsertInstitutionConfigurationInput,
  UpsertPlatformAcademicEvaluationInput,
} from "@/features/academic-evaluation/types";

export function useGradingSchemes(filters: GradingSchemesFilters) {
  return useQuery({
    queryKey: academicEvaluationKeys.gradingSchemes.list(filters),
    queryFn: () => fetchGradingSchemes(filters),
  });
}

export function useGradingScheme(id: string | undefined) {
  return useQuery({
    queryKey: academicEvaluationKeys.gradingSchemes.detail(id ?? ""),
    queryFn: () => fetchGradingScheme(id!),
    enabled: Boolean(id),
  });
}

export function useGradeScales(schemeId: string | undefined) {
  return useQuery({
    queryKey: academicEvaluationKeys.gradingSchemes.scales(schemeId ?? ""),
    queryFn: () => fetchGradeScales(schemeId!),
    enabled: Boolean(schemeId),
  });
}

export function useEvaluationTerms(
  filters: EvaluationTermsFilters | undefined,
) {
  return useQuery({
    queryKey: academicEvaluationKeys.evaluationTerms.list(
      filters ?? {
        page: 1,
        limit: 50,
        institutionId: "",
        academicPeriodId: "",
      },
    ),
    queryFn: () => fetchEvaluationTerms(filters!),
    enabled: Boolean(filters?.institutionId && filters.academicPeriodId),
  });
}

export function useAssessmentCategories(
  filters: AssessmentCategoriesFilters | undefined,
) {
  return useQuery({
    queryKey: academicEvaluationKeys.assessmentCategories.list(
      filters ?? { page: 1, limit: 50, institutionId: "" },
    ),
    queryFn: () => fetchAssessmentCategories(filters!),
    enabled: Boolean(filters?.institutionId),
  });
}

export function useInstitutionConfiguration(institutionId: string | undefined) {
  return useQuery({
    queryKey: academicEvaluationKeys.configuration.byInstitution(
      institutionId ?? "",
    ),
    queryFn: () => fetchInstitutionConfiguration(institutionId!),
    enabled: Boolean(institutionId),
  });
}

export function useEvaluationPreview(
  institutionId: string | undefined,
  academicPeriodId?: string,
) {
  return useQuery({
    queryKey: academicEvaluationKeys.configuration.preview(
      institutionId ?? "",
      academicPeriodId,
    ),
    queryFn: () => fetchEvaluationPreview(institutionId!, academicPeriodId),
    enabled: Boolean(institutionId),
  });
}

export function usePlatformAcademicEvaluation() {
  return useQuery({
    queryKey: academicEvaluationKeys.platform.defaults(),
    queryFn: () => fetchPlatformAcademicEvaluation(),
  });
}

export function useAcademicEvaluationMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () =>
    queryClient.invalidateQueries({
      queryKey: academicEvaluationKeys.all,
    });

  return {
    createGradingScheme: useMutation({
      mutationFn: (payload: CreateGradingSchemeInput) =>
        createGradingScheme(payload),
      onSuccess: invalidateAll,
    }),
    updateGradingScheme: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateGradingSchemeInput;
      }) => updateGradingScheme(id, payload),
      onSuccess: invalidateAll,
    }),
    createGradeScale: useMutation({
      mutationFn: ({
        schemeId,
        payload,
      }: {
        schemeId: string;
        payload: CreateGradeScaleInput;
      }) => createGradeScale(schemeId, payload),
      onSuccess: invalidateAll,
    }),
    replaceGradeScales: useMutation({
      mutationFn: ({ schemeId, scales }: { schemeId: string; scales: CreateGradeScaleInput[] }) =>
        replaceGradeScales(schemeId, scales),
      onSuccess: invalidateAll,
    }),
    updateGradeScale: useMutation({
      mutationFn: ({
        schemeId,
        scaleId,
        payload,
      }: {
        schemeId: string;
        scaleId: string;
        payload: UpdateGradeScaleInput;
      }) => updateGradeScale(schemeId, scaleId, payload),
      onSuccess: invalidateAll,
    }),
    deleteGradeScale: useMutation({
      mutationFn: ({
        schemeId,
        scaleId,
      }: {
        schemeId: string;
        scaleId: string;
      }) => deleteGradeScale(schemeId, scaleId),
      onSuccess: invalidateAll,
    }),
    createEvaluationTerm: useMutation({
      mutationFn: (payload: CreateEvaluationTermInput) =>
        createEvaluationTerm(payload),
      onSuccess: invalidateAll,
    }),
    updateEvaluationTerm: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateEvaluationTermInput;
      }) => updateEvaluationTerm(id, payload),
      onSuccess: invalidateAll,
    }),
    reorderEvaluationTerms: useMutation({
      mutationFn: ({
        institutionId,
        academicPeriodId,
        items,
      }: {
        institutionId: string;
        academicPeriodId: string;
        items: Array<{ id: string; order: number }>;
      }) => reorderEvaluationTerms(institutionId, academicPeriodId, items),
      onSuccess: invalidateAll,
    }),
    deleteEvaluationTerm: useMutation({
      mutationFn: (id: string) => deleteEvaluationTerm(id),
      onSuccess: invalidateAll,
    }),
    createAssessmentCategory: useMutation({
      mutationFn: (payload: CreateAssessmentCategoryInput) =>
        createAssessmentCategory(payload),
      onSuccess: invalidateAll,
    }),
    updateAssessmentCategory: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateAssessmentCategoryInput;
      }) => updateAssessmentCategory(id, payload),
      onSuccess: invalidateAll,
    }),
    deleteAssessmentCategory: useMutation({
      mutationFn: (id: string) => deleteAssessmentCategory(id),
      onSuccess: invalidateAll,
    }),
    upsertConfiguration: useMutation({
      mutationFn: ({
        institutionId,
        payload,
      }: {
        institutionId: string;
        payload: UpsertInstitutionConfigurationInput;
      }) => upsertInstitutionConfiguration(institutionId, payload),
      onSuccess: invalidateAll,
    }),
    applyPlatformDefaultsInstitution: useMutation({
      mutationFn: (institutionId: string) =>
        applyPlatformDefaultsForInstitution(institutionId),
      onSuccess: invalidateAll,
    }),
    upsertPlatformConfig: useMutation({
      mutationFn: (payload: UpsertPlatformAcademicEvaluationInput) =>
        upsertPlatformAcademicEvaluation(payload),
      onSuccess: invalidateAll,
    }),
    updatePlatformGradingScheme: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateGradingSchemeInput;
      }) => updatePlatformGradingScheme(id, payload),
      onSuccess: invalidateAll,
    }),
    initializePlatformEcuador: useMutation({
      mutationFn: () => initializePlatformEcuadorDefaults(),
      onSuccess: invalidateAll,
    }),
    createCategoryTemplate: useMutation({
      mutationFn: (payload: CreateAssessmentCategoryTemplateInput) =>
        createAssessmentCategoryTemplate(payload),
      onSuccess: invalidateAll,
    }),
    updateCategoryTemplate: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateAssessmentCategoryTemplateInput;
      }) => updateAssessmentCategoryTemplate(id, payload),
      onSuccess: invalidateAll,
    }),
    deleteCategoryTemplate: useMutation({
      mutationFn: (id: string) => deleteAssessmentCategoryTemplate(id),
      onSuccess: invalidateAll,
    }),
    createTermTemplate: useMutation({
      mutationFn: (payload: CreateEvaluationTermTemplateInput) =>
        createEvaluationTermTemplate(payload),
      onSuccess: invalidateAll,
    }),
    updateTermTemplate: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateEvaluationTermTemplateInput;
      }) => updateEvaluationTermTemplate(id, payload),
      onSuccess: invalidateAll,
    }),
    deleteTermTemplate: useMutation({
      mutationFn: (id: string) => deleteEvaluationTermTemplate(id),
      onSuccess: invalidateAll,
    }),
  };
}
