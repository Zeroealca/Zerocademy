import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  assertInstitutionExistsAndActive,
  assertValidWeight,
  assertWeightsDoNotExceedTarget,
  assertWeightsSumToTarget,
  decimalToNumber,
} from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT } from './constants';
import { AssessmentCategoryListResponseDto } from './dto/assessment-category-list-response.dto';
import { AssessmentCategoryResponseDto } from './dto/assessment-category-response.dto';
import { CreateAssessmentCategoryDto } from './dto/create-assessment-category.dto';
import { ListAssessmentCategoriesQueryDto } from './dto/list-assessment-categories-query.dto';
import { UpdateAssessmentCategoryDto } from './dto/update-assessment-category.dto';
import { toAssessmentCategoryResponseDto } from './mappers/academic-evaluation.mapper';

@Injectable()
export class AssessmentCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListAssessmentCategoriesQueryDto,
    actor: AuthenticatedUser,
  ): Promise<AssessmentCategoryListResponseDto> {
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      query.institutionId,
    );
    await assertInstitutionExistsAndActive(this.prisma, query.institutionId);

    const where: Prisma.AssessmentCategoryWhereInput = {
      institutionId: query.institutionId,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search?.trim()
        ? { name: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };

    const skip = getPaginationSkip(query.page, query.limit);

    const [total, categories] = await this.prisma.$transaction([
      this.prisma.assessmentCategory.count({ where }),
      this.prisma.assessmentCategory.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      data: categories.map(toAssessmentCategoryResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AssessmentCategoryResponseDto> {
    const category = await this.findCategoryOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      category.institutionId,
    );
    return toAssessmentCategoryResponseDto(category);
  }

  async create(
    dto: CreateAssessmentCategoryDto,
    actor: AuthenticatedUser,
  ): Promise<AssessmentCategoryResponseDto> {
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      dto.institutionId,
    );
    await assertInstitutionExistsAndActive(this.prisma, dto.institutionId);
    assertValidWeight(dto.weight, 'Assessment category');
    await this.assertProspectiveCategoryWeights(
      dto.institutionId,
      new Map(),
      dto.weight,
      'max',
    );

    try {
      const category = await this.prisma.assessmentCategory.create({
        data: {
          institutionId: dto.institutionId,
          name: dto.name.trim(),
          weight: dto.weight,
          description: dto.description?.trim(),
          isActive: true,
        },
      });

      this.logger.log({
        context: ACADEMIC_EVALUATION_CONTEXT,
        event: 'ASSESSMENT_CATEGORY_CREATED',
        message: 'Assessment category created',
        metadata: {
          categoryId: category.id,
          institutionId: dto.institutionId,
        },
      });

      return toAssessmentCategoryResponseDto(category);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateAssessmentCategoryDto,
    actor: AuthenticatedUser,
  ): Promise<AssessmentCategoryResponseDto> {
    const existing = await this.findCategoryOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );

    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Assessment category');
    }

    if (dto.weight !== undefined && existing.isActive) {
      await this.assertProspectiveCategoryWeights(
        existing.institutionId,
        new Map([[id, dto.weight]]),
      );
    }

    const category = await this.prisma.assessmentCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() ?? null }
          : {}),
      },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'ASSESSMENT_CATEGORY_UPDATED',
      message: 'Assessment category updated',
      metadata: { categoryId: id },
    });

    return toAssessmentCategoryResponseDto(category);
  }

  async deactivate(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<AssessmentCategoryResponseDto> {
    const existing = await this.findCategoryOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );
    const category = await this.prisma.assessmentCategory.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'ASSESSMENT_CATEGORY_DEACTIVATED',
      message: 'Assessment category deactivated',
      metadata: { categoryId: id },
    });

    return toAssessmentCategoryResponseDto(category);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.findCategoryOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );
    await this.prisma.assessmentCategory.delete({ where: { id } });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'ASSESSMENT_CATEGORY_DELETED',
      message: 'Assessment category deleted',
      metadata: {
        categoryId: id,
        institutionId: existing.institutionId,
      },
    });
  }

  private async assertProspectiveCategoryWeights(
    institutionId: string,
    overrides: Map<string, number>,
    additionalWeight?: number,
    mode: 'exact' | 'max' = 'exact',
  ): Promise<void> {
    const activeCategories = await this.prisma.assessmentCategory.findMany({
      where: { institutionId, isActive: true },
      select: { id: true, weight: true },
    });

    const weights = activeCategories.map(
      (category) =>
        overrides.get(category.id) ?? decimalToNumber(category.weight),
    );

    if (additionalWeight !== undefined) {
      weights.push(additionalWeight);
    }

    if (mode === 'max') {
      assertWeightsDoNotExceedTarget(weights, 'Assessment category');
      return;
    }

    assertWeightsSumToTarget(weights, 'Assessment category');
  }

  private async findCategoryOrThrow(id: string) {
    const category = await this.prisma.assessmentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Assessment category not found');
    }

    return category;
  }

  private mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Assessment category name already exists for this institution',
      );
    }
  }
}
