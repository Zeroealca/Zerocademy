import type {
  AvailableStudentsFilters,
  EnrollmentsFilters,
} from "@/features/enrollments/types";

export const enrollmentsKeys = {
  all: ["enrollments"] as const,
  lists: () => [...enrollmentsKeys.all, "list"] as const,
  list: (filters: EnrollmentsFilters) =>
    [...enrollmentsKeys.lists(), filters] as const,
  availableStudents: (filters: AvailableStudentsFilters) =>
    [...enrollmentsKeys.all, "available-students", filters] as const,
  history: (studentId: string, filters: EnrollmentsFilters) =>
    [...enrollmentsKeys.all, "history", studentId, filters] as const,
  details: () => [...enrollmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...enrollmentsKeys.details(), id] as const,
};
