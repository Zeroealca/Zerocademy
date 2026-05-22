import type { EnrollmentStatus } from "@/features/enrollments/types";

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  ACTIVE: "Activa",
  WITHDRAWN: "Retirada",
  COMPLETED: "Completada",
  FAILED: "Reprobada",
  TRANSFERRED: "Transferida",
};

export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  "ACTIVE",
  "WITHDRAWN",
  "COMPLETED",
  "FAILED",
  "TRANSFERRED",
];
