import { useQuery } from "@tanstack/react-query";
import { fetchTeacherAssignment } from "@/features/teacher-assignments/api/teacher-assignments.api";
import { teacherAssignmentsKeys } from "@/features/teacher-assignments/api/teacher-assignments.keys";

export function useTeacherAssignment(id: string) {
  return useQuery({
    queryKey: teacherAssignmentsKeys.detail(id),
    queryFn: () => fetchTeacherAssignment(id),
    enabled: Boolean(id),
  });
}
