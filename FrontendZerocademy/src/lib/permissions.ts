import type { UserRole } from "@/stores/use-auth-store";

const USER_MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

const ACADEMIC_CALENDAR_READ_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEACHER",
];

const ACADEMIC_CALENDAR_WRITE_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function canManageUsers(role: UserRole | undefined): boolean {
  return role !== undefined && USER_MANAGEMENT_ROLES.includes(role);
}

export function canViewAcademicPeriods(role: UserRole | undefined): boolean {
  return role !== undefined && ACADEMIC_CALENDAR_READ_ROLES.includes(role);
}

export function canManageAcademicPeriods(role: UserRole | undefined): boolean {
  return role !== undefined && ACADEMIC_CALENDAR_WRITE_ROLES.includes(role);
}
