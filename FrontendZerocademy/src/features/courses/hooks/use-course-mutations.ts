import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateCourse,
  createCourse,
  deactivateCourse,
  deleteCourse,
  updateCourse,
} from "@/features/courses/api/courses.api";
import { coursesKeys } from "@/features/courses/api/courses.keys";
import type { CreateCourseInput, UpdateCourseInput } from "@/features/courses/types";

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCourseInput) => createCourse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}

export function useUpdateCourse(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateCourseInput) => updateCourse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}

export function useActivateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}

export function useDeactivateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.all });
    },
  });
}
