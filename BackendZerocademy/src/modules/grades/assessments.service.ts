import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
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
import { AssessmentListResponseDto } from './dto/assessment-list-response.dto';
import { AssessmentResponseDto } from './dto/assessment-response.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsQueryDto } from './dto/list-assessments-query.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import {
  assessmentInclude,
  toAssessmentResponseDto,
} from './mappers/assessment.mapper';
import {
  assertActorCanAccessAssessment,
  assertAssessmentKeysValid,
  assertTeacherOwnsAssignment,
  decimalFromInput,
} from './grades.validation';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    actor: AuthenticatedUser,
    query: ListAssessmentsQueryDto,
  ): Promise<AssessmentListResponseDto> {
    const where = await this.buildListWhere(actor, query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, assessments] = await this.prisma.$transaction([
      this.prisma.assessment.count({ where }),
      this.prisma.assessment.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ assessmentDate: 'desc' }, { createdAt: 'desc' }],
        include: assessmentInclude,
      }),
    ]);

    return {
      data: assessments.map(toAssessmentResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<AssessmentResponseDto> {
    const assessment = await this.findAssessmentOrThrow(id);
    await assertActorCanAccessAssessment(this.prisma, actor, assessment);
    return toAssessmentResponseDto(assessment);
  }

  async create(
    actor: AuthenticatedUser,
    dto: CreateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    await assertTeacherOwnsAssignment(
      this.prisma,
      actor,
      dto.teacherAssignmentId,
    );

    await assertAssessmentKeysValid(this.prisma, {
      institutionId: dto.institutionId,
      academicPeriodId: dto.academicPeriodId,
      academicTermId: dto.academicTermId,
      subjectId: dto.subjectId,
      teacherAssignmentId: dto.teacherAssignmentId,
      assessmentCategoryId: dto.assessmentCategoryId,
      maxScore: dto.maxScore,
      weight: dto.weight,
    });

    const assessment = await this.prisma.assessment.create({
      data: {
        institutionId: dto.institutionId,
        academicPeriodId: dto.academicPeriodId,
        academicTermId: dto.academicTermId,
        subjectId: dto.subjectId,
        teacherAssignmentId: dto.teacherAssignmentId,
        assessmentCategoryId: dto.assessmentCategoryId,
        title: dto.title,
        description: dto.description,
        maxScore: decimalFromInput(dto.maxScore),
        weight: decimalFromInput(dto.weight),
        assessmentDate: new Date(dto.assessmentDate),
      },
      include: assessmentInclude,
    });

    this.logger.log({
      context: GRADES_CONTEXT,
      event: 'ASSESSMENT_CREATED',
      message: 'Assessment created',
      metadata: {
        assessmentId: assessment.id,
        teacherAssignmentId: assessment.teacherAssignmentId,
        actorId: actor.id,
      },
    });

    return toAssessmentResponseDto(assessment);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    const existing = await this.findAssessmentOrThrow(id);
    await assertActorCanAccessAssessment(this.prisma, actor, existing);

    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers can update assessments');
    }

    const keys = {
      institutionId: dto.institutionId ?? existing.institutionId,
      academicPeriodId: dto.academicPeriodId ?? existing.academicPeriodId,
      academicTermId: dto.academicTermId ?? existing.academicTermId,
      subjectId: dto.subjectId ?? existing.subjectId,
      teacherAssignmentId:
        dto.teacherAssignmentId ?? existing.teacherAssignmentId,
      assessmentCategoryId:
        dto.assessmentCategoryId ?? existing.assessmentCategoryId,
      maxScore:
        dto.maxScore ?? decimalToNumber(existing.maxScore),
      weight: dto.weight ?? decimalToNumber(existing.weight),
    };

    await assertTeacherOwnsAssignment(
      this.prisma,
      actor,
      keys.teacherAssignmentId,
    );
    await assertAssessmentKeysValid(this.prisma, keys);

    const assessment = await this.prisma.assessment.update({
      where: { id },
      data: {
        ...(dto.institutionId !== undefined
          ? { institutionId: dto.institutionId }
          : {}),
        ...(dto.academicPeriodId !== undefined
          ? { academicPeriodId: dto.academicPeriodId }
          : {}),
        ...(dto.academicTermId !== undefined
          ? { academicTermId: dto.academicTermId }
          : {}),
        ...(dto.subjectId !== undefined ? { subjectId: dto.subjectId } : {}),
        ...(dto.teacherAssignmentId !== undefined
          ? { teacherAssignmentId: dto.teacherAssignmentId }
          : {}),
        ...(dto.assessmentCategoryId !== undefined
          ? { assessmentCategoryId: dto.assessmentCategoryId }
          : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.maxScore !== undefined
          ? { maxScore: decimalFromInput(dto.maxScore) }
          : {}),
        ...(dto.weight !== undefined
          ? { weight: decimalFromInput(dto.weight) }
          : {}),
        ...(dto.assessmentDate !== undefined
          ? { assessmentDate: new Date(dto.assessmentDate) }
          : {}),
      },
      include: assessmentInclude,
    });

    this.logger.log({
      context: GRADES_CONTEXT,
      event: 'ASSESSMENT_UPDATED',
      message: 'Assessment updated',
      metadata: { assessmentId: id, actorId: actor.id },
    });

    return toAssessmentResponseDto(assessment);
  }

  async remove(actor: AuthenticatedUser, id: string): Promise<void> {
    const existing = await this.findAssessmentOrThrow(id);
    await assertActorCanAccessAssessment(this.prisma, actor, existing);

    if (actor.role !== Role.TEACHER) {
      throw new ForbiddenException('Only teachers can delete assessments');
    }

    const gradeCount = await this.prisma.grade.count({
      where: { assessmentId: id },
    });

    if (gradeCount > 0) {
      throw new BadRequestException(
        'Cannot delete an assessment that has grade records',
      );
    }

    await this.prisma.assessment.delete({ where: { id } });

    this.logger.log({
      context: GRADES_CONTEXT,
      event: 'ASSESSMENT_DELETED',
      message: 'Assessment deleted',
      metadata: { assessmentId: id, actorId: actor.id },
    });
  }

  private async buildListWhere(
    actor: AuthenticatedUser,
    query: ListAssessmentsQueryDto,
  ): Promise<Prisma.AssessmentWhereInput> {
    const where: Prisma.AssessmentWhereInput = {};

    if (query.institutionId) {
      where.institutionId = query.institutionId;
    }

    if (query.academicPeriodId) {
      where.academicPeriodId = query.academicPeriodId;
    }

    if (query.academicTermId) {
      where.academicTermId = query.academicTermId;
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.teacherAssignmentId) {
      where.teacherAssignmentId = query.teacherAssignmentId;
    }

    if (query.courseId) {
      where.teacherAssignment = { courseId: query.courseId };
    }

    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
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
        where.institutionId = institutionId;
      }
      return where;
    }

    if (actor.role === Role.TEACHER && actor.profileId) {
      where.teacherAssignment = {
        ...(where.teacherAssignment as Prisma.TeacherAssignmentWhereInput),
        teacherId: actor.profileId,
      };
      return where;
    }

    where.id = '00000000-0000-0000-0000-000000000000';
    return where;
  }

  private async findAssessmentOrThrow(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: assessmentInclude,
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return assessment;
  }
}
