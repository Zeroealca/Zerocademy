"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchGrade,
  fetchGradeEntrySheet,
  fetchGrades,
} from "@/features/grades/api/grades.api";
import { gradesKeys } from "@/features/grades/api/grades.keys";
import type { GradesFilters } from "@/features/grades/types";

export function useGrades(filters: GradesFilters) {
  return useQuery({
    queryKey: gradesKeys.list(filters),
    queryFn: () => fetchGrades(filters),
  });
}

export function useGrade(id: string | undefined) {
  return useQuery({
    queryKey: gradesKeys.detail(id ?? ""),
    queryFn: () => fetchGrade(id!),
    enabled: Boolean(id),
  });
}

export function useGradeEntrySheet(assessmentId: string | undefined) {
  return useQuery({
    queryKey: gradesKeys.entrySheet(assessmentId ?? ""),
    queryFn: () => fetchGradeEntrySheet(assessmentId!),
    enabled: Boolean(assessmentId),
  });
}
