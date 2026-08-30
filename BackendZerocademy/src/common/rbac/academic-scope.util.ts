import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  AcademicRegime,
  EnrollmentStatus,
  InstitutionMembershipRole,
  Role,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { RoleUtils } from './role.utils';

/**
 * Resolves a single default institution for the actor (JWT claim or first active membership).
 * Prefer {@link resolveActorInstitutionIds} / {@link assertActorCanAccessInstitution}
 * when the actor may belong to more than one institution.
 */
export async function resolveActorInstitutionId(
  prisma: PrismaService,
  actor: AuthenticatedUser,
): Promise<string | undefined> {
  if (actor.institutionId) {
    return actor.institutionId;
  }

  if (actor.role !== Role.ADMIN && actor.role !== Role.TEACHER) {
    return undefined;
  }

  const membershipRole =
    actor.role === Role.ADMIN
      ? InstitutionMembershipRole.ADMIN
      : InstitutionMembershipRole.TEACHER;

  const membership = await prisma.institutionMembership.findFirst({
    where: {
      userId: actor.id,
      role: membershipRole,
      isActive: true,
    },
    select: { institutionId: true },
  });

  return membership?.institutionId;
}

/** All institution ids the actor may operate on via profile or active memberships. */
export async function resolveActorInstitutionIds(
  prisma: PrismaService,
  actor: AuthenticatedUser,
): Promise<string[]> {
  const ids = new Set<string>();

  if (actor.institutionId) {
    ids.add(actor.institutionId);
  }

  if (actor.role === Role.ADMIN || actor.role === Role.TEACHER) {
    const membershipRole =
      actor.role === Role.ADMIN
        ? InstitutionMembershipRole.ADMIN
        : InstitutionMembershipRole.TEACHER;

    const memberships = await prisma.institutionMembership.findMany({
      where: {
        userId: actor.id,
        role: membershipRole,
        isActive: true,
      },
      select: { institutionId: true },
    });

    for (const membership of memberships) {
      ids.add(membership.institutionId);
    }
  }

  return [...ids];
}

/**
 * Ensures the actor can access the given institution.
 * SUPER_ADMIN: always. ADMIN: active ADMIN membership (or JWT institutionId).
 * Hides cross-tenant existence with 404.
 */
export async function assertActorCanAccessInstitution(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  institutionId: string,
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  if (actor.role === Role.ADMIN) {
    if (actor.institutionId === institutionId) {
      return;
    }

    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId: actor.id,
        institutionId,
        role: InstitutionMembershipRole.ADMIN,
        isActive: true,
      },
      select: { id: true },
    });

    if (membership) {
      return;
    }

    throw new NotFoundException('Institution not found');
  }

  if (actor.role === Role.TEACHER && actor.profileId) {
    if (actor.institutionId === institutionId) {
      return;
    }

    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId: actor.id,
        institutionId,
        role: InstitutionMembershipRole.TEACHER,
        isActive: true,
      },
      select: { id: true },
    });

    if (membership) {
      return;
    }

    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        institutionId,
        teacherId: actor.profileId,
      },
      select: { id: true },
    });

    if (assignment) {
      return;
    }
  }

  if (actor.role === Role.STUDENT && actor.profileId) {
    if (actor.institutionId === institutionId) {
      return;
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: actor.profileId,
        course: { institutionId },
        status: EnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (enrollment) {
      return;
    }
  }

  throw new NotFoundException('Institution not found');
}

export async function assertActorCanAccessPeriod(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  period: { id: string; institutionId: string | null; regime: AcademicRegime },
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  if (actor.role === Role.ADMIN) {
    if (period.institutionId) {
      await assertActorCanAccessInstitution(
        prisma,
        actor,
        period.institutionId,
      );
    }
    return;
  }

  if (actor.role === Role.TEACHER && actor.profileId) {
    const hasAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        academicPeriodId: period.id,
        teacherId: actor.profileId,
      },
      select: { id: true },
    });

    if (hasAssignment) {
      return;
    }

    if (period.institutionId) {
      try {
        await assertActorCanAccessInstitution(
          prisma,
          actor,
          period.institutionId,
        );
        return;
      } catch {
        // fall through to forbidden
      }
    }

    throw new ForbiddenException('Academic period is not accessible');
  }

  if (actor.role === Role.STUDENT) {
    if (period.institutionId) {
      try {
        await assertActorCanAccessInstitution(
          prisma,
          actor,
          period.institutionId,
        );
        return;
      } catch {
        // fall through
      }
    }

    throw new ForbiddenException('Academic period is not accessible');
  }

  throw new NotFoundException('Academic period not found');
}
