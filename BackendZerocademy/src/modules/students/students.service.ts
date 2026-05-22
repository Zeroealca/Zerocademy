import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { ProfileProvisioningService } from '../../common/rbac/profile-provisioning.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { STUDENTS_CONTEXT } from './constants';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { StudentListResponseDto } from './dto/student-list-response.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  studentWithUserSelect,
  toStudentResponseDto,
} from './mappers/student.mapper';
import {
  assertActorCanAccessStudent,
  buildStudentListWhere,
} from './student-scope.util';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly profileProvisioning: ProfileProvisioningService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListStudentsQueryDto,
  ): Promise<StudentListResponseDto> {
    const where = await buildStudentListWhere(this.prisma, actor, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, students] = await this.prisma.$transaction([
      this.prisma.studentProfile.count({ where }),
      this.prisma.studentProfile.findMany({
        where,
        select: studentWithUserSelect,
        skip,
        take: query.limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    return {
      data: students.map(toStudentResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findMe(actor: AuthenticatedUser): Promise<StudentResponseDto> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { userId: actor.id, user: { deletedAt: null } },
      select: studentWithUserSelect,
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return toStudentResponseDto(student);
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<StudentResponseDto> {
    const student = await this.findStudentOrThrow(id);
    await assertActorCanAccessStudent(this.prisma, actor, student);
    return toStudentResponseDto(student);
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    const institutionId = await resolveActorInstitutionId(this.prisma, actor);
    await this.assertNationalIdAvailable(dto.nationalId);

    const passwordHash = await this.hashPassword(dto.password);

    try {
      const student = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            role: Role.STUDENT,
            isActive: true,
          },
        });

        await this.profileProvisioning.provisionForUser(
          user.id,
          Role.STUDENT,
          institutionId,
          tx,
        );

        return tx.studentProfile.update({
          where: { userId: user.id },
          data: {
            institutionId,
            nationalId: dto.nationalId.trim(),
            birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
            gender: dto.gender,
            phone: dto.phone?.trim(),
            address: dto.address?.trim(),
            emergencyContact: dto.emergencyContact?.trim(),
            isActive: true,
          },
          select: studentWithUserSelect,
        });
      });

      this.logger.log({
        context: STUDENTS_CONTEXT,
        event: 'STUDENT_CREATED',
        message: 'Student created',
        metadata: { studentId: student.id, actorId: actor.id },
      });

      return toStudentResponseDto(student);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    const existing = await this.findStudentOrThrow(id);
    await assertActorCanAccessStudent(this.prisma, actor, existing);

    if (dto.nationalId && dto.nationalId !== existing.nationalId) {
      await this.assertNationalIdAvailable(dto.nationalId, id);
    }

    const student = await this.prisma.$transaction(async (tx) => {
      if (
        dto.firstName !== undefined ||
        dto.lastName !== undefined ||
        dto.userIsActive !== undefined
      ) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(dto.firstName !== undefined
              ? { firstName: dto.firstName.trim() }
              : {}),
            ...(dto.lastName !== undefined
              ? { lastName: dto.lastName.trim() }
              : {}),
            ...(dto.userIsActive !== undefined
              ? { isActive: dto.userIsActive }
              : {}),
          },
        });
      }

      return tx.studentProfile.update({
        where: { id },
        data: {
          ...(dto.nationalId !== undefined
            ? { nationalId: dto.nationalId.trim() }
            : {}),
          ...(dto.birthDate !== undefined
            ? { birthDate: new Date(dto.birthDate) }
            : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
          ...(dto.phone !== undefined ? { phone: dto.phone.trim() } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.emergencyContact !== undefined
            ? { emergencyContact: dto.emergencyContact.trim() }
            : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        select: studentWithUserSelect,
      });
    });

    this.logger.log({
      context: STUDENTS_CONTEXT,
      event: 'STUDENT_UPDATED',
      message: 'Student updated',
      metadata: { studentId: id, actorId: actor.id },
    });

    return toStudentResponseDto(student);
  }

  async deactivate(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<StudentResponseDto> {
    return this.update(actor, id, { isActive: false, userIsActive: false });
  }

  async activate(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<StudentResponseDto> {
    return this.update(actor, id, { isActive: true, userIsActive: true });
  }

  private async findStudentOrThrow(id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, user: { deletedAt: null } },
      select: studentWithUserSelect,
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  private async assertNationalIdAvailable(
    nationalId: string,
    excludeStudentId?: string,
  ): Promise<void> {
    const existing = await this.prisma.studentProfile.findFirst({
      where: {
        nationalId: nationalId.trim(),
        ...(excludeStudentId ? { id: { not: excludeStudentId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('National ID already registered');
    }
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
      throw new ConflictException('Email or national ID already exists');
    }
  }
}
