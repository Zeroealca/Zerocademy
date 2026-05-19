import type { TeacherAssignmentsFilters } from "@/features/teacher-assignments/types";

export const teacherAssignmentsKeys = {
  all: ["teacher-assignments"] as const,
  lists: () => [...teacherAssignmentsKeys.all, "list"] as const,
  list: (filters: TeacherAssignmentsFilters) =>
    [...teacherAssignmentsKeys.lists(), filters] as const,
  details: () => [...teacherAssignmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...teacherAssignmentsKeys.details(), id] as const,
  hierarchy: (params: { academicPeriodId: string; teacherId?: string }) =>
    [...teacherAssignmentsKeys.all, "hierarchy", params] as const,
};
