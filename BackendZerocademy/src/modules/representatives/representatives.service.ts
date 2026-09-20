import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { assertActorCanAccessStudent } from '../students/student-scope.util';
import { REPRESENTATIVES_CONTEXT } from './constants';
import type {
  CreateRepresentativeStudentDto,
  UpsertRepresentativeStudentDto,
} from './dto/upsert-representative-student.dto';
import type { RepresentativeStudentResponseDto } from './dto/representative-student-response.dto';

const relationshipInclude = {
  student: {
    select: {
      id: true,
      userId: true,
      institutionId: true,
      user: { select: { firstName: true, lastName: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          academicPeriod: { select: { id: true, name: true } },
          course: {
            select: {
              name: true,
              section: true,
              gradeLevel: { select: { name: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.RepresentativeStudentInclude;

@Injectable()
export class RepresentativesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getMyStudents(
    actor: AuthenticatedUser,
  ): Promise<RepresentativeStudentResponseDto[]> {
    const relationships = await this.prisma.representativeStudent.findMany({
      where: { representativeUserId: actor.id, isActive: true },
      include: relationshipInclude,
      orderBy: { student: { user: { lastName: 'asc' } } },
    });
    this.logger.log({
      context: REPRESENTATIVES_CONTEXT,
      event: 'REPRESENTATIVE_STUDENTS_RETRIEVED',
      message: 'Representative student list retrieved',
      userId: actor.id,
      metadata: { studentCount: relationships.length },
    });
    return relationships.map((relationship) =>
      this.mapRelationship(relationship),
    );
  }

  async listForStudent(
    actor: AuthenticatedUser,
    studentId: string,
  ): Promise<RepresentativeStudentResponseDto[]> {
    await this.assertAdminCanManageStudent(actor, studentId);
    const relationships = await this.prisma.representativeStudent.findMany({
      where: { studentId },
      include: relationshipInclude,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
    return relationships.map((relationship) =>
      this.mapRelationship(relationship),
    );
  }

  async create(
    actor: AuthenticatedUser,
    studentId: string,
    dto: CreateRepresentativeStudentDto,
  ): Promise<RepresentativeStudentResponseDto> {
    await this.assertAdminCanManageStudent(actor, studentId);
    await this.assertRepresentativeInStudentInstitution(
      dto.representativeUserId,
      studentId,
    );
    try {
      const relationship = await this.prisma.$transaction(async (tx) => {
        if (dto.isPrimary)
          await tx.representativeStudent.updateMany({
            where: { studentId, isActive: true, isPrimary: true },
            data: { isPrimary: false },
          });
        return tx.representativeStudent.create({
          data: {
            representativeUserId: dto.representativeUserId,
            studentId,
            relationshipType: dto.relationshipType,
            isPrimary: dto.isPrimary ?? false,
          },
          include: relationshipInclude,
        });
      });
      this.logger.log({
        context: REPRESENTATIVES_CONTEXT,
        event: 'REPRESENTATIVE_STUDENT_RELATIONSHIP_CREATED',
        message: 'Representative student relationship created',
        userId: actor.id,
        metadata: { relationshipId: relationship.id, studentId },
      });
      return this.mapRelationship(relationship);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'Representative is already associated with this student',
        );
      throw error;
    }
  }

  async update(
    actor: AuthenticatedUser,
    relationshipId: string,
    dto: UpsertRepresentativeStudentDto,
  ): Promise<RepresentativeStudentResponseDto> {
    const existing = await this.findRelationshipOrThrow(relationshipId);
    await this.assertAdminCanManageStudent(actor, existing.studentId);
    const relationship = await this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary)
        await tx.representativeStudent.updateMany({
          where: {
            studentId: existing.studentId,
            isActive: true,
            isPrimary: true,
            id: { not: relationshipId },
          },
          data: { isPrimary: false },
        });
      return tx.representativeStudent.update({
        where: { id: relationshipId },
        data: {
          relationshipType: dto.relationshipType,
          ...(dto.isPrimary !== undefined ? { isPrimary: dto.isPrimary } : {}),
        },
        include: relationshipInclude,
      });
    });
    this.logger.log({
      context: REPRESENTATIVES_CONTEXT,
      event: 'REPRESENTATIVE_STUDENT_RELATIONSHIP_UPDATED',
      message: 'Representative student relationship updated',
      userId: actor.id,
      metadata: { relationshipId },
    });
    return this.mapRelationship(relationship);
  }

  async deactivate(
    actor: AuthenticatedUser,
    relationshipId: string,
  ): Promise<void> {
    const existing = await this.findRelationshipOrThrow(relationshipId);
    await this.assertAdminCanManageStudent(actor, existing.studentId);
    await this.prisma.representativeStudent.update({
      where: { id: relationshipId },
      data: { isActive: false, isPrimary: false },
    });
    this.logger.log({
      context: REPRESENTATIVES_CONTEXT,
      event: 'REPRESENTATIVE_STUDENT_RELATIONSHIP_DEACTIVATED',
      message: 'Representative student relationship deactivated',
      userId: actor.id,
      metadata: { relationshipId },
    });
  }

  private async assertAdminCanManageStudent(
    actor: AuthenticatedUser,
    studentId: string,
  ): Promise<void> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true, institutionId: true },
    });
    if (!student) throw new NotFoundException('Student not found');
    await assertActorCanAccessStudent(this.prisma, actor, student);
  }

  private async assertRepresentativeInStudentInstitution(
    representativeUserId: string,
    studentId: string,
  ): Promise<void> {
    const [representative, student] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: representativeUserId,
          role: Role.REPRESENTATIVE,
          isActive: true,
          deletedAt: null,
        },
        select: { representativeProfile: { select: { institutionId: true } } },
      }),
      this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { institutionId: true },
      }),
    ]);
    if (!representative?.representativeProfile || !student)
      throw new NotFoundException('Representative or student not found');
    if (
      representative.representativeProfile.institutionId &&
      student.institutionId &&
      representative.representativeProfile.institutionId !==
        student.institutionId
    )
      throw new NotFoundException('Representative not found');
  }

  private async findRelationshipOrThrow(id: string) {
    const relationship = await this.prisma.representativeStudent.findUnique({
      where: { id },
      select: { id: true, studentId: true },
    });
    if (!relationship)
      throw new NotFoundException('Representative relationship not found');
    return relationship;
  }

  private mapRelationship(
    relationship: Prisma.RepresentativeStudentGetPayload<{
      include: typeof relationshipInclude;
    }>,
  ): RepresentativeStudentResponseDto {
    const enrollment = relationship.student.enrollments[0];
    return {
      id: relationship.id,
      representativeUserId: relationship.representativeUserId,
      studentId: relationship.studentId,
      relationshipType: relationship.relationshipType,
      isPrimary: relationship.isPrimary,
      isActive: relationship.isActive,
      fullName: `${relationship.student.user.firstName} ${relationship.student.user.lastName}`,
      academicPeriodId: enrollment?.academicPeriod.id,
      academicPeriodName: enrollment?.academicPeriod.name,
      gradeLevelName: enrollment?.course.gradeLevel.name,
      courseName: enrollment?.course.name,
      section: enrollment?.course.section,
    };
  }
}
