import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import {
  evaluateMembershipCapability,
  type MembershipCapabilityEvaluation,
} from './membership-capability.evaluation';
import type { Permission } from './permission-catalog';

export const AUTHORIZATION_DUAL_EVALUATION_EVENT =
  'AUTHORIZATION_DUAL_EVALUATION' as const;

export type DualEvaluationOutcome =
  | 'MATCH'
  | 'MISMATCH'
  | 'NOT_APPLICABLE'
  | 'ERROR';

export type DualEvaluationObservation = Readonly<{
  outcome: DualEvaluationOutcome;
  permission: Permission;
  legacyCapable: boolean | null;
  profileAwareCapable: boolean | null;
  reason?: string;
  membershipId?: string;
  permissionProfileKey?: string | null;
}>;

export type ObserveMembershipCapabilityInput = Readonly<{
  actor: AuthenticatedUser;
  institutionId: string | null | undefined;
  permission: Permission;
  domain: string;
  resourceType: string;
  resourceId?: string;
}>;

/**
 * Non-blocking dual evaluation for Phase 6 pilots.
 * Never changes allow/deny decisions; isolates profile-aware failures.
 */
@Injectable()
export class PermissionDualEvaluationObserver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: EffectivePermissionResolver,
    private readonly logger: AppLoggerService,
  ) {}

  async observeMembershipCapability(
    input: ObserveMembershipCapabilityInput,
  ): Promise<DualEvaluationObservation> {
    try {
      const evaluation = await evaluateMembershipCapability(
        this.prisma,
        this.resolver,
        input,
      );
      const observation = toObservation(evaluation);
      this.emit(input, observation, evaluation.error);
      return observation;
    } catch (error: unknown) {
      const observation: DualEvaluationObservation = {
        outcome: 'ERROR',
        permission: input.permission,
        legacyCapable: null,
        profileAwareCapable: null,
        reason: 'OBSERVER_UNEXPECTED_FAILURE',
      };
      this.emit(input, observation, error);
      return observation;
    }
  }

  private emit(
    input: ObserveMembershipCapabilityInput,
    observation: DualEvaluationObservation,
    error?: unknown,
  ): void {
    const level =
      observation.outcome === 'ERROR' || observation.outcome === 'MISMATCH'
        ? 'warn'
        : 'log';
    const payload = {
      context: 'PermissionDualEvaluationObserver',
      event: AUTHORIZATION_DUAL_EVALUATION_EVENT,
      message: `Authorization dual evaluation ${observation.outcome}`,
      userId: input.actor.id,
      metadata: {
        outcome: observation.outcome,
        permission: observation.permission,
        legacyCapable: observation.legacyCapable,
        profileAwareCapable: observation.profileAwareCapable,
        reason: observation.reason,
        role: input.actor.role,
        membershipId: observation.membershipId,
        permissionProfileKey: observation.permissionProfileKey,
        domain: input.domain,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        institutionId: input.institutionId ?? null,
        errorName:
          error instanceof Error
            ? error.name
            : error
              ? 'UnknownError'
              : undefined,
        errorMessage:
          error instanceof Error
            ? error.message
            : error
              ? String(error)
              : undefined,
      },
    };

    if (level === 'warn') {
      this.logger.warn(payload);
      return;
    }
    this.logger.log(payload);
  }
}

function toObservation(
  evaluation: MembershipCapabilityEvaluation,
): DualEvaluationObservation {
  const outcome: DualEvaluationOutcome =
    evaluation.outcome === 'ALLOWED' || evaluation.outcome === 'DENIED'
      ? evaluation.outcome === 'ALLOWED'
        ? 'MATCH'
        : 'MISMATCH'
      : evaluation.outcome;

  return {
    outcome,
    permission: evaluation.permission,
    legacyCapable: evaluation.legacyCapable,
    profileAwareCapable: evaluation.profileAwareCapable,
    reason: evaluation.reason,
    membershipId: evaluation.membershipId,
    permissionProfileKey: evaluation.permissionProfileKey,
  };
}
