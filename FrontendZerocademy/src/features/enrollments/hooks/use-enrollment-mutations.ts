"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  bulkCreateEnrollments,
  createEnrollment,
  updateEnrollment,
} from "@/features/enrollments/api/enrollments.api";
import { enrollmentsKeys } from "@/features/enrollments/api/enrollments.keys";
import { studentsKeys } from "@/features/students/api/students.keys";
import type {
  BulkCreateEnrollmentsInput,
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
} from "@/features/enrollments/types";

export function useEnrollmentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: enrollmentsKeys.all });
    void queryClient.invalidateQueries({ queryKey: studentsKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateEnrollmentInput) => createEnrollment(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateEnrollmentInput;
    }) => updateEnrollment(id, payload),
    onSuccess: invalidate,
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: BulkCreateEnrollmentsInput) =>
      bulkCreateEnrollments(payload),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, bulkCreateMutation };
}
