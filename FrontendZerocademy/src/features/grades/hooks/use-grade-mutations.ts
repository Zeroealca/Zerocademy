"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkUpsertGrades, correctPublishedGrade, createGrade } from "@/features/grades/api/grades.api";
import { gradesKeys } from "@/features/grades/api/grades.keys";
import type {
  BulkUpsertGradesInput,
  CreateGradeInput,
  CorrectPublishedGradeInput,
} from "@/features/grades/types";

export function useGradeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: gradesKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateGradeInput) => createGrade(payload),
    onSuccess: invalidate,
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: BulkUpsertGradesInput) => bulkUpsertGrades(payload),
    onSuccess: invalidate,
  });

  const correctionMutation = useMutation({
    mutationFn: ({ assessmentId, payload }: { assessmentId: string; payload: CorrectPublishedGradeInput }) =>
      correctPublishedGrade(assessmentId, payload),
    onSuccess: invalidate,
  });

  return { createMutation, bulkMutation, correctionMutation };
}
