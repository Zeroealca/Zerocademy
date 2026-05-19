import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SUBJECTS_CONTEXT } from './constants';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { SubjectHierarchyQueryDto } from './dto/subject-hierarchy-query.dto';
import { SubjectHierarchyResponseDto } from './dto/subject-hierarchy-response.dto';
import { SubjectListResponseDto } from './dto/subject-list-response.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import {
  subjectWithGradeLinksInclude,
  toSubjectResponseDto,
} from './mappers/subject.mapper';
import {
  assertGradeLevelsExist,
  assertSystemSubjectRules,
  assertUniqueSubjectCode,
  normalizeSubjectCode,
} from './subject.validation';

@Injectable()
export class SubjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(query: ListSubjectsQueryDto): Promise<SubjectListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, subjects] = await this.prisma.$transaction([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ name: 'asc' }],
        include: subjectWithGradeLinksInclude,
      }),
    ]);

    return {
      data: subjects.map(toSubjectResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<SubjectResponseDto> {
    const subject = await this.findSubjectOrThrow(id);
    return toSubjectResponseDto(subject);
  }

  async getHierarchy(
    query: SubjectHierarchyQueryDto,
  ): Promise<SubjectHierarchyResponseDto> {
    const where: Prisma.SubjectWhereInput = {};

    if (query.activeOnly !== false) {
      where.isActive = true;
    }

    if (query.gradeLevelId) {
      where.gradeLevelLinks = {
        some: { gradeLevelId: query.gradeLevelId },
      };
    }

    const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
      include: subjectWithGradeLinksInclude,
    });

    return { subjects: subjects.map(toSubjectResponseDto) };
  }

  async create(dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    const isSystem = dto.isSystem ?? false;
    const gradeLevelIds = dto.gradeLevelIds ?? [];
    assertSystemSubjectRules(isSystem, gradeLevelIds);

    const code = normalizeSubjectCode(dto.code);
    await assertUniqueSubjectCode(this.prisma, code);
    await assertGradeLevelsExist(this.prisma, gradeLevelIds);

    const subject = await this.prisma.$transaction(async (tx) => {
      const created = await tx.subject.create({
        data: {
          name: dto.name.trim(),
          code,
          description: dto.description?.trim(),
          isSystem,
          isActive: true,
        },
      });

      if (gradeLevelIds.length > 0) {
        await tx.subjectGradeLevel.createMany({
          data: gradeLevelIds.map((gradeLevelId) => ({
            subjectId: created.id,
            gradeLevelId,
          })),
        });
      }

      return tx.subject.findUniqueOrThrow({
        where: { id: created.id },
        include: subjectWithGradeLinksInclude,
      });
    });

    this.logger.log({
      context: SUBJECTS_CONTEXT,
      event: 'SUBJECT_CREATED',
      message: 'Subject created',
      metadata: { subjectId: subject.id, code: subject.code, isSystem },
    });

    return toSubjectResponseDto(subject);
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<SubjectResponseDto> {
    const existing = await this.findSubjectOrThrow(id);
    const isSystem = dto.isSystem ?? existing.isSystem;
    const gradeLevelIds = dto.gradeLevelIds;

    if (dto.isSystem === true && gradeLevelIds && gradeLevelIds.length > 0) {
      assertSystemSubjectRules(true, gradeLevelIds);
    }

    if (dto.code) {
      await assertUniqueSubjectCode(this.prisma, dto.code, id);
    }

    if (gradeLevelIds) {
      await assertGradeLevelsExist(this.prisma, gradeLevelIds);
    }

    const subject = await this.prisma.$transaction(async (tx) => {
      await tx.subject.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.code !== undefined
            ? { code: normalizeSubjectCode(dto.code) }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description?.trim() }
            : {}),
          ...(dto.isSystem !== undefined ? { isSystem } : {}),
        },
      });

      if (gradeLevelIds !== undefined) {
        await tx.subjectGradeLevel.deleteMany({ where: { subjectId: id } });

        if (gradeLevelIds.length > 0) {
          await tx.subjectGradeLevel.createMany({
            data: gradeLevelIds.map((gradeLevelId) => ({
              subjectId: id,
              gradeLevelId,
            })),
          });
        }
      }

      return tx.subject.findUniqueOrThrow({
        where: { id },
        include: subjectWithGradeLinksInclude,
      });
    });

    this.logger.log({
      context: SUBJECTS_CONTEXT,
      event: 'SUBJECT_UPDATED',
      message: 'Subject updated',
      metadata: { subjectId: id },
    });

    return toSubjectResponseDto(subject);
  }

  async activate(id: string): Promise<SubjectResponseDto> {
    const subject = await this.prisma.subject.update({
      where: { id },
      data: { isActive: true },
      include: subjectWithGradeLinksInclude,
    });

    this.logger.log({
      context: SUBJECTS_CONTEXT,
      event: 'SUBJECT_ACTIVATED',
      message: 'Subject activated',
      metadata: { subjectId: id },
    });

    return toSubjectResponseDto(subject);
  }

  async deactivate(id: string): Promise<SubjectResponseDto> {
    const activeAssignments = await this.prisma.teacherAssignment.count({
      where: { subjectId: id },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Remove teacher assignments before deactivating this subject',
      );
    }

    const subject = await this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
      include: subjectWithGradeLinksInclude,
    });

    this.logger.log({
      context: SUBJECTS_CONTEXT,
      event: 'SUBJECT_DEACTIVATED',
      message: 'Subject deactivated',
      metadata: { subjectId: id },
    });

    return toSubjectResponseDto(subject);
  }

  async remove(id: string): Promise<void> {
    await this.findSubjectOrThrow(id);

    const assignmentCount = await this.prisma.teacherAssignment.count({
      where: { subjectId: id },
    });

    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete a subject that has teacher assignments',
      );
    }

    await this.prisma.subject.delete({ where: { id } });

    this.logger.log({
      context: SUBJECTS_CONTEXT,
      event: 'SUBJECT_DELETED',
      message: 'Subject deleted',
      metadata: { subjectId: id },
    });
  }

  private buildListWhere(query: ListSubjectsQueryDto): Prisma.SubjectWhereInput {
    const where: Prisma.SubjectWhereInput = {};

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isSystem !== undefined) {
      where.isSystem = query.isSystem;
    }

    if (query.gradeLevelId) {
      where.gradeLevelLinks = {
        some: { gradeLevelId: query.gradeLevelId },
      };
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        {
          code: {
            contains: query.search.toUpperCase(),
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  private async findSubjectOrThrow(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: subjectWithGradeLinksInclude,
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }
}
