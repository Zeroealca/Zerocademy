"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAvailableStudentsForEnrollment } from "@/features/enrollments/api/enrollments.api";
import { enrollmentsKeys } from "@/features/enrollments/api/enrollments.keys";
import type { AvailableStudentsFilters } from "@/features/enrollments/types";

export function useAvailableStudentsForEnrollment(
  filters: AvailableStudentsFilters | null,
) {
  return useQuery({
    queryKey: enrollmentsKeys.availableStudents(filters ?? {
      courseId: "",
      academicPeriodId: "",
      page: 1,
      limit: 100,
    }),
    queryFn: () =>
      fetchAvailableStudentsForEnrollment(filters as AvailableStudentsFilters),
    enabled: Boolean(filters?.courseId && filters.academicPeriodId),
  });
}
