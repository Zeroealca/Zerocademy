import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InstitutionMembershipRole,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INSTITUTION_MEMBERSHIPS_CONTEXT,
  MEMBERSHIP_LOG_EVENTS,
} from './constants';
import { CreateInstitutionMembershipDto } from './dto/create-institution-membership.dto';
import { InstitutionMembershipListResponseDto } from './dto/institution-membership-list-response.dto';
import { InstitutionMembershipResponseDto } from './dto/institution-membership-response.dto';
import { ListInstitutionMembershipsQueryDto } from './dto/list-institution-memberships-query.dto';
import { UpdateInstitutionMembershipDto } from './dto/update-institution-membership.dto';
import {
  assertAssignableUser,
  assertInstitutionExists,
} from './institution-membership.validation';
import {
  membershipWithUserInclude,
  toInstitutionMembershipResponseDto,
} from './mappers/institution-membership.mapper';

@Injectable()
export class InstitutionMembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    institutionId: string,
    query: ListInstitutionMembershipsQueryDto,
  ): Promise<InstitutionMembershipListResponseDto> {
    await assertInstitutionExists(this.prisma, institutionId);

    const where = this.buildListWhere(institutionId, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, memberships] = await this.prisma.$transaction([
      this.prisma.institutionMembership.count({ where }),
      this.prisma.institutionMembership.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        include: membershipWithUserInclude,
      }),
    ]);

    return {
      data: memberships.map(toInstitutionMembershipResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    institutionId: string,
    membershipId: string,
  ): Promise<InstitutionMembershipResponseDto> {
    const membership = await this.findMembershipOrThrow(
      institutionId,
      membershipId,
    );
    return toInstitutionMembershipResponseDto(membership);
  }

  async assign(
    institutionId: string,
    dto: CreateInstitutionMembershipDto,
  ): Promise<InstitutionMembershipResponseDto> {
    await assertInstitutionExists(this.prisma, institutionId);
    await assertAssignableUser(this.prisma, dto.userId, dto.role);

    const existing = await this.prisma.institutionMembership.findUnique({
      where: {
        institutionId_userId: { institutionId, userId: dto.userId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'User is already a member of this institution',
      );
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const created = await tx.institutionMembership.create({
        data: {
          institutionId,
          userId: dto.userId,
          role: dto.role,
          isActive: true,
        },
        include: membershipWithUserInclude,
      });

      await this.syncProfileInstitution(
        dto.userId,
        dto.role,
        institutionId,
        tx,
      );

      return created;
    });

    this.logger.log({
      context: INSTITUTION_MEMBERSHIPS_CONTEXT,
      event: MEMBERSHIP_LOG_EVENTS.ASSIGNED,
      message: 'Institution membership assigned',
      metadata: {
        institutionId,
        membershipId: membership.id,
        userId: dto.userId,
        role: dto.role,
      },
    });

    return toInstitutionMembershipResponseDto(membership);
  }

  async update(
    institutionId: string,
    membershipId: string,
    dto: UpdateInstitutionMembershipDto,
  ): Promise<InstitutionMembershipResponseDto> {
    const existing = await this.findMembershipOrThrow(
      institutionId,
      membershipId,
    );

    if (dto.role && dto.role !== existing.role) {
      await assertAssignableUser(this.prisma, existing.userId, dto.role);
    }

    const membership = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.institutionMembership.update({
        where: { id: membershipId },
        data: {
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: membershipWithUserInclude,
      });

      if (dto.isActive === true || dto.role) {
        await this.syncProfileInstitution(
          updated.userId,
          updated.role,
          institutionId,
          tx,
        );
      }

      return updated;
    });

    this.logger.log({
      context: INSTITUTION_MEMBERSHIPS_CONTEXT,
      event: MEMBERSHIP_LOG_EVENTS.UPDATED,
      message: 'Institution membership updated',
      metadata: { institutionId, membershipId },
    });

    return toInstitutionMembershipResponseDto(membership);
  }

  async activate(
    institutionId: string,
    membershipId: string,
  ): Promise<InstitutionMembershipResponseDto> {
    const membership = await this.update(institutionId, membershipId, {
      isActive: true,
    });

    this.logger.log({
      context: INSTITUTION_MEMBERSHIPS_CONTEXT,
      event: MEMBERSHIP_LOG_EVENTS.ACTIVATED,
      message: 'Institution membership activated',
      metadata: { institutionId, membershipId },
    });

    return membership;
  }

  async deactivate(
    institutionId: string,
    membershipId: string,
  ): Promise<InstitutionMembershipResponseDto> {
    const membership = await this.update(institutionId, membershipId, {
      isActive: false,
    });

    this.logger.log({
      context: INSTITUTION_MEMBERSHIPS_CONTEXT,
      event: MEMBERSHIP_LOG_EVENTS.DEACTIVATED,
      message: 'Institution membership deactivated',
      metadata: { institutionId, membershipId },
    });

    return membership;
  }

  async remove(
    institutionId: string,
    membershipId: string,
  ): Promise<void> {
    await this.findMembershipOrThrow(institutionId, membershipId);
    await this.prisma.institutionMembership.delete({
      where: { id: membershipId },
    });

    this.logger.log({
      context: INSTITUTION_MEMBERSHIPS_CONTEXT,
      event: MEMBERSHIP_LOG_EVENTS.REMOVED,
      message: 'Institution membership removed',
      metadata: { institutionId, membershipId },
    });
  }

  private async syncProfileInstitution(
    userId: string,
    role: InstitutionMembershipRole,
    institutionId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (role === InstitutionMembershipRole.TEACHER) {
      await tx.teacherProfile.updateMany({
        where: { userId },
        data: { institutionId },
      });
      return;
    }

    if (role === InstitutionMembershipRole.ADMIN) {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role === Role.TEACHER) {
        await tx.teacherProfile.updateMany({
          where: { userId },
          data: { institutionId },
        });
      }
    }
  }

  private buildListWhere(
    institutionId: string,
    query: ListInstitutionMembershipsQueryDto,
  ): Prisma.InstitutionMembershipWhereInput {
    const where: Prisma.InstitutionMembershipWhereInput = { institutionId };

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.user = {
        OR: [
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } },
        ],
      };
    }

    return where;
  }

  private async findMembershipOrThrow(
    institutionId: string,
    membershipId: string,
  ) {
    const membership = await this.prisma.institutionMembership.findFirst({
      where: { id: membershipId, institutionId },
      include: membershipWithUserInclude,
    });

    if (!membership) {
      throw new NotFoundException('Institution membership not found');
    }

    return membership;
  }
}
