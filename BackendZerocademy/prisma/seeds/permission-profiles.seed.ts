import type { PrismaClient } from '@prisma/client';
import { SYSTEM_PERMISSION_PROFILES } from '../../src/common/rbac/permission-profile-catalog';
import { synchronizeSystemPermissionProfiles } from '../../src/common/rbac/permission-profile-sync';
import { seedLog } from './seed-logger';

export async function seedPermissionProfiles(
  prisma: PrismaClient,
  options?: { dryRun?: boolean },
): Promise<void> {
  if (options?.dryRun) {
    seedLog({
      event: 'PERMISSION_PROFILE_SYNC_DRY_RUN',
      message: 'Dry run: would synchronize system permission profiles',
      metadata: { profiles: SYSTEM_PERMISSION_PROFILES.length },
    });
    return;
  }
  const result = await synchronizeSystemPermissionProfiles(prisma);
  seedLog({
    event: 'PERMISSION_PROFILES_SYNCED',
    message: 'Synchronized code-defined system permission profiles',
    metadata: result,
  });
}
