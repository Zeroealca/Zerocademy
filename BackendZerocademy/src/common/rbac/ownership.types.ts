import { Role } from '@prisma/client';

/**
 * Ownership context attached to requests for resource-level filtering.
 * Domain modules will populate and enforce this in services (not in guards alone).
 */
export interface ResourceOwnershipContext {
  userId: string;
  role: Role;
  profileId?: string;
  institutionId?: string;
}

/**
 * Scope descriptor for query filters — extend per domain module.
 */
export interface OwnershipQueryScope {
  userId: string;
  role: Role;
  profileId?: string;
  institutionId?: string;
  /** When true, service must restrict queries to resources owned by the actor. */
  enforceOwnership: boolean;
}
