import type { Student } from "@/features/students/types";

export function formatStudentLabel(student: Pick<
  Student,
  "firstName" | "lastName" | "nationalId"
>): string {
  const name = `${student.firstName} ${student.lastName}`.trim();
  const nationalId = student.nationalId?.trim();
  return nationalId ? `${name} — ${nationalId}` : name;
}
