import type { UserRole } from "@/stores/use-auth-store";

const PLATFORM_CALENDAR_ROLES: UserRole[] = ["SUPER_ADMIN"];
const INSTITUTION_OPS_ROLES: UserRole[] = ["ADMIN"];
const INSTITUTION_VIEW_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
const PERIOD_CONTEXT_ROLES: UserRole[] = ["ADMIN", "TEACHER", "STUDENT", "REPRESENTATIVE"];
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

/** Matches the backend subject catalog read roles. */
export function canViewSubjects(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT"]);
}

export function canCreateSubjects(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN"]);
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
export function canManageAcademicStructure(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_ROLES);
}

export function canViewInstitutions(role: UserRole | undefined): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canManageInstitutions(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canManageInstitutionSettings(
  role: UserRole | undefined,
): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canViewInstitutionMemberships(
  role: UserRole | undefined,
): boolean {
  return hasRole(role, INSTITUTION_VIEW_ROLES);
}

export function canManageInstitutionMemberships(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

export function canViewAcademicTransitions(
  role: UserRole | undefined,
): boolean {
  return hasRole(role, [...INSTITUTION_VIEW_ROLES, "TEACHER"]);
}

const ACADEMIC_TRANSITION_MANAGE_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function canManageAcademicTransitions(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, ACADEMIC_TRANSITION_MANAGE_ROLES);
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
export function canViewOwnEnrollmentHistory(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}

/** Grades module — students (own data), teachers, admins (monitoring). */
export function canViewGrades(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN", "REPRESENTATIVE"]);
}

export function canViewOwnGrades(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}

export function canViewAssessments(role: UserRole | undefined): boolean {
  return hasRole(role, ["ADMIN", "TEACHER"]);
}

export function canManageAssessments(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["TEACHER"]);
}

export function canManageGrades(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["TEACHER"]);
}

export function canViewGradeEntry(role: UserRole | undefined): boolean {
  return hasRole(role, ["ADMIN", "TEACHER"]);
}

export function canViewGradesMonitoring(role: UserRole | undefined): boolean {
  return hasRole(role, ["ADMIN"]);
}

/** Academic evaluation configuration (grading schemes, terms, categories). */
export function canViewAcademicEvaluation(role: UserRole | undefined): boolean {
  return hasRole(role, ["ADMIN", "TEACHER"]);
}

/** Academic plans: teacher-owned drafts and institution read-only oversight. */
export function canViewAcademicPlanning(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN", "TEACHER"]);
}

/** Academic Execution: assignment-scoped ClassSession read workspace. */
export function canViewAcademicExecution(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN", "TEACHER"]);
}

export function canManageAcademicExecution(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["TEACHER"]);
}

export function canManageAcademicPlanning(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["TEACHER"]);
}

export function canManageAcademicEvaluation(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, INSTITUTION_OPS_ROLES);
}

export function canInitializeGlobalEvaluationDefaults(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

/** Platform-wide evaluation defaults (SUPER_ADMIN only). */
export function canManagePlatformAcademicEvaluation(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, PLATFORM_CALENDAR_ROLES);
}

/** Academic performance — student self-service averages. */
export function canViewAcademicPerformanceStudent(
  role: UserRole | undefined,
): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}

/** Academic performance — teacher course and student views. */
export function canViewAcademicPerformanceTeacher(
  role: UserRole | undefined,
): boolean {
  return hasRole(role, ["ADMIN", "TEACHER"]);
}

/** Academic performance — institution oversight. */
export function canViewAcademicPerformanceAdmin(
  role: UserRole | undefined,
): boolean {
  return hasRole(role, ["ADMIN"]);
}

export function canViewAcademicPerformance(
  role: UserRole | undefined,
): boolean {
  return (
    canViewAcademicPerformanceStudent(role) ||
    canViewAcademicPerformanceTeacher(role) ||
    canViewAcademicPerformanceAdmin(role)
  );
}

/** Academic report cards: student self-service and scoped staff access. */
export function canViewOwnReportCard(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}

export function canViewReportCards(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN", "TEACHER", "STUDENT", "REPRESENTATIVE"]);
}

export function canViewRepresentativePortal(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["REPRESENTATIVE"]);
}

export function canViewAttendance(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["SUPER_ADMIN", "ADMIN", "TEACHER"]);
}

export function canManageAttendance(role: UserRole | undefined): boolean {
  return canViewAttendance(role);
}

export function canViewOwnAttendance(role: UserRole | undefined): boolean {
  return hasRoleStrict(role, ["STUDENT"]);
}
