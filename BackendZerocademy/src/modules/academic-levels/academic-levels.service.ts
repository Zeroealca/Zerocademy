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
import {
  assertSystemLevelRules,
  assertUniqueAcademicLevelCode,
  normalizeAcademicCode,
} from './academic-level.validation';
import { ACADEMIC_LEVELS_CONTEXT } from './constants';
import { AcademicHierarchyResponseDto } from './dto/academic-hierarchy-response.dto';
import { AcademicLevelListResponseDto } from './dto/academic-level-list-response.dto';
import { AcademicLevelResponseDto } from './dto/academic-level-response.dto';
import { CreateAcademicLevelDto } from './dto/create-academic-level.dto';
import { AcademicHierarchyQueryDto } from './dto/hierarchy-query.dto';
import { ListAcademicLevelsQueryDto } from './dto/list-academic-levels-query.dto';
import { UpdateAcademicLevelDto } from './dto/update-academic-level.dto';
import { toAcademicLevelResponseDto } from './mappers/academic-level.mapper';

@Injectable()
export class AcademicLevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListAcademicLevelsQueryDto,
  ): Promise<AcademicLevelListResponseDto> {
    const where = this.buildListWhere(query);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, levels] = await this.prisma.$transaction([
      this.prisma.academicLevel.count({ where }),
      this.prisma.academicLevel.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
    ]);

    return {
      data: levels.map(toAcademicLevelResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<AcademicLevelResponseDto> {
    const level = await this.findLevelOrThrow(id);
    return toAcademicLevelResponseDto(level);
  }

  async getHierarchy(
    query: AcademicHierarchyQueryDto,
  ): Promise<AcademicHierarchyResponseDto> {
    const levelVisibility = academicLevelVisibilityFilter(query.institutionId);
    const gradeVisibility = gradeLevelVisibilityFilter(query.institutionId);

    const levels = await this.prisma.academicLevel.findMany({
      where: {
        ...levelVisibility,
        isActive: true,
      },
      orderBy: { order: 'asc' },
      include: {
        gradeLevels: {
          where: {
            ...gradeVisibility,
            isActive: true,
          },
          orderBy: { order: 'asc' },
          include: {
            courses: query.academicPeriodId
              ? {
                  where: { academicPeriodId: query.academicPeriodId },
                  orderBy: [{ section: 'asc' }, { name: 'asc' }],
                }
              : false,
          },
        },
      },
    });

    return {
      levels: levels.map((level) => ({
        id: level.id,
        name: level.name,
        code: level.code,
        order: level.order,
        isActive: level.isActive,
        gradeLevels: level.gradeLevels.map((grade) => ({
          id: grade.id,
          name: grade.name,
          code: grade.code,
          order: grade.order,
          isActive: grade.isActive,
          courses:
            query.academicPeriodId && 'courses' in grade
              ? grade.courses.map((course) => ({
                  id: course.id,
                  name: course.name,
                  section: course.section,
                  capacity: course.capacity,
                  isActive: course.isActive,
                }))
              : [],
        })),
      })),
    };
  }

  async create(dto: CreateAcademicLevelDto): Promise<AcademicLevelResponseDto> {
    const isSystem = dto.isSystem ?? false;
    const institutionId = dto.institutionId ?? null;
    assertSystemLevelRules(isSystem, institutionId);
    const code = normalizeAcademicCode(dto.code);
    await assertUniqueAcademicLevelCode(this.prisma, code, institutionId);

    const level = await this.prisma.academicLevel.create({
      data: {
        name: dto.name.trim(),
        code,
        order: dto.order,
        description: dto.description?.trim(),
        institutionId,
        isSystem,
        isActive: true,
      },
    });

    this.logger.log({
      context: ACADEMIC_LEVELS_CONTEXT,
      event: 'ACADEMIC_LEVEL_CREATED',
      message: 'Academic level created',
      metadata: { levelId: level.id, code: level.code, isSystem },
    });

    return toAcademicLevelResponseDto(level);
  }

  async update(
    id: string,
    dto: UpdateAcademicLevelDto,
  ): Promise<AcademicLevelResponseDto> {
    const existing = await this.findLevelOrThrow(id);
    const isSystem = dto.isSystem ?? existing.isSystem;
    const institutionId =
      dto.institutionId !== undefined ? dto.institutionId : existing.institutionId;
    assertSystemLevelRules(isSystem, institutionId);

    if (dto.code) {
      await assertUniqueAcademicLevelCode(
        this.prisma,
        dto.code,
        institutionId,
        id,
      );
    }

    const level = await this.prisma.academicLevel.update({
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
        ...(dto.institutionId !== undefined ? { institutionId } : {}),
        ...(dto.isSystem !== undefined ? { isSystem } : {}),
      },
    });

    this.logger.log({
      context: ACADEMIC_LEVELS_CONTEXT,
      event: 'ACADEMIC_LEVEL_UPDATED',
      message: 'Academic level updated',
      metadata: { levelId: level.id },
    });

    return toAcademicLevelResponseDto(level);
  }

  async activate(id: string): Promise<AcademicLevelResponseDto> {
    const level = await this.prisma.academicLevel.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log({
      context: ACADEMIC_LEVELS_CONTEXT,
      event: 'ACADEMIC_LEVEL_ACTIVATED',
      message: 'Academic level activated',
      metadata: { levelId: id },
    });

    return toAcademicLevelResponseDto(level);
  }

  async deactivate(id: string): Promise<AcademicLevelResponseDto> {
    const activeGrades = await this.prisma.gradeLevel.count({
      where: { academicLevelId: id, isActive: true },
    });

    if (activeGrades > 0) {
      throw new BadRequestException(
        'Deactivate child grade levels before deactivating this academic level',
      );
    }

    const level = await this.prisma.academicLevel.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: ACADEMIC_LEVELS_CONTEXT,
      event: 'ACADEMIC_LEVEL_DEACTIVATED',
      message: 'Academic level deactivated',
      metadata: { levelId: id },
    });

    return toAcademicLevelResponseDto(level);
  }

  async remove(id: string): Promise<void> {
    await this.findLevelOrThrow(id);

    const gradeCount = await this.prisma.gradeLevel.count({
      where: { academicLevelId: id },
    });

    if (gradeCount > 0) {
      throw new BadRequestException(
        'Cannot delete an academic level that has grade levels',
      );
    }

    await this.prisma.academicLevel.delete({ where: { id } });

    this.logger.log({
      context: ACADEMIC_LEVELS_CONTEXT,
      event: 'ACADEMIC_LEVEL_DELETED',
      message: 'Academic level deleted',
      metadata: { levelId: id },
    });
  }

  private buildListWhere(
    query: ListAcademicLevelsQueryDto,
  ): Prisma.AcademicLevelWhereInput {
    const where: Prisma.AcademicLevelWhereInput = {
      ...academicLevelVisibilityFilter(query.institutionId),
    };

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

  private async findLevelOrThrow(id: string) {
    const level = await this.prisma.academicLevel.findUnique({ where: { id } });

    if (!level) {
      throw new NotFoundException('Academic level not found');
    }

    return level;
  }
}
