import { useQuery } from "@tanstack/react-query";
import { fetchTeacherAssignments } from "@/features/teacher-assignments/api/teacher-assignments.api";
import { teacherAssignmentsKeys } from "@/features/teacher-assignments/api/teacher-assignments.keys";
import type { TeacherAssignmentsFilters } from "@/features/teacher-assignments/types";

export function useTeacherAssignments(filters: TeacherAssignmentsFilters) {
  return useQuery({
    queryKey: teacherAssignmentsKeys.list(filters),
    queryFn: () => fetchTeacherAssignments(filters),
  });
}
