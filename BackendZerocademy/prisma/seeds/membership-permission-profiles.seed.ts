import type { PrismaClient } from '@prisma/client';
import { backfillMembershipBaselinePermissionProfiles } from '../../src/common/rbac/permission-profile-assignment-backfill';
import { seedLog } from './seed-logger';

/**
 * Idempotent optional backfill of system baseline profiles onto existing
 * ADMIN/TEACHER institutional memberships. Safe to leave null if skipped;
 * missing assignments do not reduce Phase 4 access because profiles are not
 * authoritative yet.
 */
export async function seedMembershipPermissionProfileAssignments(
  prisma: PrismaClient,
  options?: { dryRun?: boolean },
): Promise<void> {
  if (options?.dryRun) {
    seedLog({
      event: 'MEMBERSHIP_PERMISSION_PROFILE_BACKFILL_DRY_RUN',
      message:
        'Dry run: would backfill system baseline profiles onto null memberships',
    });
    return;
  }

  const result = await backfillMembershipBaselinePermissionProfiles(prisma);
  seedLog({
    event: 'MEMBERSHIP_PERMISSION_PROFILES_BACKFILLED',
    message:
      'Backfilled role-compatible system baseline profiles onto existing memberships',
    metadata: result,
  });
}
