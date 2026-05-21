import { Role } from '@prisma/client';
import {
  ADMINISTRATIVE_ROLES,
  ACADEMIC_ROLES,
  ROLES_REQUIRING_PROFILE,
  SYSTEM_ROLES,
} from './rbac.constants';
import type { ResourceOwnershipContext } from './ownership.types';

export class RoleUtils {
  static isSuperAdmin(role: Role): boolean {
    return role === Role.SUPER_ADMIN;
  }

  static isAdministrative(role: Role): boolean {
    return ADMINISTRATIVE_ROLES.includes(role);
  }

  static isAcademicRole(role: Role): boolean {
    return ACADEMIC_ROLES.includes(role);
  }

  static requiresAcademicProfile(role: Role): boolean {
    return ROLES_REQUIRING_PROFILE.includes(role);
  }

  static hasRole(
    userRole: Role,
    allowedRoles: readonly Role[],
    options?: { strict?: boolean },
  ): boolean {
    if (!options?.strict && RoleUtils.isSuperAdmin(userRole)) {
      return true;
    }

    return allowedRoles.includes(userRole);
  }

  static hasAnyRole(userRole: Role, ...allowedRoles: Role[]): boolean {
    return RoleUtils.hasRole(userRole, allowedRoles);
  }

  static assertRole(userRole: Role, allowedRoles: readonly Role[]): void {
    if (!RoleUtils.hasRole(userRole, allowedRoles)) {
      throw new Error('Insufficient role permissions');
    }
  }

  static buildOwnershipContext(
    input: ResourceOwnershipContext,
  ): ResourceOwnershipContext {
    return {
      userId: input.userId,
      role: input.role,
      profileId: input.profileId,
      institutionId: input.institutionId,
    };
  }

  /**
   * Teachers, students, and representatives must be scoped to owned/assigned data.
   * Admins are institution-scoped when multi-tenant rules apply (future).
   */
  static shouldEnforceOwnership(role: Role): boolean {
    return (
      role === Role.TEACHER ||
      role === Role.STUDENT ||
      role === Role.REPRESENTATIVE
    );
  }

  static canViewSuperAdmins(actorRole: Role): boolean {
    return RoleUtils.isSuperAdmin(actorRole);
  }

  /** Roles an actor may assign when creating or updating users. */
  static getAssignableRoles(actorRole: Role): readonly Role[] {
    if (RoleUtils.isSuperAdmin(actorRole)) {
      return SYSTEM_ROLES;
    }

    if (actorRole === Role.ADMIN) {
      return [Role.STUDENT];
    }

    return [];
  }

  /** Platform catalog and calendar configuration (not institution day-to-day ops). */
  static canManagePlatformCatalog(role: Role): boolean {
    return role === Role.SUPER_ADMIN;
  }

  /** Institution operational data: courses, assignments, student enrollment context. */
  static canManageInstitutionOperations(role: Role): boolean {
    return role === Role.ADMIN;
  }

  static canSelectAcademicPeriod(role: Role): boolean {
    return (
      role === Role.ADMIN ||
      role === Role.TEACHER ||
      role === Role.STUDENT
    );
  }

  static canAssignRole(actorRole: Role, targetRole: Role): boolean {
    return RoleUtils.getAssignableRoles(actorRole).includes(targetRole);
  }

  /** Whether the actor may view or mutate a user with the given role. */
  static canManageUser(actorRole: Role, targetUserRole: Role): boolean {
    if (RoleUtils.isSuperAdmin(actorRole)) {
      return true;
    }

    if (actorRole === Role.ADMIN) {
      return targetUserRole !== Role.SUPER_ADMIN;
    }

    return false;
  }
}
