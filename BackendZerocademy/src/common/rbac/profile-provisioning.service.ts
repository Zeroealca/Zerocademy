import { BadRequestException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleUtils } from './role.utils';

type TransactionClient = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

export interface ProvisionedProfile {
  profileId?: string;
  profileType?: 'student' | 'teacher' | 'representative';
}

@Injectable()
export class ProfileProvisioningService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionForUser(
    userId: string,
    role: Role,
    institutionId?: string,
    tx?: TransactionClient,
  ): Promise<ProvisionedProfile> {
    if (!RoleUtils.requiresAcademicProfile(role)) {
      return {};
    }

    const client = tx ?? this.prisma;

    switch (role) {
      case Role.STUDENT: {
        const profile = await client.studentProfile.create({
          data: { userId, institutionId },
        });
        return { profileId: profile.id, profileType: 'student' };
      }
      case Role.TEACHER: {
        const profile = await client.teacherProfile.create({
          data: { userId, institutionId },
        });
        return { profileId: profile.id, profileType: 'teacher' };
      }
      case Role.REPRESENTATIVE: {
        const profile = await client.representativeProfile.create({
          data: { userId, institutionId },
        });
        return { profileId: profile.id, profileType: 'representative' };
      }
      default:
        throw new BadRequestException(
          `Role ${role} does not support academic profile provisioning`,
        );
    }
  }

  async removeAllProfilesForUser(
    userId: string,
    tx?: TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    await Promise.all([
      client.studentProfile.deleteMany({ where: { userId } }),
      client.teacherProfile.deleteMany({ where: { userId } }),
      client.representativeProfile.deleteMany({ where: { userId } }),
    ]);
  }

  async syncProfilesForRoleChange(
    userId: string,
    previousRole: Role,
    nextRole: Role,
    institutionId?: string,
    tx?: TransactionClient,
  ): Promise<ProvisionedProfile> {
    if (previousRole === nextRole) {
      return this.resolveProvisionedProfile(userId, nextRole, tx);
    }

    const client = tx ?? this.prisma;

    await this.removeAllProfilesForUser(userId, tx);

    if (!RoleUtils.requiresAcademicProfile(nextRole)) {
      return {};
    }

    return this.provisionForUser(userId, nextRole, institutionId, client);
  }

  private async resolveProvisionedProfile(
    userId: string,
    role: Role,
    tx?: TransactionClient,
  ): Promise<ProvisionedProfile> {
    const profileId = await this.resolveProfileId(userId, role, tx);

    if (!profileId) {
      return {};
    }

    if (role === Role.STUDENT) {
      return { profileId, profileType: 'student' };
    }

    if (role === Role.TEACHER) {
      return { profileId, profileType: 'teacher' };
    }

    if (role === Role.REPRESENTATIVE) {
      return { profileId, profileType: 'representative' };
    }

    return {};
  }

  async resolveProfileId(
    userId: string,
    role: Role,
    tx?: TransactionClient,
  ): Promise<string | undefined> {
    const client = tx ?? this.prisma;

    if (role === Role.STUDENT) {
      const profile = await client.studentProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return profile?.id;
    }

    if (role === Role.TEACHER) {
      const profile = await client.teacherProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return profile?.id;
    }

    if (role === Role.REPRESENTATIVE) {
      const profile = await client.representativeProfile.findUnique({
        where: { userId },
        select: { id: true },
      });
      return profile?.id;
    }

    return undefined;
  }
}
