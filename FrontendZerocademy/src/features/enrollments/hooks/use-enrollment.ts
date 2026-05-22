"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEnrollment } from "@/features/enrollments/api/enrollments.api";
import { enrollmentsKeys } from "@/features/enrollments/api/enrollments.keys";

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: enrollmentsKeys.detail(id),
    queryFn: () => fetchEnrollment(id),
    enabled: Boolean(id),
  });
}
