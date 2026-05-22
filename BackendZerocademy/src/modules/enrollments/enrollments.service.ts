import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { assertActorCanAccessStudent } from '../students/student-scope.util';
import { ENROLLMENTS_CONTEXT } from './constants';
import { BulkCreateEnrollmentsDto } from './dto/bulk-create-enrollments.dto';
import { BulkEnrollmentResultDto } from './dto/bulk-enrollment-result.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentListResponseDto } from './dto/enrollment-list-response.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { ListAvailableStudentsQueryDto } from './dto/list-available-students-query.dto';
import { ListEnrollmentsQueryDto } from './dto/list-enrollments-query.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import {
  enrollmentWithRelationsSelect,
  toEnrollmentResponseDto,
} from './mappers/enrollment.mapper';
import { StudentListResponseDto } from '../students/dto/student-list-response.dto';
import {
  studentWithUserSelect,
  toStudentResponseDto,
} from '../students/mappers/student.mapper';
import { buildStudentListWhere } from '../students/student-scope.util';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListEnrollmentsQueryDto,
  ): Promise<EnrollmentListResponseDto> {
    const where = await this.buildListWhere(actor, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, enrollments] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        select: enrollmentWithRelationsSelect,
        skip,
        take: query.limit,
        orderBy: [{ enrollmentDate: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return {
      data: enrollments.map(toEnrollmentResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findStudentHistory(
    actor: AuthenticatedUser,
    studentId: string,
    query: ListEnrollmentsQueryDto,
  ): Promise<EnrollmentListResponseDto> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, user: { deletedAt: null } },
      select: { id: true, userId: true, institutionId: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    await assertActorCanAccessStudent(this.prisma, actor, student);

    return this.findAll(actor, { ...query, studentId });
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.findEnrollmentOrThrow(id);
    await this.assertActorCanAccessEnrollment(actor, enrollment);
    return toEnrollmentResponseDto(enrollment);
  }

  async findAvailableStudents(
    actor: AuthenticatedUser,
    query: ListAvailableStudentsQueryDto,
  ): Promise<StudentListResponseDto> {
    await this.validateEnrollmentTargets({
      courseId: query.courseId,
      academicPeriodId: query.academicPeriodId,
    });

    const baseWhere = await buildStudentListWhere(this.prisma, actor, {
      isActive: true,
      search: query.search,
    });

    const where: Prisma.StudentProfileWhereInput = {
      AND: [
        baseWhere,
        {
          NOT: {
            enrollments: {
              some: {
                courseId: query.courseId,
                academicPeriodId: query.academicPeriodId,
                status: EnrollmentStatus.ACTIVE,
              },
            },
          },
        },
      ],
    };

    const skip = getPaginationSkip(query.page, query.limit);

    const [total, students] = await this.prisma.$transaction([
      this.prisma.studentProfile.count({ where }),
      this.prisma.studentProfile.findMany({
        where,
        select: studentWithUserSelect,
        skip,
        take: query.limit,
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
      }),
    ]);

    return {
      data: students.map(toStudentResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async bulkCreate(
    actor: AuthenticatedUser,
    dto: BulkCreateEnrollmentsDto,
  ): Promise<BulkEnrollmentResultDto> {
    await this.validateEnrollmentTargets({
      courseId: dto.courseId,
      academicPeriodId: dto.academicPeriodId,
    });

    const uniqueStudentIds = [...new Set(dto.studentIds)];
    const enrollmentDate = dto.enrollmentDate
      ? new Date(dto.enrollmentDate)
      : new Date();
    const status = dto.status ?? EnrollmentStatus.ACTIVE;

    const result: BulkEnrollmentResultDto = {
      enrolledCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const studentId of uniqueStudentIds) {
      try {
        const student = await this.prisma.studentProfile.findFirst({
          where: {
            id: studentId,
            isActive: true,
            user: { deletedAt: null, role: Role.STUDENT },
          },
          select: { id: true, userId: true, institutionId: true },
        });

        if (!student) {
          result.failedCount += 1;
          result.errors.push({
            studentId,
            message: 'Estudiante no encontrado o inactivo',
          });
          continue;
        }

        const existing = await this.prisma.enrollment.findUnique({
          where: {
            studentId_courseId_academicPeriodId: {
              studentId,
              courseId: dto.courseId,
              academicPeriodId: dto.academicPeriodId,
            },
          },
          select: { id: true },
        });

        if (existing) {
          result.skippedCount += 1;
          continue;
        }

        await this.prisma.enrollment.create({
          data: {
            studentId,
            courseId: dto.courseId,
            academicPeriodId: dto.academicPeriodId,
            enrollmentDate,
            status,
          },
        });

        result.enrolledCount += 1;
      } catch (error) {
        result.failedCount += 1;
        result.errors.push({
          studentId,
          message:
            error instanceof Error
              ? error.message
              : 'No se pudo matricular al estudiante',
        });
      }
    }

    if (result.enrolledCount > 0) {
      this.logger.log({
        context: ENROLLMENTS_CONTEXT,
        event: 'ENROLLMENTS_BULK_CREATED',
        message: 'Bulk enrollments created',
        metadata: {
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
          enrolledCount: result.enrolledCount,
          actorId: actor.id,
        },
      });
    }

    return result;
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    await this.validateEnrollmentTargets(dto);

    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentId, user: { deletedAt: null, role: Role.STUDENT } },
      select: { id: true, userId: true, institutionId: true, isActive: true },
    });

    if (!student?.isActive) {
      throw new BadRequestException('Student not found or inactive');
    }

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId: dto.studentId,
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
          enrollmentDate: dto.enrollmentDate
            ? new Date(dto.enrollmentDate)
            : new Date(),
          status: dto.status ?? EnrollmentStatus.ACTIVE,
        },
        select: enrollmentWithRelationsSelect,
      });

      this.logger.log({
        context: ENROLLMENTS_CONTEXT,
        event: 'ENROLLMENT_CREATED',
        message: 'Enrollment created',
        metadata: {
          enrollmentId: enrollment.id,
          studentId: dto.studentId,
          courseId: dto.courseId,
          actorId: actor.id,
        },
      });

      return toEnrollmentResponseDto(enrollment);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Student is already enrolled in this course for the period',
        );
      }
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    const existing = await this.findEnrollmentOrThrow(id);
    await this.assertActorCanAccessEnrollment(actor, existing);

    const enrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(dto.enrollmentDate !== undefined
          ? { enrollmentDate: new Date(dto.enrollmentDate) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: enrollmentWithRelationsSelect,
    });

    this.logger.log({
      context: ENROLLMENTS_CONTEXT,
      event: 'ENROLLMENT_UPDATED',
      message: 'Enrollment updated',
      metadata: { enrollmentId: id, status: enrollment.status, actorId: actor.id },
    });

    return toEnrollmentResponseDto(enrollment);
  }

  private async validateEnrollmentTargets(dto: {
    courseId: string;
    academicPeriodId: string;
  }): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: { id: true, isActive: true, academicPeriodId: true },
    });

    if (!course?.isActive) {
      throw new BadRequestException('Course not found or inactive');
    }

    if (course.academicPeriodId !== dto.academicPeriodId) {
      throw new BadRequestException(
        'Course does not belong to the selected academic period',
      );
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academicPeriodId },
      select: { id: true },
    });

    if (!period) {
      throw new BadRequestException('Academic period not found');
    }
  }

  private async buildListWhere(
    actor: AuthenticatedUser,
    query: ListEnrollmentsQueryDto,
  ): Promise<Prisma.EnrollmentWhereInput> {
    const where: Prisma.EnrollmentWhereInput = {};

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    if (query.academicPeriodId) {
      where.academicPeriodId = query.academicPeriodId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (actor.role === Role.STUDENT) {
      const profile = await this.prisma.studentProfile.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });

      if (!profile) {
        where.id = '00000000-0000-0000-0000-000000000000';
        return where;
      }

      where.studentId = profile.id;
    } else if (actor.role === Role.TEACHER) {
      if (!actor.profileId) {
        where.id = '00000000-0000-0000-0000-000000000000';
        return where;
      }

      where.course = {
        teacherAssignments: {
          some: { teacherId: actor.profileId },
        },
      };
    } else if (actor.role === Role.ADMIN) {
      const institutionId = await resolveActorInstitutionId(
        this.prisma,
        actor,
      );

      if (institutionId) {
        where.student = { institutionId };
      }
    }

    return where;
  }

  private async assertActorCanAccessEnrollment(
    actor: AuthenticatedUser,
    enrollment: { studentId: string; student: { userId: string; institutionId: string | null } },
  ): Promise<void> {
    await assertActorCanAccessStudent(this.prisma, actor, {
      id: enrollment.studentId,
      userId: enrollment.student.userId,
      institutionId: enrollment.student.institutionId,
    });
  }

  private async findEnrollmentOrThrow(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      select: enrollmentWithRelationsSelect,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return enrollment;
  }
}
