/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application error contract. */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppLoggerService } from '../logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/types/authenticated-user.type';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import {
  evaluateMembershipCapability,
  type MembershipCapabilityEvaluation,
} from './membership-capability.evaluation';
import type { Permission } from './permission-catalog';

export const AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT =
  'AUTHORIZATION_PERMISSION_ENFORCEMENT' as const;

export type PermissionEnforcementDecision =
  | 'ALLOWED'
  | 'DENIED'
  | 'NOT_APPLICABLE'
  | 'ERROR';

export type PermissionEnforcementResult = Readonly<{
  decision: PermissionEnforcementDecision;
  permission: Permission;
  legacyCapable: boolean | null;
  profileAwareCapable: boolean | null;
  reason?: string;
  membershipId?: string;
  permissionProfileKey?: string | null;
}>;

export type RequireMembershipPermissionInput = Readonly<{
  actor: AuthenticatedUser;
  institutionId: string | null | undefined;
  permission: Permission;
  domain: string;
  resourceType: string;
  resourceId?: string;
}>;

/**
 * Reusable membership-scoped permission enforcement foundation.
 *
 * Call only after legacy Role/resource authorization has already allowed the
 * request. Never broadens access; may restrict it. Fail-closed for missing
 * required membership context and resolver/configuration failures.
 */
@Injectable()
export class MembershipPermissionEnforcer {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resolver: EffectivePermissionResolver,
    private readonly logger: AppLoggerService,
  ) {}

  async requireForInstitutionMembership(
    input: RequireMembershipPermissionInput,
  ): Promise<PermissionEnforcementResult> {
    let evaluation: MembershipCapabilityEvaluation;
    try {
      evaluation = await evaluateMembershipCapability(
        this.prisma,
        this.resolver,
        input,
      );
    } catch (error: unknown) {
      const result = this.toResult({
        outcome: 'ERROR',
        permission: input.permission,
        legacyCapable: null,
        profileAwareCapable: null,
        reason: 'ENFORCER_UNEXPECTED_FAILURE',
      });
      this.emit(input, result, error);
      throw new ForbiddenException('Access denied');
    }

    const result = this.interpret(evaluation);
    this.emit(input, result, evaluation.error);

    if (result.decision === 'ALLOWED' || result.decision === 'NOT_APPLICABLE') {
      return result;
    }

    throw new ForbiddenException('Access denied');
  }

  /**
   * @deprecated Use requireForInstitutionMembership. Kept as a narrow
   * compatibility alias while existing internal callers migrate.
   */
  requireMembershipPermission(
    input: RequireMembershipPermissionInput,
  ): Promise<PermissionEnforcementResult> {
    return this.requireForInstitutionMembership(input);
  }

  private interpret(
    evaluation: MembershipCapabilityEvaluation,
  ): PermissionEnforcementResult {
    if (evaluation.outcome === 'NOT_APPLICABLE') {
      if (
        evaluation.reason === 'SUPER_ADMIN_NO_MEMBERSHIP' ||
        evaluation.reason === 'ROLE_NOT_PROFILE_CAPABLE'
      ) {
        return this.toResult({
          ...evaluation,
          outcome: 'NOT_APPLICABLE',
        });
      }

      // ADMIN/TEACHER reached enforcement after legacy allow without the
      // required institution membership / institution context → fail closed.
      return this.toResult({
        ...evaluation,
        outcome: 'ERROR',
        reason:
          evaluation.reason === 'NO_MEMBERSHIP_FOR_INSTITUTION'
            ? 'MISSING_REQUIRED_MEMBERSHIP'
            : evaluation.reason === 'MISSING_INSTITUTION_CONTEXT'
              ? 'MISSING_REQUIRED_INSTITUTION_CONTEXT'
              : evaluation.reason,
      });
    }

    if (evaluation.outcome === 'ERROR') {
      return this.toResult(evaluation);
    }

    if (evaluation.profileAwareCapable === true) {
      return this.toResult({
        ...evaluation,
        outcome: 'ALLOWED',
        reason:
          evaluation.outcome === 'MATCH' ? 'CAPABILITY_GRANTED' : undefined,
      });
    }

    return this.toResult({
      ...evaluation,
      outcome: 'DENIED',
      reason: 'PERMISSION_NOT_GRANTED',
    });
  }

  private toResult(
    evaluation: Pick<
      MembershipCapabilityEvaluation,
      | 'outcome'
      | 'permission'
      | 'legacyCapable'
      | 'profileAwareCapable'
      | 'reason'
      | 'membershipId'
      | 'permissionProfileKey'
    >,
  ): PermissionEnforcementResult {
    const decision: PermissionEnforcementDecision =
      evaluation.outcome === 'MATCH' || evaluation.outcome === 'MISMATCH'
        ? evaluation.profileAwareCapable
          ? 'ALLOWED'
          : 'DENIED'
        : evaluation.outcome === 'ALLOWED'
          ? 'ALLOWED'
          : evaluation.outcome === 'DENIED'
            ? 'DENIED'
            : evaluation.outcome === 'NOT_APPLICABLE'
              ? 'NOT_APPLICABLE'
              : 'ERROR';

    return {
      decision,
      permission: evaluation.permission,
      legacyCapable: evaluation.legacyCapable,
      profileAwareCapable: evaluation.profileAwareCapable,
      reason: evaluation.reason,
      membershipId: evaluation.membershipId,
      permissionProfileKey: evaluation.permissionProfileKey,
    };
  }

  private emit(
    input: RequireMembershipPermissionInput,
    result: PermissionEnforcementResult,
    error?: unknown,
  ): void {
    const level =
      result.decision === 'DENIED' || result.decision === 'ERROR'
        ? 'warn'
        : 'log';
    const payload = {
      context: 'MembershipPermissionEnforcer',
      event: AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
      message: `Authorization permission enforcement ${result.decision}`,
      userId: input.actor.id,
      metadata: {
        decision: result.decision,
        permission: result.permission,
        legacyCapable: result.legacyCapable,
        profileAwareCapable: result.profileAwareCapable,
        reason: result.reason,
        role: input.actor.role,
        membershipId: result.membershipId,
        permissionProfileKey: result.permissionProfileKey,
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
