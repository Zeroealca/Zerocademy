/* eslint-disable @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the application error contract. */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicPeriodStatus,
  OfficialStudyPlanValuePolicy,
  Prisma,
  Role,
} from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { TIMETABLES_CONTEXT } from './constants';
import type { ConfigureTeachingLoadDto } from './dto/configure-teaching-load.dto';
import type { ListTeachingLoadsQueryDto } from './dto/list-teaching-loads-query.dto';
import {
  type OfficialTeachingLoadReferenceDto,
  type TeachingLoadIssueDto,
  type TeachingLoadListResponseDto,
  type TeachingLoadResponseDto,
  type TeachingLoadValidationResponseDto,
  TeachingLoadValidationSeverity,
  TeachingLoadValidationStatus,
} from './dto/teaching-load-response.dto';

const assignmentInclude = Prisma.validator<Prisma.TeacherAssignmentInclude>()({
  teachingLoad: true,
  course: {
    select: {
      id: true,
      name: true,
      gradeLevelId: true,
      gradeLevel: { select: { code: true } },
    },
  },
  subject: {
    select: { id: true, code: true, name: true, institutionId: true },
  },
  teacher: {
    select: { id: true, user: { select: { firstName: true, lastName: true } } },
  },
});

type AssignmentWithDetails = Prisma.TeacherAssignmentGetPayload<{
  include: typeof assignmentInclude;
}>;
type AdoptedPlan = Prisma.InstitutionStudyPlanAdoptionGetPayload<{
  include: { officialStudyPlan: { include: { entries: true } } };
}>;

@Injectable()
export class TimetablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly permissionEnforcer: MembershipPermissionEnforcer,
  ) {}

  async listTeachingLoads(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
    query: ListTeachingLoadsQueryDto,
  ): Promise<TeachingLoadListResponseDto> {
    await this.authorizeRead(actor, institutionId, academicPeriodId);
    const teacherId =
      actor.role === Role.TEACHER ? actor.profileId : query.teacherId;
    if (actor.role === Role.TEACHER && !teacherId)
      throw new NotFoundException('Teaching loads not found');
    const where: Prisma.TeacherAssignmentWhereInput = {
      institutionId,
      academicPeriodId,
      ...(teacherId ? { teacherId } : {}),
    };
    const [total, assignments, adoptions] = await this.prisma.$transaction([
      this.prisma.teacherAssignment.count({ where }),
      this.prisma.teacherAssignment.findMany({
        where,
        skip: getPaginationSkip(query.page, query.limit),
        take: query.limit,
        orderBy: [{ course: { name: 'asc' } }, { subject: { name: 'asc' } }],
        include: assignmentInclude,
      }),
      this.findAdoptedPlans(institutionId, academicPeriodId),
    ]);
    return {
      data: assignments.map((assignment) =>
        this.toResponse(assignment, adoptions),
      ),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getTeachingLoad(
    actor: AuthenticatedUser,
    assignmentId: string,
  ): Promise<TeachingLoadResponseDto> {
    const assignment = await this.findAssignment(assignmentId);
    if (!assignment.institutionId)
      throw new NotFoundException('Teaching load not found');
    await this.authorizeRead(
      actor,
      assignment.institutionId,
      assignment.academicPeriodId,
    );
    if (actor.role === Role.TEACHER && assignment.teacherId !== actor.profileId)
      throw new NotFoundException('Teaching load not found');
    const adoptions = await this.findAdoptedPlans(
      assignment.institutionId,
      assignment.academicPeriodId,
    );
    return this.toResponse(assignment, adoptions);
  }

  async configureTeachingLoad(
    actor: AuthenticatedUser,
    assignmentId: string,
    dto: ConfigureTeachingLoadDto,
  ): Promise<TeachingLoadResponseDto> {
    const assignment = await this.findAssignment(assignmentId);
    if (!assignment.institutionId)
      throw new NotFoundException('Teaching load not found');
    await this.authorizeConfigure(
      actor,
      assignment.institutionId,
      assignment.academicPeriodId,
    );
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: assignment.academicPeriodId },
      select: { institutionId: true, status: true },
    });
    if (
      !period ||
      (period.institutionId !== null &&
        period.institutionId !== assignment.institutionId)
    )
      throw new NotFoundException('Academic period not found');
    if (
      period.status === AcademicPeriodStatus.CLOSED ||
      period.status === AcademicPeriodStatus.ARCHIVED
    ) {
      throw new BadRequestException(
        'Teaching loads cannot change a closed or archived academic period',
      );
    }
    const adoptions = await this.findAdoptedPlans(
      assignment.institutionId,
      assignment.academicPeriodId,
    );
    const reference = this.resolveReference(assignment, adoptions);
    this.assertOfficialValue(dto.weeklyPeriods, reference);
    const teachingLoad = await this.prisma.$transaction((tx) =>
      tx.teachingLoad.upsert({
        where: { teacherAssignmentId: assignment.id },
        create: {
          teacherAssignmentId: assignment.id,
          weeklyPeriods: dto.weeklyPeriods,
        },
        update: { weeklyPeriods: dto.weeklyPeriods },
      }),
    );
    this.logger.log({
      context: TIMETABLES_CONTEXT,
      event: 'TEACHING_LOAD_CONFIGURED',
      message: 'Teaching load configured',
      userId: actor.id,
      metadata: {
        teacherAssignmentId: assignment.id,
        institutionId: assignment.institutionId,
        academicPeriodId: assignment.academicPeriodId,
        weeklyPeriods: teachingLoad.weeklyPeriods,
      },
    });
    return this.toResponse({ ...assignment, teachingLoad }, adoptions);
  }

  async validateConfiguration(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<TeachingLoadValidationResponseDto> {
    await this.authorizeRead(actor, institutionId, academicPeriodId);
    if (actor.role === Role.TEACHER)
      throw new NotFoundException('Teaching-load validation not found');
    const [assignments, adoptions, courses] = await this.prisma.$transaction([
      this.prisma.teacherAssignment.findMany({
        where: { institutionId, academicPeriodId },
        include: assignmentInclude,
      }),
      this.findAdoptedPlans(institutionId, academicPeriodId),
      this.prisma.course.findMany({
        where: { institutionId, academicPeriodId },
        select: { id: true, gradeLevelId: true },
      }),
    ]);
    const issues = assignments.flatMap(
      (assignment) => this.toResponse(assignment, adoptions).issues,
    );
    for (const course of courses) {
      for (const adoption of adoptions) {
        for (const entry of adoption.officialStudyPlan.entries.filter(
          (item) => item.gradeLevelId === course.gradeLevelId,
        )) {
          const staffed = assignments.some(
            (assignment) =>
              assignment.courseId === course.id &&
              assignment.subjectId === entry.subjectId,
          );
          if (!staffed)
            issues.push(
              this.issue(
                TeachingLoadValidationStatus.NO_TEACHER_ASSIGNMENT,
                TeachingLoadValidationSeverity.ERROR,
                'A required official subject has no TeacherAssignment',
                null,
                course.id,
                entry.subjectId,
              ),
            );
        }
      }
    }
    return {
      configurationReady: !issues.some(
        (issue) => issue.severity === TeachingLoadValidationSeverity.ERROR,
      ),
      issues,
    };
  }

  private async authorizeRead(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN && actor.role !== Role.TEACHER)
      throw new NotFoundException('Teaching loads not found');
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await this.assertPeriodContext(institutionId, academicPeriodId);
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.TEACHING_LOADS.READ,
      domain: 'timetables',
      resourceType: 'institutionAcademicPeriod',
      resourceId: academicPeriodId,
    });
  }

  private async authorizeConfigure(
    actor: AuthenticatedUser,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    if (actor.role !== Role.ADMIN)
      throw new NotFoundException('Teaching load not found');
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await this.assertPeriodContext(institutionId, academicPeriodId);
    await this.permissionEnforcer.requireForInstitutionMembership({
      actor,
      institutionId,
      permission: PERMISSIONS.TEACHING_LOADS.CONFIGURE,
      domain: 'timetables',
      resourceType: 'teacherAssignment',
      resourceId: academicPeriodId,
    });
  }

  private async assertPeriodContext(
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: academicPeriodId },
      select: { institutionId: true },
    });
    if (
      !period ||
      (period.institutionId !== null && period.institutionId !== institutionId)
    )
      throw new NotFoundException('Academic period not found');
  }

  private findAssignment(id: string): Promise<AssignmentWithDetails> {
    return this.prisma.teacherAssignment
      .findUnique({ where: { id }, include: assignmentInclude })
      .then((assignment) => {
        if (!assignment)
          throw new NotFoundException('Teacher assignment not found');
        return assignment;
      });
  }

  private findAdoptedPlans(
    institutionId: string,
    academicPeriodId: string,
  ): Prisma.PrismaPromise<AdoptedPlan[]> {
    return this.prisma.institutionStudyPlanAdoption.findMany({
      where: { institutionId, academicPeriodId },
      include: { officialStudyPlan: { include: { entries: true } } },
      orderBy: { applicabilityKey: 'asc' },
    });
  }

  private resolveReference(
    assignment: AssignmentWithDetails,
    adoptions: AdoptedPlan[],
  ): OfficialTeachingLoadReferenceDto {
    const matched = adoptions
      .map((adoption) => ({
        adoption,
        entry: adoption.officialStudyPlan.entries.find(
          (entry) =>
            entry.gradeLevelId === assignment.course.gradeLevelId &&
            entry.subjectId === assignment.subjectId,
        ),
      }))
      .find((item) => item.entry);
    if (!matched) {
      return {
        studyPlanId: null,
        studyPlanCode: null,
        studyPlanVersion: null,
        valuePolicy: null,
        defaultWeeklyPeriods: null,
        minimumWeeklyPeriods: null,
        sourceReference: null,
        sourceUrl: null,
        outsideVerifiedCatalog: true,
      };
    }
    const { adoption, entry } = matched;
    if (!entry) {
      return {
        studyPlanId: null,
        studyPlanCode: null,
        studyPlanVersion: null,
        valuePolicy: null,
        defaultWeeklyPeriods: null,
        minimumWeeklyPeriods: null,
        sourceReference: null,
        sourceUrl: null,
        outsideVerifiedCatalog: true,
      };
    }
    return {
      studyPlanId: adoption.officialStudyPlanId,
      studyPlanCode: adoption.officialStudyPlan.code,
      studyPlanVersion: adoption.officialStudyPlan.version,
      valuePolicy: entry.valuePolicy,
      defaultWeeklyPeriods: entry.defaultWeeklyPeriods,
      minimumWeeklyPeriods: entry.minimumWeeklyPeriods,
      sourceReference: adoption.officialStudyPlan.sourceReference,
      sourceUrl: adoption.officialStudyPlan.sourceUrl,
      outsideVerifiedCatalog: false,
    };
  }

  private toResponse(
    assignment: AssignmentWithDetails,
    adoptions: AdoptedPlan[],
  ): TeachingLoadResponseDto {
    if (!assignment.institutionId) {
      throw new NotFoundException('Teaching load not found');
    }
    const officialReference = this.resolveReference(assignment, adoptions);
    const issues = this.assignmentIssues(assignment, officialReference);
    return {
      teacherAssignmentId: assignment.id,
      institutionId: assignment.institutionId,
      academicPeriodId: assignment.academicPeriodId,
      courseId: assignment.courseId,
      courseName: assignment.course.name,
      gradeLevelId: assignment.course.gradeLevelId,
      gradeLevelCode: assignment.course.gradeLevel.code,
      subjectId: assignment.subjectId,
      subjectCode: assignment.subject.code,
      subjectName: assignment.subject.name,
      teacherId: assignment.teacherId,
      teacherName:
        `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`.trim(),
      weeklyPeriods: assignment.teachingLoad?.weeklyPeriods ?? null,
      officialReference,
      validationStatus: issues[0]?.status ?? TeachingLoadValidationStatus.VALID,
      issues,
    };
  }

  private assignmentIssues(
    assignment: AssignmentWithDetails,
    reference: OfficialTeachingLoadReferenceDto,
  ): TeachingLoadIssueDto[] {
    const id = assignment.id;
    if (!assignment.teachingLoad)
      return [
        this.issue(
          TeachingLoadValidationStatus.UNCONFIGURED,
          TeachingLoadValidationSeverity.ERROR,
          'Teaching load has not been configured',
          id,
          assignment.courseId,
          assignment.subjectId,
        ),
      ];
    if (
      reference.valuePolicy === OfficialStudyPlanValuePolicy.MINIMUM &&
      reference.minimumWeeklyPeriods !== null &&
      assignment.teachingLoad.weeklyPeriods < reference.minimumWeeklyPeriods
    ) {
      return [
        this.issue(
          TeachingLoadValidationStatus.BELOW_OFFICIAL_MINIMUM,
          TeachingLoadValidationSeverity.ERROR,
          'Configured weekly periods are below the official minimum',
          id,
          assignment.courseId,
          assignment.subjectId,
        ),
      ];
    }
    if (
      reference.valuePolicy === OfficialStudyPlanValuePolicy.FIXED &&
      reference.defaultWeeklyPeriods !== null &&
      assignment.teachingLoad.weeklyPeriods !== reference.defaultWeeklyPeriods
    ) {
      return [
        this.issue(
          TeachingLoadValidationStatus.FIXED_VALUE_MISMATCH,
          TeachingLoadValidationSeverity.ERROR,
          'Configured weekly periods do not match the official fixed value',
          id,
          assignment.courseId,
          assignment.subjectId,
        ),
      ];
    }
    if (assignment.subject.institutionId)
      return [
        this.issue(
          TeachingLoadValidationStatus.CUSTOM_SUBJECT,
          TeachingLoadValidationSeverity.INFO,
          'Custom subject has no official study-plan entry',
          id,
          assignment.courseId,
          assignment.subjectId,
        ),
      ];
    if (reference.outsideVerifiedCatalog)
      return [
        this.issue(
          TeachingLoadValidationStatus.NO_OFFICIAL_REFERENCE,
          TeachingLoadValidationSeverity.INFO,
          'No verified official reference applies to this grade and subject',
          id,
          assignment.courseId,
          assignment.subjectId,
        ),
      ];
    return [];
  }

  private assertOfficialValue(
    weeklyPeriods: number,
    reference: OfficialTeachingLoadReferenceDto,
  ): void {
    if (
      reference.valuePolicy === OfficialStudyPlanValuePolicy.MINIMUM &&
      reference.minimumWeeklyPeriods !== null &&
      weeklyPeriods < reference.minimumWeeklyPeriods
    )
      throw new BadRequestException(
        'Weekly periods cannot be below the official minimum',
      );
    if (
      reference.valuePolicy === OfficialStudyPlanValuePolicy.FIXED &&
      reference.defaultWeeklyPeriods !== null &&
      weeklyPeriods !== reference.defaultWeeklyPeriods
    )
      throw new BadRequestException(
        'Weekly periods must match the official fixed value',
      );
  }

  private issue(
    status: TeachingLoadValidationStatus,
    severity: TeachingLoadValidationSeverity,
    message: string,
    teacherAssignmentId: string | null,
    courseId: string | null,
    subjectId: string | null,
  ): TeachingLoadIssueDto {
    return {
      status,
      severity,
      message,
      teacherAssignmentId,
      courseId,
      subjectId,
      allocationGroupId: null,
    };
  }
}
