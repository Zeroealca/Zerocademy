export {
  ACADEMIC_ROLES,
  ADMINISTRATIVE_ROLES,
  PERMISSIONS_METADATA_KEY,
  ROLE_DEFINITIONS,
  ROLES_REQUIRING_PROFILE,
  SYSTEM_ROLES,
  type RoleDefinition,
} from './rbac.constants';
export type {
  OwnershipQueryScope,
  ResourceOwnershipContext,
} from './ownership.types';
export { RoleUtils } from './role.utils';
export {
  ALL_PERMISSIONS,
  PERMISSIONS,
  isPermission,
  type Permission,
} from './permission-catalog';
export {
  ROLE_ALLOWED_PERMISSIONS,
  ROLE_BASELINE_PERMISSIONS,
  assertRolePermissionCatalogIntegrity,
  type RolePermissionMap,
} from './role-permissions';
export {
  EffectivePermissionResolver,
  type MembershipEffectivePermissionComparison,
} from './effective-permission-resolver.service';
export {
  PermissionProfileAssignmentService,
  type MembershipPermissionProfileAssignment,
} from './permission-profile-assignment.service';
export { backfillMembershipBaselinePermissionProfiles } from './permission-profile-assignment-backfill';
export {
  AUTHORIZATION_DUAL_EVALUATION_EVENT,
  PermissionDualEvaluationObserver,
  type DualEvaluationObservation,
  type DualEvaluationOutcome,
  type ObserveMembershipCapabilityInput,
} from './permission-dual-evaluation.observer';
export {
  AUTHORIZATION_PERMISSION_ENFORCEMENT_EVENT,
  MembershipPermissionEnforcer,
  type PermissionEnforcementDecision,
  type PermissionEnforcementResult,
  type RequireMembershipPermissionInput,
} from './membership-permission-enforcer.service';
export {
  ProfileProvisioningService,
  type ProvisionedProfile,
} from './profile-provisioning.service';
