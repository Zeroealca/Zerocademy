/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SYSTEM_PERMISSION_PROFILES } from './permission-profile-catalog';

export type MembershipPermissionProfileAssignment = Readonly<{
  membershipId: string;
  institutionId: string;
  userId: string;
  userRole: Role;
  permissionProfileId: string | null;
  permissionProfileKey: string | null;
  permissionProfileRole: Role | null;
}>;

const ASSIGNABLE_PROFILE_ROLES = new Set<Role>([Role.ADMIN, Role.TEACHER]);

/**
 * Domain API for optional InstitutionMembership → PermissionProfile assignment.
 * Validates Role compatibility against authoritative User.role. Does not enforce
 * caller authorization and does not affect production access decisions.
 */
@Injectable()
export class PermissionProfileAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getAssignment(
    membershipId: string,
  ): Promise<MembershipPermissionProfileAssignment> {
    const membership = await this.findMembershipOrThrow(membershipId);
    return this.toAssignment(membership);
  }

  async assignProfile(
    membershipId: string,
    permissionProfileId: string,
  ): Promise<MembershipPermissionProfileAssignment> {
    const membership = await this.findMembershipOrThrow(membershipId);
    const profile = await this.prisma.permissionProfile.findUnique({
      where: { id: permissionProfileId },
      select: { id: true, key: true, role: true, isSystem: true },
    });

    if (!profile) {
      throw new NotFoundException('Permission profile not found');
    }

    this.assertProfileAssignable(profile, membership.user.role);

    const updated = await this.prisma.institutionMembership.update({
      where: { id: membershipId },
      data: { permissionProfileId: profile.id },
      include: {
        user: { select: { id: true, role: true } },
        permissionProfile: { select: { id: true, key: true, role: true } },
      },
    });

    return this.toAssignment(updated);
  }

  async clearAssignment(
    membershipId: string,
  ): Promise<MembershipPermissionProfileAssignment> {
    await this.findMembershipOrThrow(membershipId);

    const updated = await this.prisma.institutionMembership.update({
      where: { id: membershipId },
      data: { permissionProfileId: null },
      include: {
        user: { select: { id: true, role: true } },
        permissionProfile: { select: { id: true, key: true, role: true } },
      },
    });

    return this.toAssignment(updated);
  }

  private assertProfileAssignable(
    profile: { key: string; role: Role; isSystem: boolean },
    userRole: Role,
  ): void {
    if (!ASSIGNABLE_PROFILE_ROLES.has(userRole)) {
      throw new BadRequestException(
        `User role ${userRole} is not eligible for permission profile assignment`,
      );
    }

    if (profile.role !== userRole) {
      throw new BadRequestException(
        `Permission profile role ${profile.role} is incompatible with authoritative User.role ${userRole}`,
      );
    }

    if (!profile.isSystem) {
      throw new BadRequestException(
        'Only system-owned permission profiles may be assigned in this phase',
      );
    }

    const knownSystemKey = SYSTEM_PERMISSION_PROFILES.some(
      (definition) =>
        definition.key === profile.key && definition.role === profile.role,
    );

    if (!knownSystemKey) {
      throw new BadRequestException(
        `Permission profile ${profile.key} is not an assignable system baseline profile`,
      );
    }
  }

  private async findMembershipOrThrow(membershipId: string) {
    const membership = await this.prisma.institutionMembership.findUnique({
      where: { id: membershipId },
      include: {
        user: { select: { id: true, role: true } },
        permissionProfile: { select: { id: true, key: true, role: true } },
      },
    });

    if (!membership) {
      throw new NotFoundException('Institution membership not found');
    }

    return membership;
  }

  private toAssignment(membership: {
    id: string;
    institutionId: string;
    userId: string;
    user: { role: Role };
    permissionProfile: { id: string; key: string; role: Role } | null;
  }): MembershipPermissionProfileAssignment {
    return {
      membershipId: membership.id,
      institutionId: membership.institutionId,
      userId: membership.userId,
      userRole: membership.user.role,
      permissionProfileId: membership.permissionProfile?.id ?? null,
      permissionProfileKey: membership.permissionProfile?.key ?? null,
      permissionProfileRole: membership.permissionProfile?.role ?? null,
    };
  }
}
