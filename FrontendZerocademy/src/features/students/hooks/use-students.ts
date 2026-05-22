"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStudents } from "@/features/students/api/students.api";
import { studentsKeys } from "@/features/students/api/students.keys";
import type { StudentsFilters } from "@/features/students/types";

export function useStudents(filters: StudentsFilters) {
  return useQuery({
    queryKey: studentsKeys.list(filters),
    queryFn: () => fetchStudents(filters),
  });
}
