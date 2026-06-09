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
