"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStudent } from "@/features/students/api/students.api";
import { studentsKeys } from "@/features/students/api/students.keys";

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentsKeys.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: Boolean(id),
  });
}
