import { apiClient } from "@/lib/api-client";
import type {
  LessonPlan,
  LessonPlanInput,
  ReorderLessonPlansInput,
  UpdateLessonPlanInput,
} from "@/features/planning/types";

const lessonPlansPath = (academicPlanId: string, academicUnitId: string) =>
  `/v1/academic-plans/${academicPlanId}/units/${academicUnitId}/lesson-plans`;

export const fetchLessonPlans = (
  academicPlanId: string,
  academicUnitId: string,
) => apiClient<LessonPlan[]>(lessonPlansPath(academicPlanId, academicUnitId));

export const fetchLessonPlan = (
  academicPlanId: string,
  academicUnitId: string,
  lessonPlanId: string,
) =>
  apiClient<LessonPlan>(
    `${lessonPlansPath(academicPlanId, academicUnitId)}/${lessonPlanId}`,
  );

export const createLessonPlan = (
  academicPlanId: string,
  academicUnitId: string,
  payload: LessonPlanInput,
) =>
  apiClient<LessonPlan>(lessonPlansPath(academicPlanId, academicUnitId), {
    method: "POST",
    body: payload,
  });

export const updateLessonPlan = (
  academicPlanId: string,
  academicUnitId: string,
  lessonPlanId: string,
  payload: UpdateLessonPlanInput,
) =>
  apiClient<LessonPlan>(
    `${lessonPlansPath(academicPlanId, academicUnitId)}/${lessonPlanId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

export const deleteLessonPlan = (
  academicPlanId: string,
  academicUnitId: string,
  lessonPlanId: string,
) =>
  apiClient<void>(
    `${lessonPlansPath(academicPlanId, academicUnitId)}/${lessonPlanId}`,
    { method: "DELETE" },
  );

export const reorderLessonPlans = (
  academicPlanId: string,
  academicUnitId: string,
  payload: ReorderLessonPlansInput,
) =>
  apiClient<void>(`${lessonPlansPath(academicPlanId, academicUnitId)}/reorder`, {
    method: "PATCH",
    body: payload,
  });
