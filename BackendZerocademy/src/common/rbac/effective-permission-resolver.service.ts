/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InstitutionMembershipRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isPermission, type Permission } from './permission-catalog';
import { SYSTEM_PERMISSION_PROFILES } from './permission-profile-catalog';
import {
  ROLE_ALLOWED_PERMISSIONS,
  ROLE_BASELINE_PERMISSIONS,
} from './role-permissions';

export type MembershipEffectivePermissionComparison = Readonly<{
  membershipId: string;
  institutionId: string;
  userRole: Role;
  membershipRole: InstitutionMembershipRole;
  membershipRoleMatchesUserRole: boolean;
  isActive: boolean;
  permissionProfileId: string | null;
  permissionProfileKey: string | null;
  legacyEffective: readonly Permission[];
  profileAwareEffective: readonly Permission[];
  matches: boolean;
}>;

const PROFILE_CAPABLE_ROLES = new Set<Role>([Role.ADMIN, Role.TEACHER]);

const MEMBERSHIP_ROLE_TO_USER_ROLE: Record<InstitutionMembershipRole, Role> = {
  [InstitutionMembershipRole.ADMIN]: Role.ADMIN,
  [InstitutionMembershipRole.TEACHER]: Role.TEACHER,
};

/**
 * Phase 1–5 permission resolution foundation.
 *
 * Legacy Role APIs remain in-memory baseline resolution.
 * Membership-aware APIs load live profile composition with a safe null-profile
 * baseline fallback and always intersect the code-defined Role allowed ceiling.
 *
 * Results are not wired to guards, JWT claims, or production authorization.
 */
@Injectable()
export class EffectivePermissionResolver {
  constructor(private readonly prisma: PrismaService) {}

  resolve(role: Role): readonly Permission[] {
    return this.intersectWithAllowed(role, ROLE_BASELINE_PERMISSIONS[role]);
  }

  can(role: Role, permission: Permission): boolean {
    return this.resolve(role).includes(permission);
  }

  canAny(role: Role, permissions: readonly Permission[]): boolean {
    return permissions.some((permission) => this.can(role, permission));
  }

  async resolveForMembership(
    membershipId: string,
  ): Promise<readonly Permission[]> {
    const membership = await this.loadMembershipOrThrow(membershipId);
    return this.resolveLoadedMembership(membership);
  }

  async canForMembership(
    membershipId: string,
    permission: Permission,
  ): Promise<boolean> {
    const effective = await this.resolveForMembership(membershipId);
    return effective.includes(permission);
  }

  async canAnyForMembership(
    membershipId: string,
    permissions: readonly Permission[],
  ): Promise<boolean> {
    const effective = await this.resolveForMembership(membershipId);
    return permissions.some((permission) => effective.includes(permission));
  }

  /**
   * Internal/test dual evaluation. Compares legacy baseline resolution for the
   * membership's authoritative User.role against profile-aware resolution.
   * Not exposed as an HTTP endpoint.
   */
  async compareMembershipResolution(
    membershipId: string,
  ): Promise<MembershipEffectivePermissionComparison> {
    const membership = await this.loadMembershipOrThrow(membershipId);
    const userRole = membership.user.role;
    const legacyEffective = this.resolve(userRole);
    const profileAwareEffective = this.resolveLoadedMembership(membership);
    const expectedUserRole = MEMBERSHIP_ROLE_TO_USER_ROLE[membership.role];

    return {
      membershipId: membership.id,
      institutionId: membership.institutionId,
      userRole,
      membershipRole: membership.role,
      membershipRoleMatchesUserRole: expectedUserRole === userRole,
      isActive: membership.isActive,
      permissionProfileId: membership.permissionProfile?.id ?? null,
      permissionProfileKey: membership.permissionProfile?.key ?? null,
      legacyEffective,
      profileAwareEffective,
      matches: this.samePermissionSet(legacyEffective, profileAwareEffective),
    };
  }

  private resolveLoadedMembership(
    membership: LoadedMembership,
  ): readonly Permission[] {
    const userRole = membership.user.role;
    const profile = membership.permissionProfile;

    if (!profile) {
      return this.resolve(userRole);
    }

    this.assertPersistedProfileUsable(profile, userRole);

    const profilePermissions = profile.permissions
      .map((row) => row.permission.key)
      .filter(isPermission);

    return this.intersectWithAllowed(userRole, profilePermissions);
  }

  private assertPersistedProfileUsable(
    profile: NonNullable<LoadedMembership['permissionProfile']>,
    userRole: Role,
  ): void {
    if (!PROFILE_CAPABLE_ROLES.has(userRole)) {
      throw new BadRequestException(
        `User role ${userRole} is not eligible for profile-aware permission resolution`,
      );
    }

    if (profile.role !== userRole) {
      throw new BadRequestException(
        `Persisted permission profile role ${profile.role} is incompatible with authoritative User.role ${userRole}`,
      );
    }

    if (!profile.isSystem) {
      throw new BadRequestException(
        'Only system-owned permission profiles may be used for membership resolution in this phase',
      );
    }

    const knownSystemKey = SYSTEM_PERMISSION_PROFILES.some(
      (definition) =>
        definition.key === profile.key && definition.role === profile.role,
    );

    if (!knownSystemKey) {
      throw new BadRequestException(
        `Permission profile ${profile.key} is not a trusted system baseline profile`,
      );
    }
  }

  private async loadMembershipOrThrow(
    membershipId: string,
  ): Promise<LoadedMembership> {
    const membership = await this.prisma.institutionMembership.findUnique({
      where: { id: membershipId },
      select: {
        id: true,
        institutionId: true,
        role: true,
        isActive: true,
        user: { select: { role: true } },
        permissionProfile: {
          select: {
            id: true,
            key: true,
            role: true,
            isSystem: true,
            permissions: {
              select: {
                permission: { select: { key: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Institution membership not found');
    }

    return membership;
  }

  private intersectWithAllowed(
    role: Role,
    permissions: readonly Permission[],
  ): readonly Permission[] {
    const allowed = new Set(ROLE_ALLOWED_PERMISSIONS[role]);
    return permissions.filter((permission) => allowed.has(permission));
  }

  private samePermissionSet(
    left: readonly Permission[],
    right: readonly Permission[],
  ): boolean {
    if (left.length !== right.length) {
      return false;
    }
    const rightSet = new Set(right);
    return left.every((permission) => rightSet.has(permission));
  }
}

type LoadedMembership = {
  id: string;
  institutionId: string;
  role: InstitutionMembershipRole;
  isActive: boolean;
  user: { role: Role };
  permissionProfile: {
    id: string;
    key: string;
    role: Role;
    isSystem: boolean;
    permissions: { permission: { key: string } }[];
  } | null;
};
