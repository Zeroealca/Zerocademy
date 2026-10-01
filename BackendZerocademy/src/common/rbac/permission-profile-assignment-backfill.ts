/* eslint-disable @typescript-eslint/only-throw-error -- missing system baselines are deliberate configuration errors. */
import { PrismaClient, Role } from '@prisma/client';
import { SYSTEM_PERMISSION_PROFILES } from './permission-profile-catalog';

/**
 * Idempotently assigns role-compatible system baseline profiles to existing
 * ADMIN/TEACHER memberships that still have a null assignment.
 *
 * Uses authoritative User.role for compatibility. Does not overwrite an
 * existing assignment and never assigns profiles for SUPER_ADMIN, STUDENT, or
 * REPRESENTATIVE (those roles do not use InstitutionMembership in this repo).
 */
export async function backfillMembershipBaselinePermissionProfiles(
  prisma: PrismaClient,
): Promise<{ scanned: number; assigned: number; skipped: number }> {
  const baselineKeys = SYSTEM_PERMISSION_PROFILES.map((profile) => profile.key);
  const profiles = await prisma.permissionProfile.findMany({
    where: { key: { in: baselineKeys }, isSystem: true },
    select: { id: true, key: true, role: true },
  });

  const profileIdByRole = new Map<Role, string>();
  for (const definition of SYSTEM_PERMISSION_PROFILES) {
    const persisted = profiles.find(
      (profile) =>
        profile.key === definition.key && profile.role === definition.role,
    );
    if (!persisted) {
      throw new Error(
        `System baseline profile was not persisted: ${definition.key}`,
      );
    }
    profileIdByRole.set(definition.role, persisted.id);
  }

  const memberships = await prisma.institutionMembership.findMany({
    where: { permissionProfileId: null },
    select: {
      id: true,
      user: { select: { role: true } },
    },
  });

  let assigned = 0;
  let skipped = 0;

  for (const membership of memberships) {
    const profileId = profileIdByRole.get(membership.user.role);
    if (!profileId) {
      skipped += 1;
      continue;
    }

    await prisma.institutionMembership.update({
      where: { id: membership.id },
      data: { permissionProfileId: profileId },
    });
    assigned += 1;
  }

  return {
    scanned: memberships.length,
    assigned,
    skipped,
  };
}
