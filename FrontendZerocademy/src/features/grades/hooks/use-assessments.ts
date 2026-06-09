"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAssessment, fetchAssessments } from "@/features/grades/api/assessments.api";
import { assessmentsKeys } from "@/features/grades/api/grades.keys";
import type { AssessmentsFilters } from "@/features/grades/types";

export function useAssessments(filters: AssessmentsFilters) {
  return useQuery({
    queryKey: assessmentsKeys.list(filters),
    queryFn: () => fetchAssessments(filters),
  });
}

export function useAssessment(id: string | undefined) {
  return useQuery({
    queryKey: assessmentsKeys.detail(id ?? ""),
    queryFn: () => fetchAssessment(id!),
    enabled: Boolean(id),
  });
}
