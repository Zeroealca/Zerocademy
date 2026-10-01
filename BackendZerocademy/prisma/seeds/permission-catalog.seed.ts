import type { PrismaClient } from '@prisma/client';
import { ALL_PERMISSIONS } from '../../src/common/rbac/permission-catalog';
import { ROLE_ALLOWED_PERMISSIONS } from '../../src/common/rbac/role-permissions';
import {
  synchronizePermissionCatalog,
  type PermissionCatalogSyncResult,
} from '../../src/common/rbac/permission-catalog-sync';
import { seedLog } from './seed-logger';

export async function seedPermissionCatalog(
  prisma: PrismaClient,
  options?: { dryRun?: boolean },
): Promise<PermissionCatalogSyncResult | undefined> {
  if (options?.dryRun) {
    seedLog({
      event: 'PERMISSION_CATALOG_SYNC_DRY_RUN',
      message:
        'Dry run: would synchronize code-defined permissions and role boundaries',
      metadata: {
        permissions: ALL_PERMISSIONS.length,
        roles: Object.keys(ROLE_ALLOWED_PERMISSIONS).length,
      },
    });
    return undefined;
  }

  const result = await synchronizePermissionCatalog(prisma);
  seedLog({
    event: 'PERMISSION_CATALOG_SYNCED',
    message: 'Synchronized code-defined permission catalog and role boundaries',
    metadata: {
      permissions: result.permissions,
      roleRelationships: result.roleRelationships,
    },
  });
  return result;
}
