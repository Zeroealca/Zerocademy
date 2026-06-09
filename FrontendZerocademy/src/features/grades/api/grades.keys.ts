import type { AssessmentsFilters, GradesFilters } from "@/features/grades/types";

export const gradesKeys = {
  all: ["grades"] as const,
  lists: () => [...gradesKeys.all, "list"] as const,
  list: (filters: GradesFilters) => [...gradesKeys.lists(), filters] as const,
  details: () => [...gradesKeys.all, "detail"] as const,
  detail: (id: string) => [...gradesKeys.details(), id] as const,
  entrySheet: (assessmentId: string) =>
    [...gradesKeys.all, "entry-sheet", assessmentId] as const,
};

export const assessmentsKeys = {
  all: ["assessments"] as const,
  lists: () => [...assessmentsKeys.all, "list"] as const,
  list: (filters: AssessmentsFilters) =>
    [...assessmentsKeys.lists(), filters] as const,
  details: () => [...assessmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...assessmentsKeys.details(), id] as const,
};
