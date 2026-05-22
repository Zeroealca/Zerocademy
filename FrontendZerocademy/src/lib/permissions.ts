import type { UserRole } from "@/stores/use-auth-store";

const PLATFORM_CALENDAR_ROLES: UserRole[] = ["SUPER_ADMIN"];
const INSTITUTION_OPS_ROLES: UserRole[] = ["ADMIN"];
const INSTITUTION_VIEW_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
const PERIOD_CONTEXT_ROLES: UserRole[] = ["ADMIN", "TEACHER", "STUDENT"];
const INSTITUTION_OPS_VIEW_ROLES: UserRole[] = ["ADMIN", "TEACHER"];
const USER_ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

function hasRole(
  role: UserRole | undefined,
  allowed: readonly UserRole[],
): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  return allowed.includes(role);
}

function hasRoleStrict(
  role: UserRole | undefined,
  allowed: readonly UserRole[],
): boolean {
  if (!role) return false;
  return allowed.includes(role);
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return hasRole(role, USER_ADMIN_ROLES);
}

/** Platform calendar CRUD and activation (global, one active per regime). */
export function canManageAcademicPeriods(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canViewAcademicPeriods(role: UserRole | undefined): boolean {
  return (
    hasRole(role, PLATFORM_CALENDAR_ROLES) ||
    hasRoleStrict(role, PERIOD_CONTEXT_ROLES) ||
    hasRoleStrict(role, INSTITUTION_OPS_ROLES)
  );
}

export function canSelectAcademicPeriod(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PERIOD_CONTEXT_ROLES);
}

/** Create, update, delete global catalog: academic levels, grade levels, subjects (SUPER_ADMIN only). */
export function canManagePlatformCatalog(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

/** Courses, teacher assignments, and structure tree (ADMIN, TEACHER). */
export function canViewInstitutionOperations(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_VIEW_ROLES);
}

export function canViewAcademicStructure(role: UserRole | undefined): boolean {
  return canViewInstitutionOperations(role);
}

/** Institution operations: courses, teacher assignments (ADMIN only). */
export function canManageAcademicStructure(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_ROLES);
}

export function canViewInstitutions(role: UserRole | undefined): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canManageInstitutions(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canManageInstitutionSettings(role: UserRole | undefined): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canViewInstitutionMemberships(role: UserRole | undefined): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canManageInstitutionMemberships(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canViewAcademicTransitions(role: UserRole | undefined): boolean {
  return hasRole(role, [...INSTITUTION_VIEW_ROLES, "TEACHER"]);
}

export function canManageAcademicTransitions(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_ROLES);
}

/** Student CRUD, enrollments, and CSV import (ADMIN only; strict). */
export function canManageStudents(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_ROLES);
}

/** Institution student directory (ADMIN, TEACHER). Students use own-profile routes only. */
export function canViewStudents(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_VIEW_ROLES);
}

export function canManageEnrollments(role: UserRole | undefined): boolean {
  return canManageStudents(role);
}

/** Full enrollments module: list, create, bulk (ADMIN, TEACHER). */
export function canViewEnrollments(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_VIEW_ROLES);
}

/** Student self-service: own enrollment history. */
export function canViewOwnEnrollmentHistory(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}

/** Student grades module (read-only own data when implemented). */
export function canViewGrades(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}
