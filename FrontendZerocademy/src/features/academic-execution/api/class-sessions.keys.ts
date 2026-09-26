export const classSessionsKeys = {
  all: ["class-sessions"] as const,
  assignments: () => [...classSessionsKeys.all, "teacher-assignment"] as const,
  assignment: (teacherAssignmentId: string) =>
    [...classSessionsKeys.assignments(), teacherAssignmentId] as const,
  lists: (teacherAssignmentId: string) =>
    [...classSessionsKeys.assignment(teacherAssignmentId), "list"] as const,
  list: (teacherAssignmentId: string) =>
    [...classSessionsKeys.lists(teacherAssignmentId)] as const,
  details: (teacherAssignmentId: string) =>
    [...classSessionsKeys.assignment(teacherAssignmentId), "detail"] as const,
  detail: (teacherAssignmentId: string, classSessionId: string) =>
    [...classSessionsKeys.details(teacherAssignmentId), classSessionId] as const,
};
