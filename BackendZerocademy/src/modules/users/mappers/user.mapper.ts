import { User } from '@prisma/client';
import { AuthUserResponseDto } from '../../auth/dto/auth-user-response.dto';
import { UserResponseDto } from '../dto/user-response.dto';

type UserRecord = Pick<
  User,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
>;

export function toUserResponseDto(user: UserRecord): UserResponseDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toAuthUserResponseDto(user: UserRecord): AuthUserResponseDto {
  return toUserResponseDto(user);
}
