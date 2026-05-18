import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
import { GRADE_LEVELS_CONTEXT } from './constants';
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { GradeLevelListResponseDto } from './dto/grade-level-list-response.dto';
import { GradeLevelResponseDto } from './dto/grade-level-response.dto';
import { ListGradeLevelsQueryDto } from './dto/list-grade-levels-query.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';
import {
  assertParentAcademicLevelExists,
  assertSystemLevelRules,
  assertUniqueGradeLevelCode,
  normalizeAcademicCode,
} from './grade-level.validation';
import { toGradeLevelResponseDto } from './mappers/grade-level.mapper';

@Injectable()
export class GradeLevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListGradeLevelsQueryDto,
  ): Promise<GradeLevelListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, grades] = await this.prisma.$transaction([
      this.prisma.gradeLevel.count({ where }),
      this.prisma.gradeLevel.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      data: grades.map(toGradeLevelResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<GradeLevelResponseDto> {
    const grade = await this.findGradeOrThrow(id);
    return toGradeLevelResponseDto(grade);
  }

  async create(dto: CreateGradeLevelDto): Promise<GradeLevelResponseDto> {
    const isSystem = dto.isSystem ?? false;
    const institutionId = dto.institutionId ?? null;
    assertSystemLevelRules(isSystem, institutionId);
    await assertParentAcademicLevelExists(this.prisma, dto.academicLevelId);

    const code = normalizeAcademicCode(dto.code);
    await assertUniqueGradeLevelCode(
      this.prisma,
      dto.academicLevelId,
      code,
    );

    const grade = await this.prisma.gradeLevel.create({
      data: {
        name: dto.name.trim(),
        code,
        order: dto.order,
        description: dto.description?.trim(),
        academicLevelId: dto.academicLevelId,
        institutionId,
        isSystem,
        isActive: true,
      },
    });

    this.logger.log({
      context: GRADE_LEVELS_CONTEXT,
      event: 'GRADE_LEVEL_CREATED',
      message: 'Grade level created',
      metadata: {
        gradeLevelId: grade.id,
        academicLevelId: grade.academicLevelId,
        code: grade.code,
        isSystem,
      },
    });

    return toGradeLevelResponseDto(grade);
  }

  async update(
    id: string,
    dto: UpdateGradeLevelDto,
  ): Promise<GradeLevelResponseDto> {
    const existing = await this.findGradeOrThrow(id);
    const isSystem = dto.isSystem ?? existing.isSystem;
    const institutionId =
      dto.institutionId !== undefined ? dto.institutionId : existing.institutionId;
    assertSystemLevelRules(isSystem, institutionId);

    const academicLevelId = dto.academicLevelId ?? existing.academicLevelId;

    if (dto.academicLevelId) {
      await assertParentAcademicLevelExists(this.prisma, academicLevelId);
    }

    if (dto.code) {
      await assertUniqueGradeLevelCode(
        this.prisma,
        academicLevelId,
        dto.code,
        id,
      );
    }

    const grade = await this.prisma.gradeLevel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined
          ? { code: normalizeAcademicCode(dto.code) }
          : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() }
          : {}),
        ...(dto.academicLevelId !== undefined ? { academicLevelId } : {}),
        ...(dto.institutionId !== undefined ? { institutionId } : {}),
        ...(dto.isSystem !== undefined ? { isSystem } : {}),
      },
    });

    this.logger.log({
      context: GRADE_LEVELS_CONTEXT,
      event: 'GRADE_LEVEL_UPDATED',
      message: 'Grade level updated',
      metadata: { gradeLevelId: grade.id },
    });

    return toGradeLevelResponseDto(grade);
  }

  async activate(id: string): Promise<GradeLevelResponseDto> {
    const existing = await this.findGradeOrThrow(id);
    await assertParentAcademicLevelExists(this.prisma, existing.academicLevelId);

    const grade = await this.prisma.gradeLevel.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log({
      context: GRADE_LEVELS_CONTEXT,
      event: 'GRADE_LEVEL_ACTIVATED',
      message: 'Grade level activated',
      metadata: { gradeLevelId: id },
    });

    return toGradeLevelResponseDto(grade);
  }

  async deactivate(id: string): Promise<GradeLevelResponseDto> {
    const activeCourses = await this.prisma.course.count({
      where: { gradeLevelId: id, isActive: true },
    });

    if (activeCourses > 0) {
      throw new BadRequestException(
        'Deactivate child courses before deactivating this grade level',
      );
    }

    const grade = await this.prisma.gradeLevel.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: GRADE_LEVELS_CONTEXT,
      event: 'GRADE_LEVEL_DEACTIVATED',
      message: 'Grade level deactivated',
      metadata: { gradeLevelId: id },
    });

    return toGradeLevelResponseDto(grade);
  }

  async remove(id: string): Promise<void> {
    await this.findGradeOrThrow(id);

    const courseCount = await this.prisma.course.count({
      where: { gradeLevelId: id },
    });

    if (courseCount > 0) {
      throw new BadRequestException(
        'Cannot delete a grade level that has courses',
      );
    }

    await this.prisma.gradeLevel.delete({ where: { id } });

    this.logger.log({
      context: GRADE_LEVELS_CONTEXT,
      event: 'GRADE_LEVEL_DELETED',
      message: 'Grade level deleted',
      metadata: { gradeLevelId: id },
    });
  }

  private buildListWhere(
    query: ListGradeLevelsQueryDto,
  ): Prisma.GradeLevelWhereInput {
    const where: Prisma.GradeLevelWhereInput = {
      ...gradeLevelVisibilityFilter(query.institutionId),
    };

    if (query.institutionId) {
      where.academicLevel = academicLevelVisibilityFilter(query.institutionId);
    }

    if (query.academicLevelId) {
      where.academicLevelId = query.academicLevelId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isSystem !== undefined) {
      where.isSystem = query.isSystem;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search.toUpperCase(), mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async findGradeOrThrow(id: string) {
    const grade = await this.prisma.gradeLevel.findUnique({ where: { id } });

    if (!grade) {
      throw new NotFoundException('Grade level not found');
    }

    return grade;
  }
}
