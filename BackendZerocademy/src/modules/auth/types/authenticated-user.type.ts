import { Role } from '@prisma/client';

export type AcademicProfileType = 'student' | 'teacher' | 'representative';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  /** Academic profile id when role is STUDENT, TEACHER, or REPRESENTATIVE. */
  profileId?: string;
  profileType?: AcademicProfileType;
  /** Institution scope — populated when multi-tenant assignment exists. */
  institutionId?: string;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  profileId?: string;
  profileType?: AcademicProfileType;
  institutionId?: string;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
}
