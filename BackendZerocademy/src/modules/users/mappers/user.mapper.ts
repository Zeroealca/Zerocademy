import {
  mapProfileFromUser,
  toAuthUserResponseDto as mapToAuthUser,
  userWithProfilesSelect,
} from '../../auth/mappers/auth-user.mapper';
import { AuthUserResponseDto } from '../../auth/dto/auth-user-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';

type UserWithProfiles = Parameters<typeof mapToAuthUser>[0];

export { userWithProfilesSelect };

export function toUserResponseDto(user: UserWithProfiles): UserResponseDto {
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

export function toAuthUserResponseDto(user: UserWithProfiles): AuthUserResponseDto {
  return mapToAuthUser(user);
}
