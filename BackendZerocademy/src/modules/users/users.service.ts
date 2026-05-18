import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import { ProfileProvisioningService } from '../../common/rbac/profile-provisioning.service';
import { RoleUtils } from '../../common/rbac/role.utils';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { mapProfileFromUser } from '../auth/mappers/auth-user.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto, userWithProfilesSelect } from './mappers/user.mapper';

type UserWithProfiles = Awaited<ReturnType<UsersService['findActiveUserOrThrow']>>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly profileProvisioning: ProfileProvisioningService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListUsersQueryDto,
  ): Promise<UserListResponseDto> {
    this.assertCanQueryRole(actor.role, query.role);

    const where = this.buildListWhere(actor.role, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userWithProfilesSelect,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users.map(toUserResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<UserResponseDto> {
    const user = await this.findActiveUserOrThrow(id);
    this.assertCanManageUser(actor, user);
    return toUserResponseDto(user);
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    this.assertCanAssignRole(actor.role, dto.role);

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
            isActive: dto.isActive ?? true,
          },
          select: userWithProfilesSelect,
        });

        if (RoleUtils.requiresAcademicProfile(dto.role)) {
          await this.profileProvisioning.provisionForUser(
            created.id,
            dto.role,
            dto.institutionId,
            tx,
          );
        }

        return tx.user.findUniqueOrThrow({
          where: { id: created.id },
          select: userWithProfilesSelect,
        });
      });

      return toUserResponseDto(user);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const existing = await this.findActiveUserOrThrow(id);
    this.assertCanManageUser(actor, existing);

    if (dto.role !== undefined) {
      this.assertCanAssignRole(actor.role, dto.role);

      if (dto.role !== existing.role && existing.role === Role.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only a super admin can change another super admin role',
        );
      }
    }

    const roleChanging =
      dto.role !== undefined && dto.role !== existing.role;

    const data: Prisma.UserUpdateInput = {
      ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
    };

    if (dto.password) {
      data.passwordHash = await this.hashPassword(dto.password);
    }

    const institutionId = this.resolveInstitutionIdForRoleChange(
      existing,
      dto.institutionId,
    );

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        if (roleChanging && dto.role) {
          await this.profileProvisioning.syncProfilesForRoleChange(
            id,
            existing.role,
            dto.role,
            institutionId,
            tx,
          );

          await tx.refreshToken.updateMany({
            where: { userId: id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }

        return tx.user.update({
          where: { id },
          data,
          select: userWithProfilesSelect,
        });
      });

      return toUserResponseDto(user);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async softDelete(actor: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.findActiveUserOrThrow(id);
    this.assertCanManageUser(actor, existing);

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private buildListWhere(
    actorRole: Role,
    query: ListUsersQueryDto,
  ): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (!RoleUtils.canViewSuperAdmins(actorRole)) {
      where.role = { not: Role.SUPER_ADMIN };
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private assertCanQueryRole(actorRole: Role, filterRole?: Role): void {
    if (
      filterRole === Role.SUPER_ADMIN &&
      !RoleUtils.canViewSuperAdmins(actorRole)
    ) {
      throw new ForbiddenException('Insufficient permissions to view super admins');
    }
  }

  private assertCanManageUser(
    actor: AuthenticatedUser,
    target: Pick<UserWithProfiles, 'id' | 'role'>,
  ): void {
    if (!RoleUtils.canManageUser(actor.role, target.role)) {
      throw new NotFoundException('User not found');
    }
  }

  private assertCanAssignRole(actorRole: Role, targetRole: Role): void {
    if (!RoleUtils.canAssignRole(actorRole, targetRole)) {
      throw new ForbiddenException(
        `Insufficient permissions to assign role ${targetRole}`,
      );
    }
  }

  private resolveInstitutionIdForRoleChange(
    existing: UserWithProfiles,
    institutionId?: string,
  ): string | undefined {
    if (institutionId !== undefined) {
      return institutionId;
    }

    return mapProfileFromUser(existing).institutionId;
  }

  private async findActiveUserOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userWithProfilesSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get('bcryptSaltRounds', {
      infer: true,
    });
    return bcrypt.hash(password, saltRounds);
  }

  private mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Email already exists');
    }
  }
}
