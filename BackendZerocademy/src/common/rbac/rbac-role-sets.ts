import { Role } from '@prisma/client';

/** Read platform calendar and catalog. */
export const PLATFORM_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
  Role.STUDENT,
] as const;

/** Manage global academic calendar (periods, activation). */
export const PLATFORM_CALENDAR_WRITE_ROLES = [Role.SUPER_ADMIN] as const;

/** Manage reusable catalog (levels, grades, subjects). */
export const PLATFORM_CATALOG_WRITE_ROLES = [Role.SUPER_ADMIN] as const;

/** Institution operational writes — strict (no SUPER_ADMIN bypass). */
export const INSTITUTION_OPS_WRITE_ROLES = [Role.ADMIN] as const;

/** Academic period transitions — SUPER_ADMIN (platform QA) and institution ADMIN. */
export const ACADEMIC_TRANSITION_WRITE_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
] as const;

export const INSTITUTION_OPS_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
] as const;

export const INSTITUTION_ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

export const INSTITUTION_PLATFORM_WRITE_ROLES = [Role.SUPER_ADMIN] as const;

export const USER_ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

/** Student and enrollment management — ADMIN only; SUPER_ADMIN excluded (strict). */
export const STUDENT_ENROLLMENT_WRITE_ROLES = [Role.ADMIN] as const;

export const STUDENT_ENROLLMENT_READ_ROLES = [
  Role.ADMIN,
  Role.TEACHER,
  Role.STUDENT,
] as const;

/** Read academic evaluation configuration (grading schemes, terms, categories). */
export const ACADEMIC_EVALUATION_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
] as const;

/** Manage institution evaluation configuration — strict (ADMIN only). */
export const ACADEMIC_EVALUATION_WRITE_ROLES = [Role.ADMIN] as const;

/** Initialize global Ecuador evaluation templates — SUPER_ADMIN only. */
export const ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES = [
  Role.SUPER_ADMIN,
] as const;

/** Read assessments (monitoring for admins; scoped for teachers). */
export const ASSESSMENTS_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
] as const;

/** Create, update, delete assessments — TEACHER only (strict). */
export const ASSESSMENTS_WRITE_ROLES = [Role.TEACHER] as const;

/** Read grade records (scoped by role). */
export const GRADES_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
  Role.STUDENT,
] as const;

/** Create and update grades — TEACHER only (strict). */
export const GRADES_WRITE_ROLES = [Role.TEACHER] as const;

/** Grade entry sheet and monitoring — teachers plus institution oversight. */
export const GRADES_ENTRY_READ_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
] as const;

/** Academic performance — student self-service averages. */
export const ACADEMIC_PERFORMANCE_STUDENT_ROLES = [Role.STUDENT] as const;

/** Academic performance — teacher course and student views. */
export const ACADEMIC_PERFORMANCE_TEACHER_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
] as const;

/** Academic performance — institution oversight. */
export const ACADEMIC_PERFORMANCE_ADMIN_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
] as const;
