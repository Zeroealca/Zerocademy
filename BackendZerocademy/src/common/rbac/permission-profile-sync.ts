/* eslint-disable @typescript-eslint/only-throw-error -- profile synchronization failures are deliberate configuration errors. */
import { PrismaClient } from '@prisma/client';
import {
  assertSystemPermissionProfileCatalogIntegrity,
  SYSTEM_PERMISSION_PROFILES,
} from './permission-profile-catalog';

export async function synchronizeSystemPermissionProfiles(
  prisma: PrismaClient,
): Promise<{ profiles: number; profilePermissions: number }> {
  assertSystemPermissionProfileCatalogIntegrity();
  // Neon / remote latency needs more than Prisma's 5s interactive default.
  return await prisma.$transaction(
    async (transaction) => {
      for (const profile of SYSTEM_PERMISSION_PROFILES) {
        await transaction.permissionProfile.upsert({
          where: { key: profile.key },
          create: {
            key: profile.key,
            name: profile.name,
            role: profile.role,
            isSystem: true,
          },
          update: { name: profile.name, role: profile.role, isSystem: true },
        });
      }
      const profiles = await transaction.permissionProfile.findMany({
        where: {
          key: {
            in: SYSTEM_PERMISSION_PROFILES.map((profile) => profile.key),
          },
        },
        select: { id: true, key: true },
      });
      const permissions = await transaction.permission.findMany({
        select: { id: true, key: true },
      });
      const profileIdByKey = new Map(
        profiles.map((profile) => [profile.key, profile.id]),
      );
      const permissionIdByKey = new Map(
        permissions.map((permission) => [permission.key, permission.id]),
      );
      let profilePermissions = 0;
      for (const profile of SYSTEM_PERMISSION_PROFILES) {
        const profileId = profileIdByKey.get(profile.key);
        if (!profileId)
          throw new Error(`System profile was not persisted: ${profile.key}`);
        const permissionIds = profile.permissions.map((key) => {
          const permissionId = permissionIdByKey.get(key);
          if (!permissionId)
            throw new Error(`Profile permission was not persisted: ${key}`);
          return permissionId;
        });
        await transaction.permissionProfilePermission.deleteMany({
          where: {
            permissionProfileId: profileId,
            permissionId: { notIn: permissionIds },
          },
        });
        await transaction.permissionProfilePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            permissionProfileId: profileId,
            permissionId,
          })),
          skipDuplicates: true,
        });
        profilePermissions += permissionIds.length;
      }
      return { profiles: profiles.length, profilePermissions };
    },
    { timeout: 60_000 },
  );
}
