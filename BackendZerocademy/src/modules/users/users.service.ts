import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto } from './mappers/user.mapper';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async findAll(query: ListUsersQueryDto): Promise<UserListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userSelect,
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

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findActiveUserOrThrow(id);
    return toUserResponseDto(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          isActive: dto.isActive ?? true,
        },
        select: userSelect,
      });

      return toUserResponseDto(user);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.findActiveUserOrThrow(id);

    const data: Prisma.UserUpdateInput = {
      ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.role !== undefined ? { role: dto.role } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.password) {
      data.passwordHash = await this.hashPassword(dto.password);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });

      return toUserResponseDto(user);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async softDelete(id: string): Promise<void> {
    await this.findActiveUserOrThrow(id);

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

  private buildListWhere(query: ListUsersQueryDto): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

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

  private async findActiveUserOrThrow(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
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
