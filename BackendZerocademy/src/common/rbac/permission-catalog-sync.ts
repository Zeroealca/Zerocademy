/* eslint-disable @typescript-eslint/only-throw-error -- configuration integrity failures are deliberate synchronization errors. */
import { PrismaClient, Role } from '@prisma/client';
import { ALL_PERMISSIONS } from './permission-catalog';
import {
  assertRolePermissionCatalogIntegrity,
  ROLE_ALLOWED_PERMISSIONS,
} from './role-permissions';

export interface PermissionCatalogSyncResult {
  permissions: number;
  roleRelationships: number;
}

/**
 * Mirrors the source-controlled permission catalog and role boundaries into
 * durable reference rows. It intentionally never reads persisted rows as an
 * authorization source and never removes historical Permission records.
 */
export async function synchronizePermissionCatalog(
  prisma: PrismaClient,
): Promise<PermissionCatalogSyncResult> {
  assertRolePermissionCatalogIntegrity();

  // Neon / remote latency needs more than Prisma's 5s interactive default.
  return await prisma.$transaction(
    async (transaction) => {
      await Promise.all(
        ALL_PERMISSIONS.map((key) =>
          transaction.permission.upsert({
            where: { key },
            create: { key },
            update: {},
          }),
        ),
      );

      const persistedPermissions = await transaction.permission.findMany({
        where: { key: { in: [...ALL_PERMISSIONS] } },
        select: { id: true, key: true },
      });
      const permissionIdByKey = new Map(
        persistedPermissions.map((permission) => [
          permission.key,
          permission.id,
        ]),
      );

      if (permissionIdByKey.size !== ALL_PERMISSIONS.length) {
        throw new Error(
          'Permission catalog synchronization did not persist every key',
        );
      }

      let roleRelationships = 0;

      for (const role of Object.values(Role)) {
        const permissionIds = ROLE_ALLOWED_PERMISSIONS[role].map((key) => {
          const permissionId = permissionIdByKey.get(key);

          if (!permissionId) {
            throw new Error(
              `Role ${role} references a permission that was not persisted: ${key}`,
            );
          }

          return permissionId;
        });

        await transaction.roleAllowedPermission.deleteMany({
          where: {
            role,
            permissionId: { notIn: permissionIds },
          },
        });
        await transaction.roleAllowedPermission.createMany({
          data: permissionIds.map((permissionId) => ({ role, permissionId })),
          skipDuplicates: true,
        });
        roleRelationships += permissionIds.length;
      }

      return {
        permissions: persistedPermissions.length,
        roleRelationships,
      };
    },
    { timeout: 60_000 },
  );
}
