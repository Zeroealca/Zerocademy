import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { TEACHER_ASSIGNMENTS_CONTEXT } from './constants';
import { AssignmentHierarchyQueryDto } from './dto/assignment-hierarchy-query.dto';
import { AssignmentHierarchyResponseDto } from './dto/assignment-hierarchy-response.dto';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { ListTeacherAssignmentsQueryDto } from './dto/list-teacher-assignments-query.dto';
import { TeacherAssignmentListResponseDto } from './dto/teacher-assignment-list-response.dto';
import { TeacherAssignmentResponseDto } from './dto/teacher-assignment-response.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';
import {
  teacherAssignmentInclude,
  toTeacherAssignmentResponseDto,
} from './mappers/teacher-assignment.mapper';
import {
  assertCourseAndPeriodIntegrity,
  assertSubjectAppliesToGrade,
  assertSubjectExistsAndActive,
  assertTeacherExistsAndActive,
  assertUniqueAssignment,
  mapPrismaConflict,
} from './teacher-assignment.validation';

@Injectable()
export class TeacherAssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListTeacherAssignmentsQueryDto,
  ): Promise<TeacherAssignmentListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, assignments] = await this.prisma.$transaction([
      this.prisma.teacherAssignment.count({ where }),
      this.prisma.teacherAssignment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: teacherAssignmentInclude,
      }),
    ]);

    return {
      data: assignments.map(toTeacherAssignmentResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<TeacherAssignmentResponseDto> {
    const assignment = await this.findAssignmentOrThrow(id);
    return toTeacherAssignmentResponseDto(assignment);
  }

  async getHierarchy(
    query: AssignmentHierarchyQueryDto,
  ): Promise<AssignmentHierarchyResponseDto> {
    const where: Prisma.TeacherAssignmentWhereInput = {
      academicPeriodId: query.academicPeriodId,
    };

    if (query.teacherId) {
      where.teacherId = query.teacherId;
    }

    const assignments = await this.prisma.teacherAssignment.findMany({
      where,
      orderBy: [
        { teacher: { user: { lastName: 'asc' } } },
        { subject: { name: 'asc' } },
      ],
      include: teacherAssignmentInclude,
    });

    return {
      assignments: assignments.map(toTeacherAssignmentResponseDto),
    };
  }

  async create(
    dto: CreateTeacherAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<TeacherAssignmentResponseDto> {
    const { institutionId } = await this.validateAssignmentKeys(dto, actor);

    try {
      const assignment = await this.prisma.teacherAssignment.create({
        data: {
          institutionId,
          teacherId: dto.teacherId,
          subjectId: dto.subjectId,
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
        },
        include: teacherAssignmentInclude,
      });

      this.logger.log({
        context: TEACHER_ASSIGNMENTS_CONTEXT,
        event: 'TEACHER_ASSIGNMENT_CREATED',
        message: 'Teacher assignment created',
        metadata: {
          assignmentId: assignment.id,
          teacherId: assignment.teacherId,
          subjectId: assignment.subjectId,
          courseId: assignment.courseId,
          academicPeriodId: assignment.academicPeriodId,
        },
      });

      return toTeacherAssignmentResponseDto(assignment);
    } catch (error) {
      this.logAssignmentConflict(error, dto);
      mapPrismaConflict(error);
    }
  }

  async update(
    id: string,
    dto: UpdateTeacherAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<TeacherAssignmentResponseDto> {
    const existing = await this.findAssignmentOrThrow(id);
    if (!existing.institutionId) throw new BadRequestException('La asignación no tiene una institución.');
    await assertActorCanAccessInstitution(this.prisma, actor, existing.institutionId);

    const keys = {
      institutionId: existing.institutionId,
      teacherId: existing.teacherId,
      subjectId: dto.subjectId ?? existing.subjectId,
      courseId: dto.courseId ?? existing.courseId,
      academicPeriodId: existing.academicPeriodId,
    };

    const { institutionId } = await this.validateAssignmentKeys(keys, actor, id);

    try {
      const assignment = await this.prisma.teacherAssignment.update({
        where: { id },
        data: { ...keys, institutionId },
        include: teacherAssignmentInclude,
      });

      this.logger.log({
        context: TEACHER_ASSIGNMENTS_CONTEXT,
        event: 'TEACHER_ASSIGNMENT_UPDATED',
        message: 'Teacher assignment updated',
        metadata: { assignmentId: id },
      });

      return toTeacherAssignmentResponseDto(assignment);
    } catch (error) {
      this.logAssignmentConflict(error, keys);
      mapPrismaConflict(error);
    }
  }

  async remove(id: string): Promise<void> {
    await this.findAssignmentOrThrow(id);
    await this.prisma.teacherAssignment.delete({ where: { id } });

    this.logger.log({
      context: TEACHER_ASSIGNMENTS_CONTEXT,
      event: 'TEACHER_ASSIGNMENT_DELETED',
      message: 'Teacher assignment removed',
      metadata: { assignmentId: id },
    });
  }

  private async validateAssignmentKeys(
    keys: CreateTeacherAssignmentDto,
    actor: AuthenticatedUser,
    excludeId?: string,
  ): Promise<{ institutionId: string | null }> {
    await assertTeacherExistsAndActive(this.prisma, keys.teacherId);
    await assertSubjectExistsAndActive(this.prisma, keys.subjectId);

    const { gradeLevelId, institutionId } = await assertCourseAndPeriodIntegrity(
      this.prisma,
      keys.courseId,
      keys.academicPeriodId,
    );
    if (!institutionId || (keys.institutionId && keys.institutionId !== institutionId)) {
      throw new BadRequestException('El curso no pertenece a la institución seleccionada.');
    }
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    const teacher = await this.prisma.teacherProfile.findUniqueOrThrow({ where: { id: keys.teacherId } });
    const membership = await this.prisma.institutionMembership.findFirst({
      where: { userId: teacher.userId, institutionId, role: 'TEACHER', isActive: true },
      select: { id: true },
    });
    if (teacher.institutionId !== institutionId && !membership) {
      throw new BadRequestException('El docente no pertenece a la institución seleccionada.');
    }
    const subject = await this.prisma.subject.findUniqueOrThrow({ where: { id: keys.subjectId } });
    if (subject.institutionId && subject.institutionId !== institutionId) {
      throw new BadRequestException('La materia no pertenece a la institución seleccionada.');
    }

    await assertSubjectAppliesToGrade(
      this.prisma,
      keys.subjectId,
      gradeLevelId,
    );
    await assertUniqueAssignment(this.prisma, keys, excludeId);

    return { institutionId };
  }

  private buildListWhere(
    query: ListTeacherAssignmentsQueryDto,
  ): Prisma.TeacherAssignmentWhereInput {
    const where: Prisma.TeacherAssignmentWhereInput = {};

    if (query.institutionId) {
      where.institutionId = query.institutionId;
    }

    if (query.teacherId) {
      where.teacherId = query.teacherId;
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    if (query.academicPeriodId) {
      where.academicPeriodId = query.academicPeriodId;
    }

    if (query.gradeLevelId) {
      where.course = { gradeLevelId: query.gradeLevelId };
    }

    if (query.search) {
      where.OR = [
        {
          teacher: {
            user: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          teacher: {
            user: {
              lastName: { contains: query.search, mode: 'insensitive' },
            },
          },
        },
        {
          subject: { name: { contains: query.search, mode: 'insensitive' } },
        },
        {
          subject: {
            code: {
              contains: query.search.toUpperCase(),
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return where;
  }

  private async findAssignmentOrThrow(id: string) {
    const assignment = await this.prisma.teacherAssignment.findUnique({
      where: { id },
      include: teacherAssignmentInclude,
    });

    if (!assignment) {
      throw new NotFoundException('Teacher assignment not found');
    }

    return assignment;
  }

  private logAssignmentConflict(
    error: unknown,
    keys: CreateTeacherAssignmentDto,
  ): void {
    if (
      error instanceof Object &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      this.logger.warn({
        context: TEACHER_ASSIGNMENTS_CONTEXT,
        event: 'TEACHER_ASSIGNMENT_CONFLICT',
        message: 'Duplicate teacher assignment rejected',
        metadata: {
          teacherId: keys.teacherId,
          subjectId: keys.subjectId,
          courseId: keys.courseId,
          academicPeriodId: keys.academicPeriodId,
        },
      });
    }
  }
}
