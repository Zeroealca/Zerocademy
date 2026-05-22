"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateStudent,
  bulkImportStudents,
  createStudent,
  deactivateStudent,
  updateStudent,
} from "@/features/students/api/students.api";
import { studentsKeys } from "@/features/students/api/students.keys";
import { enrollmentsKeys } from "@/features/enrollments/api/enrollments.keys";
import type {
  BulkImportStudentsInput,
  CreateStudentInput,
  UpdateStudentInput,
} from "@/features/students/types";

export function useStudentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: studentsKeys.all });
    void queryClient.invalidateQueries({ queryKey: enrollmentsKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateStudentInput) => createStudent(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentInput }) =>
      updateStudent(id, payload),
    onSuccess: invalidate,
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateStudent(id),
    onSuccess: invalidate,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateStudent(id),
    onSuccess: invalidate,
  });

  const bulkImportMutation = useMutation({
    mutationFn: (payload: BulkImportStudentsInput) => bulkImportStudents(payload),
    onSuccess: invalidate,
  });

  return {
    createMutation,
    updateMutation,
    activateMutation,
    deactivateMutation,
    bulkImportMutation,
  };
}
