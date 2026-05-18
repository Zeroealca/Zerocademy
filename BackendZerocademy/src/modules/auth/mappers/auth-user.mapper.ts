import { Role } from '@prisma/client';
import type { AcademicProfileType } from '../types/authenticated-user.type';
import { AuthUserResponseDto } from '../dto/auth-user-response.dto';

interface UserWithProfiles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  studentProfile?: { id: string; institutionId: string | null } | null;
  teacherProfile?: { id: string; institutionId: string | null } | null;
  representativeProfile?: { id: string; institutionId: string | null } | null;
}

export function mapProfileFromUser(user: UserWithProfiles): {
  profileId?: string;
  profileType?: AcademicProfileType;
  institutionId?: string;
} {
  if (user.role === Role.STUDENT && user.studentProfile) {
    return {
      profileId: user.studentProfile.id,
      profileType: 'student',
      institutionId: user.studentProfile.institutionId ?? undefined,
    };
  }

  if (user.role === Role.TEACHER && user.teacherProfile) {
    return {
      profileId: user.teacherProfile.id,
      profileType: 'teacher',
      institutionId: user.teacherProfile.institutionId ?? undefined,
    };
  }

  if (user.role === Role.REPRESENTATIVE && user.representativeProfile) {
    return {
      profileId: user.representativeProfile.id,
      profileType: 'representative',
      institutionId: user.representativeProfile.institutionId ?? undefined,
    };
  }

  return {};
}

export function toAuthUserResponseDto(user: UserWithProfiles): AuthUserResponseDto {
  const profile = mapProfileFromUser(user);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    profileId: profile.profileId,
    profileType: profile.profileType,
    institutionId: profile.institutionId,
  };
}

export function toAuthenticatedUser(user: UserWithProfiles) {
  const profile = mapProfileFromUser(user);

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    profileId: profile.profileId,
    profileType: profile.profileType,
    institutionId: profile.institutionId,
  };
}

export const userWithProfilesSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  studentProfile: { select: { id: true, institutionId: true } },
  teacherProfile: { select: { id: true, institutionId: true } },
  representativeProfile: { select: { id: true, institutionId: true } },
} as const;
