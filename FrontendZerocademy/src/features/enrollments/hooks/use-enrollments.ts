"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchEnrollments,
  fetchStudentEnrollmentHistory,
} from "@/features/enrollments/api/enrollments.api";
import { enrollmentsKeys } from "@/features/enrollments/api/enrollments.keys";
import type { EnrollmentsFilters } from "@/features/enrollments/types";

export function useEnrollments(filters: EnrollmentsFilters) {
  return useQuery({
    queryKey: enrollmentsKeys.list(filters),
    queryFn: () => fetchEnrollments(filters),
  });
}

export function useStudentEnrollmentHistory(
  studentId: string,
  filters: EnrollmentsFilters,
) {
  return useQuery({
    queryKey: enrollmentsKeys.history(studentId, filters),
    queryFn: () => fetchStudentEnrollmentHistory(studentId, filters),
    enabled: Boolean(studentId),
  });
}
