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
  ProfileProvisioningService,
  type ProvisionedProfile,
} from './profile-provisioning.service';
