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
    summary: 'Full platform access across all institutions and system settings.',
    capabilities: [
      'Full system access',
      'Manage global configurations',
      'Manage all institutions (future modules)',
      'Manage administrators',
      'Access audit logs and system settings',
    ],
    limitations: [],
  },
  [Role.ADMIN]: {
    role: Role.ADMIN,
    label: 'Admin',
    summary: 'Institutional operations and academic structure management.',
    capabilities: [
      'Manage students and teachers',
      'Manage academic structure and periods',
      'Manage reports and institutional operations',
    ],
    limitations: [
      'Cannot manage super admins',
      'Scoped to assigned institution when multi-tenant is enabled',
    ],
  },
  [Role.TEACHER]: {
    role: Role.TEACHER,
    label: 'Teacher',
    summary: 'Manages assigned courses, grades, and attendance.',
    capabilities: [
      'Manage own grades and attendance records',
      'Manage assigned courses and subjects',
      'Access only assigned academic data',
    ],
    limitations: [
      'Cannot access unassigned students or classes',
      'No institutional configuration access',
    ],
  },
  [Role.STUDENT]: {
    role: Role.STUDENT,
    label: 'Student',
    summary: 'Read-only access to personal academic information.',
    capabilities: [
      'View own grades, attendance, schedule, and reports',
    ],
    limitations: [
      'Read-only access',
      'Cannot view other students data',
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
