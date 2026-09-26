"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLessonPlan,
  deleteLessonPlan,
  fetchAcademicPlanLessonPlans,
  fetchLessonPlan,
  fetchLessonPlans,
  reorderLessonPlans,
  updateLessonPlan,
} from "@/features/planning/api/lesson-plans.api";
import { lessonPlansKeys } from "@/features/planning/api/lesson-plans.keys";
import type {
  LessonPlanInput,
  ReorderLessonPlansInput,
  UpdateLessonPlanInput,
} from "@/features/planning/types";

export function useLessonPlans(
  academicPlanId: string,
  academicUnitId: string,
) {
  return useQuery({
    queryKey: lessonPlansKeys.list(academicPlanId, academicUnitId),
    queryFn: () => fetchLessonPlans(academicPlanId, academicUnitId),
    enabled: Boolean(academicPlanId && academicUnitId),
  });
}

export function useAcademicPlanLessonPlans(academicPlanId: string) {
  return useQuery({
    queryKey: lessonPlansKeys.aggregateList(academicPlanId),
    queryFn: () => fetchAcademicPlanLessonPlans(academicPlanId),
    enabled: Boolean(academicPlanId),
  });
}

export function useLessonPlan(
  academicPlanId: string,
  academicUnitId: string,
  lessonPlanId: string,
) {
  return useQuery({
    queryKey: lessonPlansKeys.detail(
      academicPlanId,
      academicUnitId,
      lessonPlanId,
    ),
    queryFn: () =>
      fetchLessonPlan(academicPlanId, academicUnitId, lessonPlanId),
    enabled: Boolean(academicPlanId && academicUnitId && lessonPlanId),
  });
}

function useInvalidateLessonPlans() {
  const queryClient = useQueryClient();

  return (academicPlanId: string, academicUnitId: string) =>
    queryClient.invalidateQueries({
      queryKey: lessonPlansKeys.list(academicPlanId, academicUnitId),
    });
}

export function useCreateLessonPlan() {
  const invalidateLessonPlans = useInvalidateLessonPlans();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId, payload }: {
      academicPlanId: string;
      academicUnitId: string;
      payload: LessonPlanInput;
    }) => createLessonPlan(academicPlanId, academicUnitId, payload),
    onSuccess: (_, { academicPlanId, academicUnitId }) =>
      invalidateLessonPlans(academicPlanId, academicUnitId),
  });
}

export function useUpdateLessonPlan() {
  const queryClient = useQueryClient();
  const invalidateLessonPlans = useInvalidateLessonPlans();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId, lessonPlanId, payload }: {
      academicPlanId: string;
      academicUnitId: string;
      lessonPlanId: string;
      payload: UpdateLessonPlanInput;
    }) => updateLessonPlan(academicPlanId, academicUnitId, lessonPlanId, payload),
    onSuccess: (_, { academicPlanId, academicUnitId, lessonPlanId }) => {
      void queryClient.invalidateQueries({
        queryKey: lessonPlansKeys.detail(
          academicPlanId,
          academicUnitId,
          lessonPlanId,
        ),
      });
      return invalidateLessonPlans(academicPlanId, academicUnitId);
    },
  });
}

export function useDeleteLessonPlan() {
  const queryClient = useQueryClient();
  const invalidateLessonPlans = useInvalidateLessonPlans();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId, lessonPlanId }: {
      academicPlanId: string;
      academicUnitId: string;
      lessonPlanId: string;
    }) => deleteLessonPlan(academicPlanId, academicUnitId, lessonPlanId),
    onSuccess: (_, { academicPlanId, academicUnitId, lessonPlanId }) => {
      queryClient.removeQueries({
        queryKey: lessonPlansKeys.detail(
          academicPlanId,
          academicUnitId,
          lessonPlanId,
        ),
      });
      return invalidateLessonPlans(academicPlanId, academicUnitId);
    },
  });
}

export function useReorderLessonPlans() {
  const invalidateLessonPlans = useInvalidateLessonPlans();

  return useMutation({
    mutationFn: ({ academicPlanId, academicUnitId, payload }: {
      academicPlanId: string;
      academicUnitId: string;
      payload: ReorderLessonPlansInput;
    }) => reorderLessonPlans(academicPlanId, academicUnitId, payload),
    onSuccess: (_, { academicPlanId, academicUnitId }) =>
      invalidateLessonPlans(academicPlanId, academicUnitId),
  });
}
