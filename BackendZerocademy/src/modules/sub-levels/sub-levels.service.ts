import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  academicLevelVisibilityFilter,
  subLevelVisibilityFilter,
} from '../../common/utils/academic-structure-scope.util';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { SUB_LEVELS_CONTEXT } from './constants';
import { CreateSubLevelDto } from './dto/create-sub-level.dto';
import { ListSubLevelsQueryDto } from './dto/list-sub-levels-query.dto';
import { SubLevelListResponseDto } from './dto/sub-level-list-response.dto';
import { SubLevelResponseDto } from './dto/sub-level-response.dto';
import { UpdateSubLevelDto } from './dto/update-sub-level.dto';

@Injectable()
export class SubLevelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListSubLevelsQueryDto,
  ): Promise<SubLevelListResponseDto> {
    const where = this.buildListWhere(query);
    const [total, subLevels] = await this.prisma.$transaction([
      this.prisma.subLevel.count({ where }),
      this.prisma.subLevel.findMany({
        where,
        skip: getPaginationSkip(query.page, query.limit),
        take: query.limit,
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      }),
    ]);
    return {
      data: subLevels.map((subLevel) => this.toResponse(subLevel)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<SubLevelResponseDto> {
    return this.toResponse(await this.findOrThrow(id));
  }

  async create(dto: CreateSubLevelDto): Promise<SubLevelResponseDto> {
    const isSystem = dto.isSystem ?? false;
    const institutionId = dto.institutionId ?? null;
    this.assertSystemRules(isSystem, institutionId);
    await this.assertAcademicLevel(dto.academicLevelId);
    const code = this.normalizeCode(dto.code);
    await this.assertUniqueCode(dto.academicLevelId, code);
    const subLevel = await this.prisma.subLevel.create({
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
    this.log('SUB_LEVEL_CREATED', 'Sublevel created', subLevel.id);
    return this.toResponse(subLevel);
  }

  async update(
    id: string,
    dto: UpdateSubLevelDto,
  ): Promise<SubLevelResponseDto> {
    const existing = await this.findOrThrow(id);
    const academicLevelId = dto.academicLevelId ?? existing.academicLevelId;
    const isSystem = dto.isSystem ?? existing.isSystem;
    const institutionId =
      dto.institutionId !== undefined
        ? dto.institutionId
        : existing.institutionId;
    this.assertSystemRules(isSystem, institutionId);
    if (dto.academicLevelId) await this.assertAcademicLevel(academicLevelId);
    if (dto.code || dto.academicLevelId)
      await this.assertUniqueCode(
        academicLevelId,
        this.normalizeCode(dto.code ?? existing.code),
        id,
      );
    const subLevel = await this.prisma.subLevel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined
          ? { code: this.normalizeCode(dto.code) }
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
    this.log('SUB_LEVEL_UPDATED', 'Sublevel updated', id);
    return this.toResponse(subLevel);
  }

  async activate(id: string): Promise<SubLevelResponseDto> {
    const subLevel = await this.prisma.subLevel.update({
      where: { id },
      data: { isActive: true },
    });
    this.log('SUB_LEVEL_ACTIVATED', 'Sublevel activated', id);
    return this.toResponse(subLevel);
  }
  async deactivate(id: string): Promise<SubLevelResponseDto> {
    const [activeCourses, activeGrades] = await this.prisma.$transaction([
      this.prisma.course.count({ where: { subLevelId: id, isActive: true } }),
      this.prisma.gradeLevel.count({
        where: { subLevelId: id, isActive: true },
      }),
    ]);
    if (activeCourses || activeGrades)
      throw new BadRequestException(
        'Deactivate child courses and grade levels before deactivating this sublevel',
      );
    const subLevel = await this.prisma.subLevel.update({
      where: { id },
      data: { isActive: false },
    });
    this.log('SUB_LEVEL_DEACTIVATED', 'Sublevel deactivated', id);
    return this.toResponse(subLevel);
  }
  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    const [courseCount, gradeCount] = await this.prisma.$transaction([
      this.prisma.course.count({ where: { subLevelId: id } }),
      this.prisma.gradeLevel.count({ where: { subLevelId: id } }),
    ]);
    if (courseCount || gradeCount)
      throw new BadRequestException(
        'Cannot delete a sublevel that has courses or grade levels',
      );
    await this.prisma.subLevel.delete({ where: { id } });
    this.log('SUB_LEVEL_DELETED', 'Sublevel deleted', id);
  }

  private buildListWhere(
    query: ListSubLevelsQueryDto,
  ): Prisma.SubLevelWhereInput {
    const where: Prisma.SubLevelWhereInput = {
      ...subLevelVisibilityFilter(query.institutionId),
    };
    if (query.institutionId)
      where.academicLevel = academicLevelVisibilityFilter(query.institutionId);
    if (query.academicLevelId) where.academicLevelId = query.academicLevelId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.isSystem !== undefined) where.isSystem = query.isSystem;
    if (query.search)
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search.toUpperCase(), mode: 'insensitive' } },
      ];
    return where;
  }
  private async assertAcademicLevel(id: string): Promise<void> {
    const level = await this.prisma.academicLevel.findUnique({ where: { id } });
    if (!level) throw new NotFoundException('Academic level not found');
    if (!level.isActive)
      throw new BadRequestException(
        'Academic level must be active to assign a sublevel',
      );
  }
  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }
  private assertSystemRules(
    isSystem: boolean,
    institutionId: string | null,
  ): void {
    if (isSystem && institutionId)
      throw new BadRequestException(
        'System sublevels cannot be linked to an institution',
      );
  }
  private async assertUniqueCode(
    academicLevelId: string,
    code: string,
    excludeId?: string,
  ): Promise<void> {
    const existing = await this.prisma.subLevel.findFirst({
      where: {
        academicLevelId,
        code,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing)
      throw new BadRequestException(
        'A sublevel with this code already exists in the academic level',
      );
  }
  private async findOrThrow(id: string) {
    const subLevel = await this.prisma.subLevel.findUnique({ where: { id } });
    if (!subLevel) throw new NotFoundException('Sublevel not found');
    return subLevel;
  }
  private toResponse(subLevel: {
    id: string;
    name: string;
    code: string;
    order: number;
    description: string | null;
    academicLevelId: string;
    institutionId: string | null;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): SubLevelResponseDto {
    return {
      ...subLevel,
      description: subLevel.description ?? undefined,
      createdAt: subLevel.createdAt.toISOString(),
      updatedAt: subLevel.updatedAt.toISOString(),
    };
  }
  private log(event: string, message: string, subLevelId: string): void {
    this.logger.log({
      context: SUB_LEVELS_CONTEXT,
      event,
      message,
      metadata: { subLevelId },
    });
  }
}
