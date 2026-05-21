import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicPeriodStatus as PeriodStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  academicLevelVisibilityFilter,
  gradeLevelVisibilityFilter,
} from '../../common/utils/academic-structure-scope.util';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { findActiveInstitutionOrThrow } from '../institutions/institution.validation';
import {
  assertValidPeriodDates,
  parseDateOnly,
} from '../academic-periods/academic-period.validation';
import {
  academicPeriodWithTermsInclude,
  toAcademicPeriodResponseDto,
} from '../academic-periods/mappers/academic-period.mapper';
import {
  ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
  TRANSITION_LOG_EVENTS,
} from './constants';
import { ActiveAcademicPeriodResponseDto } from './dto/active-academic-period-response.dto';
import { AcademicTransitionListResponseDto } from './dto/academic-transition-list-response.dto';
import { AcademicTransitionPreviewResponseDto } from './dto/academic-transition-preview-response.dto';
import { AcademicTransitionRequestDto } from './dto/academic-transition-request.dto';
import { AcademicTransitionResponseDto } from './dto/academic-transition-response.dto';
import { SetActiveAcademicPeriodDto } from './dto/set-active-period.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

interface ResolvedTransitionTarget {
  toPeriodId: string;
  createTarget: boolean;
  copiedTerms: boolean;
}

@Injectable()
export class AcademicPeriodTransitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getActivePeriod(
    institutionId: string,
  ): Promise<ActiveAcademicPeriodResponseDto> {
    await this.assertInstitutionExists(institutionId);

    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { activeAcademicPeriodId: true },
    });

    if (!institution?.activeAcademicPeriodId) {
      return { institutionId, activePeriod: null };
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: institution.activeAcademicPeriodId },
      include: academicPeriodWithTermsInclude,
    });

    return {
      institutionId,
      activePeriod: period ? toAcademicPeriodResponseDto(period, true) : null,
    };
  }

  async setActivePeriod(
    institutionId: string,
    dto: SetActiveAcademicPeriodDto,
    actor: AuthenticatedUser,
  ): Promise<ActiveAcademicPeriodResponseDto> {
    await this.assertCanManageTransitions(actor, institutionId);
    await findActiveInstitutionOrThrow(this.prisma, institutionId);

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academicPeriodId },
    });

    if (!period) {
      throw new NotFoundException('Academic period not found');
    }

    if (period.institutionId !== institutionId) {
      throw new BadRequestException(
        'Academic period does not belong to this institution',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.academicPeriod.updateMany({
        where: {
          institutionId,
          status: PeriodStatus.ACTIVE,
          id: { not: dto.academicPeriodId },
        },
        data: { status: PeriodStatus.CLOSED, isActive: false },
      });

      await tx.academicPeriod.update({
        where: { id: dto.academicPeriodId },
        data: { status: PeriodStatus.ACTIVE, isActive: true },
      });

      await tx.institution.update({
        where: { id: institutionId },
        data: { activeAcademicPeriodId: dto.academicPeriodId },
      });
    });

    this.logger.log({
      context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
      event: TRANSITION_LOG_EVENTS.ACTIVE_PERIOD_SET,
      message: 'Institution active academic period updated',
      metadata: { institutionId, periodId: dto.academicPeriodId },
    });

    return this.getActivePeriod(institutionId);
  }

  async preview(
    institutionId: string,
    dto: AcademicTransitionRequestDto,
  ): Promise<AcademicTransitionPreviewResponseDto> {
    const context = await this.resolveTransitionContext(institutionId, dto);

    this.logger.log({
      context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
      event: TRANSITION_LOG_EVENTS.PREVIEWED,
      message: 'Academic transition preview generated',
      metadata: {
        institutionId,
        fromPeriodId: context.fromPeriod.id,
        toPeriodId: context.target.toPeriodId,
      },
    });

    return this.buildPreviewResponse(context, dto);
  }

  async execute(
    institutionId: string,
    dto: AcademicTransitionRequestDto,
    actor: AuthenticatedUser,
  ): Promise<AcademicTransitionResponseDto> {
    await this.assertCanManageTransitions(actor, institutionId);

    const context = await this.resolveTransitionContext(institutionId, dto);
    const { options } = dto;

    if (options.copyTeacherAssignments && !options.copyCourses) {
      throw new BadRequestException(
        'copyTeacherAssignments requires copyCourses to be enabled',
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let targetPeriodId = context.target.toPeriodId;

        if (context.target.createTarget && dto.createTargetPeriod) {
          const startDate = parseDateOnly(dto.createTargetPeriod.startDate);
          const endDate = parseDateOnly(dto.createTargetPeriod.endDate);
          assertValidPeriodDates({ startDate, endDate });

          const created = await tx.academicPeriod.create({
            data: {
              name: dto.createTargetPeriod.name.trim(),
              institutionId,
              regime: dto.createTargetPeriod.regime,
              startDate,
              endDate,
              status: PeriodStatus.PLANNED,
              isActive: false,
            },
          });

          targetPeriodId = created.id;

          if (options.copyTerms) {
            const sourceTerms = await tx.academicTerm.findMany({
              where: { academicPeriodId: context.fromPeriod.id },
              orderBy: { order: 'asc' },
            });

            if (sourceTerms.length > 0) {
              await tx.academicTerm.createMany({
                data: sourceTerms.map((term) => ({
                  academicPeriodId: targetPeriodId,
                  name: term.name,
                  order: term.order,
                  startDate: term.startDate,
                  endDate: term.endDate,
                })),
              });
            }
          }
        }

        const courseIdMap = new Map<string, string>();

        if (options.copyCourses) {
          const sourceCourses = await tx.course.findMany({
            where: { academicPeriodId: context.fromPeriod.id },
          });

          for (const course of sourceCourses) {
            const created = await tx.course.create({
              data: {
                name: course.name,
                section: course.section,
                capacity: course.capacity,
                institutionId,
                academicPeriodId: targetPeriodId,
                gradeLevelId: course.gradeLevelId,
                isActive: course.isActive,
              },
            });
            courseIdMap.set(course.id, created.id);
          }
        }

        if (options.copyTeacherAssignments && options.copyCourses) {
          const sourceAssignments = await tx.teacherAssignment.findMany({
            where: { academicPeriodId: context.fromPeriod.id },
          });

          for (const assignment of sourceAssignments) {
            const newCourseId = courseIdMap.get(assignment.courseId);
            if (!newCourseId) {
              continue;
            }

            await tx.teacherAssignment.create({
              data: {
                institutionId,
                teacherId: assignment.teacherId,
                subjectId: assignment.subjectId,
                courseId: newCourseId,
                academicPeriodId: targetPeriodId,
              },
            });
          }
        }

        if (options.closeSourcePeriod) {
          await tx.academicPeriod.update({
            where: { id: context.fromPeriod.id },
            data: { status: PeriodStatus.CLOSED, isActive: false },
          });
        }

        if (options.activateTargetPeriod) {
          await tx.academicPeriod.updateMany({
            where: {
              institutionId,
              status: PeriodStatus.ACTIVE,
              id: { not: targetPeriodId },
            },
            data: { status: PeriodStatus.CLOSED, isActive: false },
          });

          await tx.academicPeriod.update({
            where: { id: targetPeriodId },
            data: { status: PeriodStatus.ACTIVE, isActive: true },
          });

          await tx.institution.update({
            where: { id: institutionId },
            data: { activeAcademicPeriodId: targetPeriodId },
          });
        }

        const transition = await tx.academicPeriodTransition.create({
          data: {
            institutionId,
            fromAcademicPeriodId: context.fromPeriod.id,
            toAcademicPeriodId: targetPeriodId,
            executedById: actor.id,
            copiedCourses: options.copyCourses,
            copiedAssignments: options.copyTeacherAssignments,
            copiedStructures: true,
            copiedTerms:
              context.target.createTarget && options.copyTerms,
          },
          include: {
            fromPeriod: { select: { id: true, name: true } },
            toPeriod: { select: { id: true, name: true } },
          },
        });

        return transition;
      });

      this.logger.log({
        context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
        event: TRANSITION_LOG_EVENTS.EXECUTED,
        message: 'Academic period transition executed',
        metadata: {
          institutionId,
          transitionId: result.id,
          fromPeriodId: result.fromAcademicPeriodId,
          toPeriodId: result.toAcademicPeriodId,
        },
      });

      return this.toTransitionResponse(result);
    } catch (error) {
      this.logger.error({
        context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
        event: TRANSITION_LOG_EVENTS.FAILED,
        message: 'Academic period transition failed',
        metadata: {
          institutionId,
          fromPeriodId: dto.fromAcademicPeriodId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  async findHistory(
    institutionId: string,
    page: number,
    limit: number,
  ): Promise<AcademicTransitionListResponseDto> {
    await this.assertInstitutionExists(institutionId);
    const skip = getPaginationSkip(page, limit);

    const where = { institutionId };

    const [total, transitions] = await this.prisma.$transaction([
      this.prisma.academicPeriodTransition.count({ where }),
      this.prisma.academicPeriodTransition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          fromPeriod: { select: { id: true, name: true } },
          toPeriod: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: transitions.map((row) => this.toTransitionResponse(row)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async resolveTransitionContext(
    institutionId: string,
    dto: AcademicTransitionRequestDto,
  ) {
    await this.assertInstitutionExists(institutionId);

    const fromPeriod = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.fromAcademicPeriodId },
      include: { terms: true },
    });

    if (!fromPeriod) {
      throw new NotFoundException('Source academic period not found');
    }

    if (fromPeriod.institutionId !== institutionId) {
      throw new BadRequestException(
        'Source period does not belong to this institution',
      );
    }

    const target = await this.resolveTarget(institutionId, dto);

    if (fromPeriod.id === target.toPeriodId) {
      throw new BadRequestException(
        'Source and target academic periods must be different',
      );
    }

    const [courseCount, assignmentCount, levelCount, gradeCount, subjectCount] =
      await Promise.all([
        this.prisma.course.count({
          where: { academicPeriodId: fromPeriod.id },
        }),
        this.prisma.teacherAssignment.count({
          where: { academicPeriodId: fromPeriod.id },
        }),
        this.prisma.academicLevel.count({
          where: academicLevelVisibilityFilter(institutionId),
        }),
        this.prisma.gradeLevel.count({
          where: gradeLevelVisibilityFilter(institutionId),
        }),
        this.prisma.subject.count({
          where: {
            OR: [{ institutionId: null }, { institutionId }],
            isActive: true,
          },
        }),
      ]);

    let toPeriodSummary: { id: string; name: string } | undefined;

    if (!target.createTarget) {
      const toPeriod = await this.prisma.academicPeriod.findUnique({
        where: { id: target.toPeriodId },
        select: { id: true, name: true },
      });
      toPeriodSummary = toPeriod ?? undefined;
    }

    return {
      institutionId,
      fromPeriod,
      target,
      toPeriodSummary,
      counts: {
        courses: courseCount,
        assignments: assignmentCount,
        terms: fromPeriod.terms.length,
        levels: levelCount,
        grades: gradeCount,
        subjects: subjectCount,
      },
    };
  }

  private async resolveTarget(
    institutionId: string,
    dto: AcademicTransitionRequestDto,
  ): Promise<ResolvedTransitionTarget> {
    if (dto.toAcademicPeriodId && dto.createTargetPeriod) {
      throw new BadRequestException(
        'Provide either toAcademicPeriodId or createTargetPeriod, not both',
      );
    }

    if (!dto.toAcademicPeriodId && !dto.createTargetPeriod) {
      throw new BadRequestException(
        'Target period id or createTargetPeriod is required',
      );
    }

    if (dto.toAcademicPeriodId) {
      const toPeriod = await this.prisma.academicPeriod.findUnique({
        where: { id: dto.toAcademicPeriodId },
      });

      if (!toPeriod) {
        throw new NotFoundException('Target academic period not found');
      }

      if (toPeriod.institutionId !== institutionId) {
        throw new BadRequestException(
          'Target period does not belong to this institution',
        );
      }

      return {
        toPeriodId: toPeriod.id,
        createTarget: false,
        copiedTerms: false,
      };
    }

    return {
      toPeriodId: '',
      createTarget: true,
      copiedTerms: dto.options.copyTerms,
    };
  }

  private buildPreviewResponse(
    context: Awaited<ReturnType<AcademicPeriodTransitionsService['resolveTransitionContext']>>,
    dto: AcademicTransitionRequestDto,
  ): AcademicTransitionPreviewResponseDto {
    const { options } = dto;

    return {
      fromPeriod: {
        id: context.fromPeriod.id,
        name: context.fromPeriod.name,
      },
      toPeriod: context.toPeriodSummary,
      willCreateTargetPeriod: context.target.createTarget,
      sourceCounts: {
        courses: context.counts.courses,
        teacherAssignments: context.counts.assignments,
        terms: context.counts.terms,
      },
      estimatedCopies: {
        courses: options.copyCourses ? context.counts.courses : 0,
        teacherAssignments: options.copyTeacherAssignments
          ? context.counts.assignments
          : 0,
        terms:
          context.target.createTarget && options.copyTerms
            ? context.counts.terms
            : 0,
      },
      reusableStructures: {
        academicLevels: context.counts.levels,
        gradeLevels: context.counts.grades,
        subjects: context.counts.subjects,
      },
      structuresReusedNotCopied: true,
    };
  }

  private toTransitionResponse(
    row: {
      id: string;
      institutionId: string;
      fromAcademicPeriodId: string;
      toAcademicPeriodId: string;
      executedById: string;
      copiedCourses: boolean;
      copiedAssignments: boolean;
      copiedStructures: boolean;
      copiedTerms: boolean;
      createdAt: Date;
      fromPeriod: { id: string; name: string };
      toPeriod: { id: string; name: string };
    },
  ): AcademicTransitionResponseDto {
    return {
      id: row.id,
      institutionId: row.institutionId,
      fromPeriod: { id: row.fromPeriod.id, name: row.fromPeriod.name },
      toPeriod: { id: row.toPeriod.id, name: row.toPeriod.name },
      executedById: row.executedById,
      copiedCourses: row.copiedCourses,
      copiedAssignments: row.copiedAssignments,
      copiedStructures: row.copiedStructures,
      copiedTerms: row.copiedTerms,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async assertInstitutionExists(institutionId: string): Promise<void> {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
      select: { id: true },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }
  }

  private async assertCanManageTransitions(
    actor: AuthenticatedUser,
    institutionId: string,
  ): Promise<void> {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }

    if (actor.role !== Role.ADMIN) {
      this.logger.warn({
        context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
        event: TRANSITION_LOG_EVENTS.AUTHORIZATION_FAILED,
        message: 'Transition denied for role',
        metadata: { userId: actor.id, role: actor.role },
      });
      throw new ForbiddenException('Insufficient permissions');
    }

    const membership = await this.prisma.institutionMembership.findFirst({
      where: {
        institutionId,
        userId: actor.id,
        isActive: true,
        role: 'ADMIN',
      },
    });

    if (!membership) {
      this.logger.warn({
        context: ACADEMIC_PERIOD_TRANSITIONS_CONTEXT,
        event: TRANSITION_LOG_EVENTS.AUTHORIZATION_FAILED,
        message: 'Transition denied without institution admin membership',
        metadata: { userId: actor.id, institutionId },
      });
      throw new ForbiddenException(
        'You must be an active admin member of this institution',
      );
    }
  }
}
