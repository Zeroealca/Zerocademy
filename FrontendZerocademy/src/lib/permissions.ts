import type { UserRole } from "@/stores/use-auth-store";

const PLATFORM_CALENDAR_ROLES: UserRole[] = ["SUPER_ADMIN"];
const INSTITUTION_OPS_ROLES: UserRole[] = ["ADMIN"];
const INSTITUTION_VIEW_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
const PERIOD_CONTEXT_ROLES: UserRole[] = ["ADMIN", "TEACHER", "STUDENT"];
const ACADEMIC_STRUCTURE_VIEW_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEACHER",
];
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

/** Reusable catalog: levels, grades, subjects. */
export function canManagePlatformCatalog(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canViewAcademicStructure(role: UserRole | undefined): boolean {
  return hasRole(role, ACADEMIC_STRUCTURE_VIEW_ROLES);
}

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

export function canCreateStudents(role: UserRole | undefined): boolean {
  return hasRole(role, [...INSTITUTION_OPS_ROLES, ...PLATFORM_CALENDAR_ROLES]);
}
