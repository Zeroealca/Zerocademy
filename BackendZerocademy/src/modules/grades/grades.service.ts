/* eslint-disable @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AssessmentStatus,
  EnrollmentStatus,
  GradeAuditOperation,
  Prisma,
  Role,
} from '@prisma/client';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
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
import {
  BulkUpsertGradesDto,
  GradeSheetOperation,
} from './dto/bulk-upsert-grades.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import {
  CorrectPublishedGradeDto,
  PublishedGradeCorrectionOperation,
} from './dto/correct-published-grade.dto';
import { GradeEntrySheetResponseDto } from './dto/grade-entry-sheet-response.dto';
import { GradeListResponseDto } from './dto/grade-list-response.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import {
  assessmentInclude,
  toAssessmentResponseDto,
} from './mappers/assessment.mapper';
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
    private readonly permissionEnforcer: MembershipPermissionEnforcer,
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

    const enrollments =
      assessment.status === AssessmentStatus.PUBLISHED
        ? (
            await this.prisma.assessmentRosterEntry.findMany({
              where: { assessmentId },
              orderBy: [
                { enrollment: { student: { user: { lastName: 'asc' } } } },
                { enrollment: { student: { user: { firstName: 'asc' } } } },
              ],
              select: {
                enrollment: {
                  select: {
                    id: true,
                    studentId: true,
                    student: {
                      select: {
                        user: { select: { firstName: true, lastName: true } },
                      },
                    },
                  },
                },
              },
            })
          ).map((entry) => entry.enrollment)
        : await this.prisma.enrollment.findMany({
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
          });
    const grades = await this.prisma.grade.findMany({
      where: { assessmentId },
      select: {
        id: true,
        enrollmentId: true,
        score: true,
        observations: true,
        updatedAt: true,
      },
    });

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
          updatedAt: existing?.updatedAt.toISOString() ?? null,
        };
      }),
    };
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    const assessment = await this.loadAssessmentForMutation(dto.assessmentId);
    this.assertAssessmentDraft(assessment);
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
      const grade = await this.prisma.$transaction(async (tx) => {
        const created = await tx.grade.create({
          data: {
            assessmentId: dto.assessmentId,
            enrollmentId: dto.enrollmentId,
            score: decimalFromInput(dto.score),
            observations: this.normalizeObservations(dto.observations),
            gradingSchemeId: bounds.gradingSchemeId,
          },
          include: gradeWithRelationsInclude,
        });
        await tx.gradeAuditEvent.create({
          data: {
            assessmentId: dto.assessmentId,
            enrollmentId: dto.enrollmentId,
            actorId: actor.id,
            operation: GradeAuditOperation.CREATED,
            newScore: decimalFromInput(dto.score),
            newObservations: this.normalizeObservations(dto.observations),
          },
        });
        return created;
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
    this.assertAssessmentDraft(existing.assessment);

    if (dto.score !== undefined) {
      await this.validateGradeScore(actor, existing.assessment, dto.score);
    }

    const score = dto.score ?? decimalToNumber(existing.score);
    const observations =
      dto.observations === undefined
        ? existing.observations
        : this.normalizeObservations(dto.observations);
    const changed =
      score !== decimalToNumber(existing.score) ||
      observations !== existing.observations;
    if (!changed) return toGradeResponseDto(existing);
    const grade = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.grade.update({
        where: { id },
        data: { score: decimalFromInput(score), observations },
        include: gradeWithRelationsInclude,
      });
      await tx.gradeAuditEvent.create({
        data: {
          assessmentId: existing.assessmentId,
          enrollmentId: existing.enrollmentId,
          actorId: actor.id,
          operation: GradeAuditOperation.UPDATED,
          previousScore: existing.score,
          newScore: decimalFromInput(score),
          previousObservations: existing.observations,
          newObservations: observations,
        },
      });
      return updated;
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
    this.assertAssessmentDraft(assessment);
    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );
    await this.assertTeacherCanWriteSheet(actor, assessment);
    this.assertSheetEntries(dto, assessment, bounds);
    await this.assertSheetEnrollmentsEligible(assessment, dto.entries);

    let result: BulkGradeResultDto;
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const saved: BulkGradeResultDto = {
          createdCount: 0,
          updatedCount: 0,
          clearedCount: 0,
          unchangedCount: 0,
        };
        const existingGrades = await tx.grade.findMany({
          where: {
            assessmentId: assessment.id,
            enrollmentId: {
              in: dto.entries.map((entry) => entry.enrollmentId),
            },
          },
          select: {
            id: true,
            enrollmentId: true,
            score: true,
            observations: true,
            updatedAt: true,
          },
        });
        const gradeByEnrollment = new Map(
          existingGrades.map((grade) => [grade.enrollmentId, grade]),
        );

        for (const entry of dto.entries) {
          const existing = gradeByEnrollment.get(entry.enrollmentId) ?? null;
          this.assertExpectedRevision(existing, entry.expectedUpdatedAt);

          if (entry.operation === GradeSheetOperation.CLEAR) {
            if (!existing) {
              saved.unchangedCount += 1;
              continue;
            }
            const deleted = await tx.grade.deleteMany({
              where: { id: existing.id, updatedAt: existing.updatedAt },
            });
            if (deleted.count !== 1) {
              throw new ConflictException(
                'A grade changed since this sheet was loaded. Refresh before saving.',
              );
            }
            await tx.gradeAuditEvent.create({
              data: {
                assessmentId: assessment.id,
                enrollmentId: entry.enrollmentId,
                actorId: actor.id,
                operation: GradeAuditOperation.CLEARED,
                previousScore: existing.score,
                previousObservations: existing.observations,
              },
            });
            saved.clearedCount += 1;
            continue;
          }

          const score = entry.score;
          if (score === undefined) {
            throw new BadRequestException(
              'SET grade sheet entries require a score',
            );
          }
          const observations = this.normalizeObservations(entry.observations);
          if (!existing) {
            await tx.grade.create({
              data: {
                assessmentId: assessment.id,
                enrollmentId: entry.enrollmentId,
                score: decimalFromInput(score),
                observations,
                gradingSchemeId: bounds.gradingSchemeId,
              },
            });
            await tx.gradeAuditEvent.create({
              data: {
                assessmentId: assessment.id,
                enrollmentId: entry.enrollmentId,
                actorId: actor.id,
                operation: GradeAuditOperation.CREATED,
                newScore: decimalFromInput(score),
                newObservations: observations,
              },
            });
            saved.createdCount += 1;
            continue;
          }

          const scoreChanged = decimalToNumber(existing.score) !== score;
          const observationsChanged =
            observations !== undefined &&
            observations !== existing.observations;
          if (!scoreChanged && !observationsChanged) {
            saved.unchangedCount += 1;
            continue;
          }
          const newObservations =
            observations === undefined ? existing.observations : observations;
          const updated = await tx.grade.updateMany({
            where: { id: existing.id, updatedAt: existing.updatedAt },
            data: {
              score: decimalFromInput(score),
              observations: newObservations,
            },
          });
          if (updated.count !== 1) {
            throw new ConflictException(
              'A grade changed since this sheet was loaded. Refresh before saving.',
            );
          }
          await tx.gradeAuditEvent.create({
            data: {
              assessmentId: assessment.id,
              enrollmentId: entry.enrollmentId,
              actorId: actor.id,
              operation: GradeAuditOperation.UPDATED,
              previousScore: existing.score,
              newScore: decimalFromInput(score),
              previousObservations: existing.observations,
              newObservations,
            },
          });
          saved.updatedCount += 1;
        }
        return saved;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A grade changed since this sheet was loaded. Refresh before saving.',
        );
      }
      throw error;
    }

    if (result.createdCount || result.updatedCount || result.clearedCount) {
      this.logger.log({
        context: GRADES_CONTEXT,
        event: 'GRADE_SHEET_SAVED',
        message: 'Grade sheet saved atomically',
        metadata: {
          assessmentId: dto.assessmentId,
          createdCount: result.createdCount,
          updatedCount: result.updatedCount,
          clearedCount: result.clearedCount,
          actorId: actor.id,
        },
      });
    }

    return result;
  }

  async correctPublished(
    actor: AuthenticatedUser,
    assessmentId: string,
    dto: CorrectPublishedGradeDto,
  ): Promise<GradeResponseDto | null> {
    const assessment = await this.loadAssessmentForMutation(assessmentId);
    if (assessment.status !== AssessmentStatus.PUBLISHED) {
      throw new BadRequestException(
        'Published-grade corrections require a published assessment',
      );
    }
    await this.assertTeacherCanWriteSheet(actor, assessment);
    const rosterEntry = await this.prisma.assessmentRosterEntry.findUnique({
      where: {
        assessmentId_enrollmentId: {
          assessmentId,
          enrollmentId: dto.enrollmentId,
        },
      },
      select: { id: true },
    });
    if (!rosterEntry) {
      throw new BadRequestException(
        'The enrollment is not part of this assessment’s frozen roster',
      );
    }
    const reason = dto.reason?.trim();
    if (!reason)
      throw new BadRequestException(
        'A non-blank correction reason is required',
      );
    if (!Object.prototype.hasOwnProperty.call(dto, 'expectedUpdatedAt')) {
      throw new BadRequestException(
        'Published corrections require expectedUpdatedAt',
      );
    }
    const bounds = await resolveInstitutionGradingBounds(
      this.prisma,
      assessment.institutionId,
    );
    if (dto.operation === PublishedGradeCorrectionOperation.SET) {
      if (dto.score === undefined || dto.score === null)
        throw new BadRequestException('SET corrections require a score');
      const maxScore =
        typeof assessment.maxScore === 'number'
          ? assessment.maxScore
          : assessment.maxScore.toNumber();
      assertScoreWithinAssessmentMax(dto.score, maxScore);
      assertScoreWithinGradingScheme(dto.score, bounds);
    } else if (dto.score !== undefined || dto.observations !== undefined) {
      throw new BadRequestException(
        'CLEAR corrections cannot include score or observations',
      );
    }
    const correctionScore = dto.score;
    try {
      const corrected = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.grade.findUnique({
          where: {
            assessmentId_enrollmentId: {
              assessmentId,
              enrollmentId: dto.enrollmentId,
            },
          },
          select: {
            id: true,
            score: true,
            observations: true,
            updatedAt: true,
          },
        });
        this.assertExpectedRevision(existing, dto.expectedUpdatedAt);
        if (dto.operation === PublishedGradeCorrectionOperation.CLEAR) {
          if (!existing) return null;
          const deleted = await tx.grade.deleteMany({
            where: { id: existing.id, updatedAt: existing.updatedAt },
          });
          if (deleted.count !== 1)
            throw new ConflictException(
              'A grade changed since this sheet was loaded. Refresh before saving.',
            );
          await tx.gradeAuditEvent.create({
            data: {
              assessmentId,
              enrollmentId: dto.enrollmentId,
              actorId: actor.id,
              operation: GradeAuditOperation.CLEARED,
              previousScore: existing.score,
              previousObservations: existing.observations,
              reason,
            },
          });
          return null;
        }
        if (correctionScore === undefined) {
          throw new BadRequestException('SET corrections require a score');
        }
        const score = correctionScore;
        const observations = this.normalizeObservations(dto.observations);
        if (!existing) {
          const created = await tx.grade.create({
            data: {
              assessmentId,
              enrollmentId: dto.enrollmentId,
              score: decimalFromInput(score),
              observations,
              gradingSchemeId: bounds.gradingSchemeId,
            },
            include: gradeWithRelationsInclude,
          });
          await tx.gradeAuditEvent.create({
            data: {
              assessmentId,
              enrollmentId: dto.enrollmentId,
              actorId: actor.id,
              operation: GradeAuditOperation.CREATED,
              newScore: decimalFromInput(score),
              newObservations: observations,
              reason,
            },
          });
          return created;
        }
        const newObservations =
          observations === undefined ? existing.observations : observations;
        if (
          decimalToNumber(existing.score) === score &&
          existing.observations === newObservations
        ) {
          throw new BadRequestException(
            'The correction does not change the published grade',
          );
        }
        const updated = await tx.grade.updateMany({
          where: { id: existing.id, updatedAt: existing.updatedAt },
          data: {
            score: decimalFromInput(score),
            observations: newObservations,
          },
        });
        if (updated.count !== 1)
          throw new ConflictException(
            'A grade changed since this sheet was loaded. Refresh before saving.',
          );
        await tx.gradeAuditEvent.create({
          data: {
            assessmentId,
            enrollmentId: dto.enrollmentId,
            actorId: actor.id,
            operation: GradeAuditOperation.UPDATED,
            previousScore: existing.score,
            newScore: decimalFromInput(score),
            previousObservations: existing.observations,
            newObservations,
            reason,
          },
        });
        return tx.grade.findUniqueOrThrow({
          where: { id: existing.id },
          include: gradeWithRelationsInclude,
        });
      });
      this.logger.log({
        context: GRADES_CONTEXT,
        event: 'PUBLISHED_GRADE_CORRECTED',
        message: 'Published grade corrected',
        metadata: {
          assessmentId,
          enrollmentId: dto.enrollmentId,
          actorId: actor.id,
          operation: dto.operation,
        },
      });
      return corrected ? toGradeResponseDto(corrected) : null;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A grade changed since this sheet was loaded. Refresh before saving.',
        );
      }
      throw error;
    }
  }

  private async assertTeacherCanWriteSheet(
    actor: AuthenticatedUser,
    assessment: { teacherAssignmentId: string; institutionId: string },
  ): Promise<void> {
    await assertTeacherOwnsAssignment(
      this.prisma,
      actor,
      assessment.teacherAssignmentId,
    );
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId: assessment.institutionId,
      permission: PERMISSIONS.GRADES.WRITE,
      domain: 'grades',
      resourceType: 'Assessment',
      resourceId: assessment.teacherAssignmentId,
    });
  }

  private assertSheetEntries(
    dto: BulkUpsertGradesDto,
    assessment: { maxScore: { toNumber(): number } | number },
    bounds: Awaited<ReturnType<typeof resolveInstitutionGradingBounds>>,
  ): void {
    const enrollmentIds = dto.entries.map((entry) => entry.enrollmentId);
    if (new Set(enrollmentIds).size !== enrollmentIds.length) {
      throw new BadRequestException(
        'Grade sheet entries must not repeat an enrollment',
      );
    }
    for (const entry of dto.entries) {
      if (!Object.prototype.hasOwnProperty.call(entry, 'expectedUpdatedAt')) {
        throw new BadRequestException(
          'Each grade sheet entry requires expectedUpdatedAt',
        );
      }
      if (entry.operation === GradeSheetOperation.SET) {
        if (entry.score === undefined || entry.score === null) {
          throw new BadRequestException(
            'SET grade sheet entries require a score',
          );
        }
        const maxScore =
          typeof assessment.maxScore === 'number'
            ? assessment.maxScore
            : assessment.maxScore.toNumber();
        assertScoreWithinAssessmentMax(entry.score, maxScore);
        assertScoreWithinGradingScheme(entry.score, bounds);
        continue;
      }
      if (entry.score !== undefined || entry.observations !== undefined) {
        throw new BadRequestException(
          'CLEAR grade sheet entries cannot include score or observations',
        );
      }
    }
  }

  private async assertSheetEnrollmentsEligible(
    assessment: {
      teacherAssignment: { courseId: string; academicPeriodId: string };
    },
    entries: BulkUpsertGradesDto['entries'],
  ): Promise<void> {
    const enrollmentIds = entries.map((entry) => entry.enrollmentId);
    const eligible = await this.prisma.enrollment.findMany({
      where: {
        id: { in: enrollmentIds },
        courseId: assessment.teacherAssignment.courseId,
        academicPeriodId: assessment.teacherAssignment.academicPeriodId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (eligible.length !== enrollmentIds.length) {
      throw new BadRequestException(
        'Every grade sheet enrollment must be active in the assessment course and period',
      );
    }
  }

  private assertExpectedRevision(
    existing: { updatedAt: Date } | null,
    expectedUpdatedAt: string | null,
  ): void {
    if (!existing && expectedUpdatedAt === null) return;
    if (
      existing &&
      expectedUpdatedAt !== null &&
      existing.updatedAt.getTime() === new Date(expectedUpdatedAt).getTime()
    )
      return;
    throw new ConflictException(
      'A grade changed since this sheet was loaded. Refresh before saving.',
    );
  }

  private normalizeObservations(
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    return value.trim() || null;
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

    if (actor.role === Role.REPRESENTATIVE) {
      where.enrollment = {
        ...(where.enrollment as Prisma.EnrollmentWhereInput),
        student: {
          representativeStudentRelations: {
            some: { representativeUserId: actor.id, isActive: true },
          },
        },
      };
      where.assessment = {
        ...(where.assessment as Prisma.AssessmentWhereInput),
        status: AssessmentStatus.PUBLISHED,
      };
      return where;
    }

    if (actor.role === Role.ADMIN) {
      const institutionId = await resolveActorInstitutionId(this.prisma, actor);
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
      where.assessment = {
        ...(where.assessment as Prisma.AssessmentWhereInput),
        status: AssessmentStatus.PUBLISHED,
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

  private assertAssessmentDraft(assessment: {
    status: AssessmentStatus;
  }): void {
    if (assessment.status === AssessmentStatus.PUBLISHED) {
      throw new BadRequestException(
        'Published assessment grades require the correction workflow',
      );
    }
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
