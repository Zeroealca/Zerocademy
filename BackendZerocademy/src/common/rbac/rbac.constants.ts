import { Role } from '@prisma/client';

/** All system roles in hierarchy order (highest privilege first). */
export const SYSTEM_ROLES: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.TEACHER,
  Role.REPRESENTATIVE,
  Role.STUDENT,
] as const;

export const ADMINISTRATIVE_ROLES: readonly Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
] as const;

export const ACADEMIC_ROLES: readonly Role[] = [
  Role.TEACHER,
  Role.STUDENT,
  Role.REPRESENTATIVE,
] as const;

export const ROLES_REQUIRING_PROFILE: readonly Role[] = [
  Role.STUDENT,
  Role.TEACHER,
  Role.REPRESENTATIVE,
] as const;

export interface RoleDefinition {
  role: Role;
  label: string;
  summary: string;
  capabilities: readonly string[];
  limitations: readonly string[];
}

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  [Role.SUPER_ADMIN]: {
    role: Role.SUPER_ADMIN,
    label: 'Super Admin',
    summary:
      'Platform owner: institutions, global catalog, academic calendar, and user provisioning.',
    capabilities: [
      'Create and manage institutions',
      'Create academic levels, grades, subjects, and periods',
      'Activate or deactivate academic periods (one active per regime)',
      'Create all user types and assign institution memberships',
    ],
    limitations: [
      'Does not manage institution operational data (courses, day-to-day assignments)',
    ],
  },
  [Role.ADMIN]: {
    role: Role.ADMIN,
    label: 'Admin',
    summary: 'Institution administrator for students, courses, and academic operations.',
    capabilities: [
      'Create students',
      'Manage courses and parallels for the institution',
      'Select and switch academic period context',
      'View institution academic structures and assignments',
      'Run institution academic period transitions',
    ],
    limitations: [
      'Cannot create global catalog or calendar periods',
      'Cannot assign institution memberships',
      'Cannot manage super admins',
    ],
  },
  [Role.TEACHER]: {
    role: Role.TEACHER,
    label: 'Teacher',
    summary: 'Accesses assigned courses and subjects within the selected academic period.',
    capabilities: [
      'View and manage data for assigned courses and subjects',
      'Select and switch academic period context',
      'Defaults to the active academic period',
    ],
    limitations: [
      'Cannot access unassigned courses or students',
      'No institution or platform configuration access',
    ],
  },
  [Role.STUDENT]: {
    role: Role.STUDENT,
    label: 'Student',
    summary: 'Read-only personal academic data for the selected period.',
    capabilities: [
      'View own grades, subjects, and course information for the selected period',
      'Defaults to the active academic period',
    ],
    limitations: [
      'Read-only access to own records only',
      'Cannot view other students or change institution configuration',
    ],
  },
  [Role.REPRESENTATIVE]: {
    role: Role.REPRESENTATIVE,
    label: 'Representative',
    summary: 'Guardian access to assigned students academic records.',
    capabilities: [
      'View assigned students',
      'View children grades and attendance',
      'Download permitted reports',
    ],
    limitations: [
      'Read-only for linked students',
      'Cannot modify academic records',
    ],
  },
};

/** Metadata key for future permission expansion (resource:action). */
export const PERMISSIONS_METADATA_KEY = 'permissions';
