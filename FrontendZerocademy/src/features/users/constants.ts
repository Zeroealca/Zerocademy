import type { UserSortField, UserSortOrder } from "@/features/users/types";
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

export function nextUsersSort(
  field: UserSortField,
  currentField?: UserSortField,
  currentOrder?: UserSortOrder,
): { sortBy: UserSortField; sortOrder: UserSortOrder } {
  if (currentField === field) {
    return {
      sortBy: field,
      sortOrder: currentOrder === "asc" ? "desc" : "asc",
    };
  }

  return {
    sortBy: field,
    sortOrder: field === "isActive" ? "desc" : "asc",
  };
}
