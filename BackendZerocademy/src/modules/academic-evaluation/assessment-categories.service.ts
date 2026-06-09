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
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertInstitutionExistsAndActive,
  assertValidWeight,
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
  ): Promise<AssessmentCategoryListResponseDto> {
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

  async findOne(id: string): Promise<AssessmentCategoryResponseDto> {
    const category = await this.findCategoryOrThrow(id);
    return toAssessmentCategoryResponseDto(category);
  }

  async create(
    dto: CreateAssessmentCategoryDto,
  ): Promise<AssessmentCategoryResponseDto> {
    await assertInstitutionExistsAndActive(this.prisma, dto.institutionId);
    assertValidWeight(dto.weight, 'Assessment category');

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

      await this.validateCategoryWeights(dto.institutionId);

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
  ): Promise<AssessmentCategoryResponseDto> {
    const existing = await this.findCategoryOrThrow(id);

    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Assessment category');
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

    await this.validateCategoryWeights(existing.institutionId);

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'ASSESSMENT_CATEGORY_UPDATED',
      message: 'Assessment category updated',
      metadata: { categoryId: id },
    });

    return toAssessmentCategoryResponseDto(category);
  }

  async deactivate(id: string): Promise<AssessmentCategoryResponseDto> {
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

  async remove(id: string): Promise<void> {
    const existing = await this.findCategoryOrThrow(id);
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

  private async validateCategoryWeights(institutionId: string): Promise<void> {
    const activeCategories = await this.prisma.assessmentCategory.findMany({
      where: { institutionId, isActive: true },
      select: { weight: true },
    });

    if (activeCategories.length === 0) {
      return;
    }

    assertWeightsSumToTarget(
      activeCategories.map((category) => decimalToNumber(category.weight)),
      'Assessment category',
    );
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
