import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  InstitutionMembershipRole,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MEMBERSHIP_TO_USER_ROLE: Record<InstitutionMembershipRole, Role> = {
  [InstitutionMembershipRole.ADMIN]: Role.ADMIN,
  [InstitutionMembershipRole.TEACHER]: Role.TEACHER,
};

export async function assertInstitutionExists(
  prisma: PrismaService,
  institutionId: string,
): Promise<void> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true },
  });

  if (!institution) {
    throw new NotFoundException('Institution not found');
  }
}

export async function assertAssignableUser(
  prisma: PrismaService,
  userId: string,
  membershipRole: InstitutionMembershipRole,
): Promise<void> {
  const expectedUserRole = MEMBERSHIP_TO_USER_ROLE[membershipRole];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    throw new NotFoundException('User not found');
  }

  if (!user.isActive) {
    throw new BadRequestException('User account must be active');
  }

  if (user.role !== expectedUserRole) {
    throw new BadRequestException(
      `User account role must be ${expectedUserRole} for this membership`,
    );
  }

  if (user.role === Role.SUPER_ADMIN) {
    throw new BadRequestException(
      'Super admins are not assigned via institution memberships',
    );
  }
}

export function assertMembershipRoleMatchesUser(
  membershipRole: InstitutionMembershipRole,
  userRole: Role,
): void {
  const expected = MEMBERSHIP_TO_USER_ROLE[membershipRole];

  if (userRole !== expected) {
    throw new BadRequestException('Membership role does not match user account role');
  }
}
