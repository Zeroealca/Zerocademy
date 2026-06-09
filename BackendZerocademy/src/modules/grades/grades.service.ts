import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { decimalToNumber } from '../academic-evaluation/academic-evaluation.validation';
import { GRADES_CONTEXT } from './constants';
import { BulkGradeResultDto } from './dto/bulk-grade-result.dto';
import { BulkUpsertGradesDto } from './dto/bulk-upsert-grades.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { GradeEntrySheetResponseDto } from './dto/grade-entry-sheet-response.dto';
import { GradeListResponseDto } from './dto/grade-list-response.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { assessmentInclude, toAssessmentResponseDto } from './mappers/assessment.mapper';
import {
  gradeWithRelationsInclude,
  toGradeResponseDto,
} from './mappers/grade.mapper';
import {
  assertActorCanAccessAssessment,
  assertActorCanAccessGrade,
  assertEnrollmentEligibleForAssessment,
  assertScoreWithinAssessmentMax,
  assertScoreWithinGradingScheme,
  assertTeacherOwnsAssignment,
  decimalFromInput,
  mapPrismaGradeConflict,
  resolveInstitutionGradingBounds,
} from './grades.validation';

@Injectable()
export class GradesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListGradesQueryDto,
  ): Promise<GradeListResponseDto> {
    const where = await this.buildListWhere(actor, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, grades] = await this.prisma.$transaction([
      this.prisma.grade.count({ where }),
      this.prisma.grade.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ updatedAt: 'desc' }],
        include: gradeWithRelationsInclude,
      }),
    ]);

    return {
      data: grades.map(toGradeResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<GradeResponseDto> {
    const grade = await this.findGradeOrThrow(id);
    await assertActorCanAccessGrade(this.prisma, actor, grade);
    return toGradeResponseDto(grade);
  }

  async getEntrySheet(
    actor: AuthenticatedUser,
    assessmentId: string,
  ): Promise<GradeEntrySheetResponseDto> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: assessmentInclude,
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    await assertActorCanAccessAssessment(this.prisma, actor, assessment);

    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException('Students cannot access grade entry sheets');
    }

    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );

    const [enrollments, grades] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where: {
          courseId: assessment.teacherAssignment.courseId,
          academicPeriodId: assessment.academicPeriodId,
          status: EnrollmentStatus.ACTIVE,
        },
        orderBy: [
          { student: { user: { lastName: 'asc' } } },
          { student: { user: { firstName: 'asc' } } },
        ],
        select: {
          id: true,
          studentId: true,
          student: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.grade.findMany({
        where: { assessmentId },
        select: {
          id: true,
          enrollmentId: true,
          score: true,
          observations: true,
        },
      }),
    ]);

    const gradeByEnrollment = new Map(
      grades.map((grade) => [grade.enrollmentId, grade]),
    );

    return {
      assessment: toAssessmentResponseDto(assessment),
      gradingSchemeMinScore: bounds.minScore,
      gradingSchemeMaxScore: bounds.maxScore,
      decimalPlaces: bounds.decimalPlaces,
      rows: enrollments.map((enrollment) => {
        const existing = gradeByEnrollment.get(enrollment.id);
        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.studentId,
          studentFirstName: enrollment.student.user.firstName,
          studentLastName: enrollment.student.user.lastName,
          gradeId: existing?.id ?? null,
          score: existing ? decimalToNumber(existing.score) : null,
          observations: existing?.observations ?? null,
        };
      }),
    };
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    const assessment = await this.loadAssessmentForMutation(dto.assessmentId);
    await this.validateGradeScore(actor, assessment, dto.score);

    await assertEnrollmentEligibleForAssessment(
      this.prisma,
      dto.enrollmentId,
      assessment,
    );

    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );

    try {
      const grade = await this.prisma.grade.create({
        data: {
          assessmentId: dto.assessmentId,
          enrollmentId: dto.enrollmentId,
          score: decimalFromInput(dto.score),
          observations: dto.observations,
          gradingSchemeId: bounds.gradingSchemeId,
        },
        include: gradeWithRelationsInclude,
      });

      this.logger.log({
        context: GRADES_CONTEXT,
        event: 'GRADE_CREATED',
        message: 'Grade created',
        metadata: {
          gradeId: grade.id,
          assessmentId: dto.assessmentId,
          enrollmentId: dto.enrollmentId,
          actorId: actor.id,
        },
      });

      return toGradeResponseDto(grade);
    } catch (error) {
      this.logValidationFailure('GRADE_CREATE_FAILED', error, {
        assessmentId: dto.assessmentId,
        enrollmentId: dto.enrollmentId,
        actorId: actor.id,
      });
      mapPrismaGradeConflict(error);
    }
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    const existing = await this.findGradeOrThrow(id);
    await assertActorCanAccessGrade(this.prisma, actor, existing);

    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers can update grades');
    }

    if (dto.score !== undefined) {
      await this.validateGradeScore(
        actor,
        existing.assessment,
        dto.score,
      );
    }

    const grade = await this.prisma.grade.update({
      where: { id },
      data: {
        ...(dto.score !== undefined
          ? { score: decimalFromInput(dto.score) }
          : {}),
        ...(dto.observations !== undefined
          ? { observations: dto.observations }
          : {}),
      },
      include: gradeWithRelationsInclude,
    });

    this.logger.log({
      context: GRADES_CONTEXT,
      event: 'GRADE_UPDATED',
      message: 'Grade updated',
      metadata: { gradeId: id, actorId: actor.id },
    });

    return toGradeResponseDto(grade);
  }

  async bulkUpsert(
    actor: AuthenticatedUser,
    dto: BulkUpsertGradesDto,
  ): Promise<BulkGradeResultDto> {
    const assessment = await this.loadAssessmentForMutation(dto.assessmentId);
    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );

    const result: BulkGradeResultDto = {
      createdCount: 0,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const entry of dto.grades) {
      try {
        await this.validateGradeScore(actor, assessment, entry.score);
        await assertEnrollmentEligibleForAssessment(
          this.prisma,
          entry.enrollmentId,
          assessment,
        );

        const existing = await this.prisma.grade.findUnique({
          where: {
            assessmentId_enrollmentId: {
              assessmentId: dto.assessmentId,
              enrollmentId: entry.enrollmentId,
            },
          },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.grade.update({
            where: { id: existing.id },
            data: {
              score: decimalFromInput(entry.score),
              observations: entry.observations,
            },
          });
          result.updatedCount += 1;
        } else {
          await this.prisma.grade.create({
            data: {
              assessmentId: dto.assessmentId,
              enrollmentId: entry.enrollmentId,
              score: decimalFromInput(entry.score),
              observations: entry.observations,
              gradingSchemeId: bounds.gradingSchemeId,
            },
          });
          result.createdCount += 1;
        }
      } catch (error) {
        result.failedCount += 1;
        result.errors.push({
          enrollmentId: entry.enrollmentId,
          message:
            error instanceof Error ? error.message : 'Grade submission failed',
        });
      }
    }

    if (result.createdCount > 0 || result.updatedCount > 0) {
      this.logger.log({
        context: GRADES_CONTEXT,
        event: 'GRADES_BULK_UPSERTED',
        message: 'Bulk grades submitted',
        metadata: {
          assessmentId: dto.assessmentId,
          createdCount: result.createdCount,
          updatedCount: result.updatedCount,
          failedCount: result.failedCount,
          actorId: actor.id,
        },
      });
    }

    return result;
  }

  private async validateGradeScore(
    actor: AuthenticatedUser,
    assessment: {
      institutionId: string;
      maxScore: { toNumber(): number } | number;
      teacherAssignmentId: string;
      teacherAssignment: { teacherId: string };
    },
    score: number,
  ): Promise<void> {
    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers can register grades');
    }

    await assertTeacherOwnsAssignment(
      this.prisma,
      actor,
      assessment.teacherAssignmentId,
    );

    const maxScore =
      typeof assessment.maxScore === 'number'
        ? assessment.maxScore
        : assessment.maxScore.toNumber();

    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );

    assertScoreWithinAssessmentMax(score, maxScore);
    assertScoreWithinGradingScheme(score, bounds);
  }

  private async buildListWhere(
    actor: AuthenticatedUser,
    query: ListGradesQueryDto,
  ): Promise<Prisma.GradeWhereInput> {
    const where: Prisma.GradeWhereInput = {};

    if (query.assessmentId) {
      where.assessmentId = query.assessmentId;
    }

    if (query.enrollmentId) {
      where.enrollmentId = query.enrollmentId;
    }

    const assessmentFilter: Prisma.AssessmentWhereInput = {};

    if (query.academicPeriodId) {
      assessmentFilter.academicPeriodId = query.academicPeriodId;
    }

    if (query.academicTermId) {
      assessmentFilter.academicTermId = query.academicTermId;
    }

    if (query.subjectId) {
      assessmentFilter.subjectId = query.subjectId;
    }

    if (Object.keys(assessmentFilter).length > 0) {
      where.assessment = assessmentFilter;
    }

    if (query.studentId) {
      where.enrollment = { studentId: query.studentId };
    }

    if (RoleUtils.isSuperAdmin(actor.role)) {
      return where;
    }

    if (actor.role === Role.ADMIN) {
      const institutionId = await resolveActorInstitutionId(
        this.prisma,
        actor,
      );
      if (institutionId) {
        where.assessment = {
          ...(where.assessment as Prisma.AssessmentWhereInput),
          institutionId,
        };
      }
      return where;
    }

    if (actor.role === Role.TEACHER && actor.profileId) {
      where.assessment = {
        ...(where.assessment as Prisma.AssessmentWhereInput),
        teacherAssignment: { teacherId: actor.profileId },
      };
      return where;
    }

    if (actor.role === Role.STUDENT) {
      where.enrollment = {
        ...(where.enrollment as Prisma.EnrollmentWhereInput),
        student: { userId: actor.id },
      };
      return where;
    }

    where.id = '00000000-0000-0000-0000-000000000000';
    return where;
  }

  private async loadAssessmentForMutation(assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        teacherAssignment: {
          select: { teacherId: true, courseId: true, academicPeriodId: true },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }

  private async findGradeOrThrow(id: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: gradeWithRelationsInclude,
    });

    if (!grade) {
      throw new NotFoundException('Grade not found');
    }

    return grade;
  }

  private logValidationFailure(
    event: string,
    error: unknown,
    metadata: Record<string, string>,
  ): void {
    this.logger.warn({
      context: GRADES_CONTEXT,
      event,
      message:
        error instanceof Error ? error.message : 'Grade validation failed',
      metadata,
    });
  }
}
