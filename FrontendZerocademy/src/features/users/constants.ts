import type { UserRole } from "@/stores/use-auth-store";

export const USER_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "REPRESENTATIVE",
];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrador",
  ADMIN: "Administrador",
  TEACHER: "Docente",
  STUDENT: "Estudiante",
  REPRESENTATIVE: "Representante",
};
