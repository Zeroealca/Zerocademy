/**
 * Stable, code-defined capability identifiers.
 *
 * This catalog is intentionally independent from HTTP routes. It is not yet
 * consulted by endpoint guards; Phase 1 exposes it for parity verification and
 * future authorization migration only.
 */
export const PERMISSIONS = {
  INSTITUTIONS: {
    READ: 'institutions.read',
    CREATE: 'institutions.create',
    UPDATE: 'institutions.update',
    UPDATE_SETTINGS: 'institution_settings.update',
    UPDATE_BRANDING: 'institution_branding.update',
    UPLOAD_LOGO: 'institution_logo.upload',
    ACTIVATE: 'institutions.activate',
    DEACTIVATE: 'institutions.deactivate',
    DELETE: 'institutions.delete',
  },
  USERS: {
    READ: 'users.read',
    CREATE: 'users.create',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
  },
  INSTITUTION_MEMBERSHIPS: {
    READ: 'institution_memberships.read',
    CREATE: 'institution_memberships.create',
    UPDATE: 'institution_memberships.update',
    ACTIVATE: 'institution_memberships.activate',
    DEACTIVATE: 'institution_memberships.deactivate',
    DELETE: 'institution_memberships.delete',
  },
  ACADEMIC_PERIODS: {
    READ: 'academic_periods.read',
    CREATE: 'academic_periods.create',
    UPDATE: 'academic_periods.update',
    DELETE: 'academic_periods.delete',
    ACTIVATE: 'academic_periods.activate',
    DEACTIVATE: 'academic_periods.deactivate',
    ARCHIVE: 'academic_periods.archive',
    SELECT_CONTEXT: 'academic_period_context.select',
  },
  ACADEMIC_LEVELS: {
    READ: 'academic_levels.read',
    CREATE: 'academic_levels.create',
    UPDATE: 'academic_levels.update',
    ACTIVATE: 'academic_levels.activate',
    DEACTIVATE: 'academic_levels.deactivate',
    DELETE: 'academic_levels.delete',
  },
  GRADE_LEVELS: {
    READ: 'grade_levels.read',
    CREATE: 'grade_levels.create',
    UPDATE: 'grade_levels.update',
    ACTIVATE: 'grade_levels.activate',
    DEACTIVATE: 'grade_levels.deactivate',
    DELETE: 'grade_levels.delete',
  },
  SUBJECTS: {
    READ: 'subjects.read',
    CREATE: 'subjects.create',
    UPDATE: 'subjects.update',
    ACTIVATE: 'subjects.activate',
    DEACTIVATE: 'subjects.deactivate',
    DELETE: 'subjects.delete',
  },
  COURSES: {
    READ: 'courses.read',
    CREATE: 'courses.create',
    UPDATE: 'courses.update',
    ACTIVATE: 'courses.activate',
    DEACTIVATE: 'courses.deactivate',
    DELETE: 'courses.delete',
  },
  TEACHER_ASSIGNMENTS: {
    READ: 'teacher_assignments.read',
    CREATE: 'teacher_assignments.create',
    UPDATE: 'teacher_assignments.update',
    DELETE: 'teacher_assignments.delete',
  },
  STUDENTS: {
    READ: 'students.read',
    CREATE: 'students.create',
    UPDATE: 'students.update',
    ACTIVATE: 'students.activate',
    DEACTIVATE: 'students.deactivate',
    BULK_IMPORT: 'students.bulk_import',
  },
  ENROLLMENTS: {
    READ: 'enrollments.read',
    CREATE: 'enrollments.create',
    UPDATE: 'enrollments.update',
    BULK_CREATE: 'enrollments.bulk_create',
  },
  ACADEMIC_TRANSITIONS: {
    READ: 'academic_transitions.read',
    MANAGE: 'academic_transitions.manage',
  },
  ACADEMIC_EVALUATION: {
    READ: 'academic_evaluation.read',
    MANAGE: 'academic_evaluation.manage',
    MANAGE_PLATFORM_TEMPLATES: 'academic_evaluation_templates.manage',
  },
  ACADEMIC_PLANNING: {
    READ: 'academic_planning.read',
    CREATE: 'academic_planning.create',
    UPDATE: 'academic_planning.update',
    PUBLISH: 'academic_planning.publish',
    DELETE: 'academic_planning.delete',
  },
  STUDY_PLANS: {
    READ: 'study_plans.read',
    ADOPT: 'study_plans.adopt',
  },
  CLASS_SESSIONS: {
    READ: 'class_sessions.read',
    CREATE: 'class_sessions.create',
    UPDATE: 'class_sessions.update',
  },
  ASSESSMENTS: {
    READ: 'assessments.read',
    CREATE: 'assessments.create',
    UPDATE: 'assessments.update',
    DELETE: 'assessments.delete',
  },
  GRADES: {
    READ: 'grades.read',
    WRITE: 'grades.write',
  },
  ACADEMIC_PERFORMANCE: {
    READ: 'academic_performance.read',
  },
  REPORT_CARDS: {
    READ: 'report_cards.read',
  },
  ATTENDANCE: {
    READ: 'attendance.read',
    WRITE: 'attendance.write',
  },
  ATTENDANCE_JUSTIFICATIONS: {
    SUBMIT: 'attendance_justifications.submit',
    REVIEW: 'attendance_justifications.review',
  },
  REPRESENTATIVE_STUDENTS: {
    READ: 'representative_students.read',
  },
} as const;

type PermissionCatalog = typeof PERMISSIONS;

export type Permission = {
  [Module in keyof PermissionCatalog]: PermissionCatalog[Module][keyof PermissionCatalog[Module]];
}[keyof PermissionCatalog];

export const ALL_PERMISSIONS = Object.freeze([
  ...Object.values(PERMISSIONS.INSTITUTIONS),
  ...Object.values(PERMISSIONS.USERS),
  ...Object.values(PERMISSIONS.INSTITUTION_MEMBERSHIPS),
  ...Object.values(PERMISSIONS.ACADEMIC_PERIODS),
  ...Object.values(PERMISSIONS.ACADEMIC_LEVELS),
  ...Object.values(PERMISSIONS.GRADE_LEVELS),
  ...Object.values(PERMISSIONS.SUBJECTS),
  ...Object.values(PERMISSIONS.COURSES),
  ...Object.values(PERMISSIONS.TEACHER_ASSIGNMENTS),
  ...Object.values(PERMISSIONS.STUDENTS),
  ...Object.values(PERMISSIONS.ENROLLMENTS),
  ...Object.values(PERMISSIONS.ACADEMIC_TRANSITIONS),
  ...Object.values(PERMISSIONS.ACADEMIC_EVALUATION),
  ...Object.values(PERMISSIONS.ACADEMIC_PLANNING),
  ...Object.values(PERMISSIONS.STUDY_PLANS),
  ...Object.values(PERMISSIONS.CLASS_SESSIONS),
  ...Object.values(PERMISSIONS.ASSESSMENTS),
  ...Object.values(PERMISSIONS.GRADES),
  ...Object.values(PERMISSIONS.ACADEMIC_PERFORMANCE),
  ...Object.values(PERMISSIONS.REPORT_CARDS),
  ...Object.values(PERMISSIONS.ATTENDANCE),
  ...Object.values(PERMISSIONS.ATTENDANCE_JUSTIFICATIONS),
  ...Object.values(PERMISSIONS.REPRESENTATIVE_STUDENTS),
] as Permission[]);

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.includes(value as Permission);
}
