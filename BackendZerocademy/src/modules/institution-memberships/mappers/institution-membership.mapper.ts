import { InstitutionMembership, User } from '@prisma/client';
import { InstitutionMembershipResponseDto } from '../dto/institution-membership-response.dto';

export type MembershipWithUser = InstitutionMembership & {
  user: Pick<User, 'firstName' | 'lastName' | 'email'>;
};

export const membershipWithUserInclude = {
  user: {
    select: { firstName: true, lastName: true, email: true },
  },
} as const;

export function toInstitutionMembershipResponseDto(
  membership: MembershipWithUser,
): InstitutionMembershipResponseDto {
  return {
    id: membership.id,
    institutionId: membership.institutionId,
    userId: membership.userId,
    userFirstName: membership.user.firstName,
    userLastName: membership.user.lastName,
    userEmail: membership.user.email,
    role: membership.role,
    isActive: membership.isActive,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
}
