import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AcademicRegime, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { RoleUtils } from './role.utils';

export async function resolveActorInstitutionId(
  prisma: PrismaService,
  actor: AuthenticatedUser,
): Promise<string | undefined> {
  if (actor.institutionId) {
    return actor.institutionId;
  }

  if (actor.role !== Role.ADMIN) {
    return undefined;
  }

  const membership = await prisma.institutionMembership.findFirst({
    where: {
      userId: actor.id,
      role: 'ADMIN',
      isActive: true,
    },
    select: { institutionId: true },
  });

  return membership?.institutionId;
}

export async function assertActorCanAccessPeriod(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  period: { id: string; institutionId: string | null; regime: AcademicRegime },
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  const institutionId = await resolveActorInstitutionId(prisma, actor);

  if (actor.role === Role.ADMIN) {
    if (period.institutionId && institutionId && period.institutionId !== institutionId) {
      throw new ForbiddenException(
        'Academic period does not belong to your institution',
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

    if (
      period.institutionId &&
      institutionId &&
      period.institutionId === institutionId
    ) {
      return;
    }

    throw new ForbiddenException('Academic period is not accessible');
  }

  if (actor.role === Role.STUDENT) {
    if (
      period.institutionId &&
      institutionId &&
      period.institutionId === institutionId
    ) {
      return;
    }

    throw new ForbiddenException('Academic period is not accessible');
  }

  throw new NotFoundException('Academic period not found');
}
