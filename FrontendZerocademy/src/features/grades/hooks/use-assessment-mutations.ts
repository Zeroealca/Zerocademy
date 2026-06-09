"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAssessment,
  deleteAssessment,
  updateAssessment,
} from "@/features/grades/api/assessments.api";
import { assessmentsKeys } from "@/features/grades/api/grades.keys";
import type {
  CreateAssessmentInput,
  UpdateAssessmentInput,
} from "@/features/grades/types";

export function useAssessmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: assessmentsKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateAssessmentInput) => createAssessment(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAssessmentInput;
    }) => updateAssessment(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
