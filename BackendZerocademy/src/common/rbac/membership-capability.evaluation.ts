import { Role } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import type { EffectivePermissionResolver } from './effective-permission-resolver.service';
import type { Permission } from './permission-catalog';

export type MembershipCapabilityOutcome =
  | 'MATCH'
  | 'MISMATCH'
  | 'NOT_APPLICABLE'
  | 'ERROR'
  | 'ALLOWED'
  | 'DENIED';

export type MembershipCapabilityEvaluation = Readonly<{
  outcome: MembershipCapabilityOutcome;
  permission: Permission;
  legacyCapable: boolean | null;
  profileAwareCapable: boolean | null;
  reason?: string;
  membershipId?: string;
  permissionProfileKey?: string | null;
  error?: unknown;
}>;

export type EvaluateMembershipCapabilityInput = Readonly<{
  actor: AuthenticatedUser;
  institutionId: string | null | undefined;
  permission: Permission;
}>;

/**
 * Shared membership-scoped capability evaluation for Phase 6 observation
 * and Phase 7 enforcement. Does not throw for profile-aware resolution
 * failures; callers decide isolation vs fail-closed.
 */
export async function evaluateMembershipCapability(
  prisma: PrismaService,
  resolver: EffectivePermissionResolver,
  input: EvaluateMembershipCapabilityInput,
): Promise<MembershipCapabilityEvaluation> {
  const { actor, institutionId, permission } = input;

  if (actor.role === Role.SUPER_ADMIN) {
    return {
      outcome: 'NOT_APPLICABLE',
      permission,
      legacyCapable: null,
      profileAwareCapable: null,
      reason: 'SUPER_ADMIN_NO_MEMBERSHIP',
    };
  }

  if (actor.role !== Role.ADMIN && actor.role !== Role.TEACHER) {
    return {
      outcome: 'NOT_APPLICABLE',
      permission,
      legacyCapable: null,
      profileAwareCapable: null,
      reason: 'ROLE_NOT_PROFILE_CAPABLE',
    };
  }

  if (!institutionId) {
    return {
      outcome: 'NOT_APPLICABLE',
      permission,
      legacyCapable: null,
      profileAwareCapable: null,
      reason: 'MISSING_INSTITUTION_CONTEXT',
    };
  }

  const membership = await prisma.institutionMembership.findFirst({
    where: {
      userId: actor.id,
      institutionId,
      isActive: true,
    },
    select: {
      id: true,
      permissionProfile: { select: { key: true } },
    },
  });

  if (!membership) {
    return {
      outcome: 'NOT_APPLICABLE',
      permission,
      legacyCapable: null,
      profileAwareCapable: null,
      reason: 'NO_MEMBERSHIP_FOR_INSTITUTION',
    };
  }

  const legacyCapable = resolver.can(actor.role, permission);

  let profileAwareCapable: boolean;
  try {
    profileAwareCapable = await resolver.canForMembership(
      membership.id,
      permission,
    );
  } catch (error: unknown) {
    return {
      outcome: 'ERROR',
      permission,
      legacyCapable,
      profileAwareCapable: null,
      reason: 'PROFILE_AWARE_RESOLUTION_FAILED',
      membershipId: membership.id,
      permissionProfileKey: membership.permissionProfile?.key ?? null,
      error,
    };
  }

  return {
    outcome: legacyCapable === profileAwareCapable ? 'MATCH' : 'MISMATCH',
    permission,
    legacyCapable,
    profileAwareCapable,
    membershipId: membership.id,
    permissionProfileKey: membership.permissionProfile?.key ?? null,
  };
}
