import {
  BadRequestException,
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
  assertAcademicPeriodForInstitution,
  assertInstitutionExistsAndActive,
  assertValidWeight,
  assertWeightsDoNotExceedTarget,
  assertWeightsSumToTarget,
  decimalToNumber,
} from './academic-evaluation.validation';
import { ACADEMIC_EVALUATION_CONTEXT } from './constants';
import { CreateEvaluationTermDto } from './dto/create-evaluation-term.dto';
import { EvaluationTermListResponseDto } from './dto/evaluation-term-list-response.dto';
import { EvaluationTermResponseDto } from './dto/evaluation-term-response.dto';
import { ListEvaluationTermsQueryDto } from './dto/list-evaluation-terms-query.dto';
import { ReorderEvaluationTermsDto } from './dto/reorder-evaluation-terms.dto';
import { UpdateEvaluationTermDto } from './dto/update-evaluation-term.dto';
import { UpdateEvaluationTermWeightsDto } from './dto/update-evaluation-term-weights.dto';
import { toEvaluationTermResponseDto } from './mappers/academic-evaluation.mapper';

@Injectable()
export class EvaluationTermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListEvaluationTermsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermListResponseDto> {
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      query.institutionId,
    );
    await assertInstitutionExistsAndActive(this.prisma, query.institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      query.institutionId,
      query.academicPeriodId,
    );

    const where: Prisma.EvaluationTermWhereInput = {
      institutionId: query.institutionId,
      academicPeriodId: query.academicPeriodId,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    const skip = getPaginationSkip(query.page, query.limit);

    const [total, terms] = await this.prisma.$transaction([
      this.prisma.evaluationTerm.count({ where }),
      this.prisma.evaluationTerm.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { order: 'asc' },
      }),
    ]);

    return {
      data: terms.map(toEvaluationTermResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto> {
    const term = await this.findTermOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      term.institutionId,
    );
    return toEvaluationTermResponseDto(term);
  }

  async create(
    dto: CreateEvaluationTermDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto> {
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      dto.institutionId,
    );
    await assertInstitutionExistsAndActive(this.prisma, dto.institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      dto.institutionId,
      dto.academicPeriodId,
    );
    assertValidWeight(dto.weight, 'Evaluation term');
    await this.assertProspectiveTermWeights(
      dto.institutionId,
      dto.academicPeriodId,
      new Map(),
      dto.weight,
      'max',
    );

    try {
      const term = await this.prisma.evaluationTerm.create({
        data: {
          institutionId: dto.institutionId,
          academicPeriodId: dto.academicPeriodId,
          name: dto.name.trim(),
          order: dto.order,
          weight: dto.weight,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          isActive: true,
        },
      });

      this.logger.log({
        context: ACADEMIC_EVALUATION_CONTEXT,
        event: 'EVALUATION_TERM_CREATED',
        message: 'Evaluation term created',
        metadata: {
          termId: term.id,
          institutionId: dto.institutionId,
          academicPeriodId: dto.academicPeriodId,
        },
      });

      return toEvaluationTermResponseDto(term);
    } catch (error) {
      this.mapPrismaError(error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Evaluation term persistence failed');
    }
  }

  async update(
    id: string,
    dto: UpdateEvaluationTermDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto> {
    const existing = await this.findTermOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );

    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Evaluation term');
    }

    if (dto.weight !== undefined && existing.isActive) {
      await this.assertProspectiveTermWeights(
        existing.institutionId,
        existing.academicPeriodId,
        new Map([[id, dto.weight]]),
      );
    }

    const term = await this.prisma.evaluationTerm.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_UPDATED',
      message: 'Evaluation term updated',
      metadata: { termId: id },
    });

    return toEvaluationTermResponseDto(term);
  }

  async updateWeights(
    institutionId: string,
    academicPeriodId: string,
    dto: UpdateEvaluationTermWeightsDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto[]> {
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await assertInstitutionExistsAndActive(this.prisma, institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      institutionId,
      academicPeriodId,
    );

    const activeTerms = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId, isActive: true },
      select: { id: true, weight: true },
      orderBy: { order: 'asc' },
    });
    const submittedIds = new Set(dto.items.map((item) => item.id));

    if (
      submittedIds.size !== dto.items.length ||
      submittedIds.size !== activeTerms.length ||
      activeTerms.some((term) => !submittedIds.has(term.id))
    ) {
      throw new BadRequestException(
        'Weight updates must include each active evaluation term exactly once',
      );
    }

    for (const item of dto.items) {
      assertValidWeight(item.weight, 'Evaluation term');
    }
    assertWeightsSumToTarget(
      dto.items.map((item) => item.weight),
      'Evaluation term',
    );

    const weightsById = new Map(
      dto.items.map((item) => [item.id, item.weight]),
    );
    const updated = await this.prisma.$transaction(
      activeTerms.map((term) =>
        this.prisma.evaluationTerm.update({
          where: { id: term.id },
          data: { weight: weightsById.get(term.id) },
        }),
      ),
    );

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_WEIGHTS_UPDATED',
      message: 'Evaluation term weights updated atomically',
      metadata: { institutionId, academicPeriodId, count: updated.length },
    });

    return updated.map(toEvaluationTermResponseDto);
  }

  async reorder(
    institutionId: string,
    academicPeriodId: string,
    dto: ReorderEvaluationTermsDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto[]> {
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
    await assertInstitutionExistsAndActive(this.prisma, institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      institutionId,
      academicPeriodId,
    );

    const terms = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId },
      select: { id: true },
    });

    const termIds = new Set(terms.map((term) => term.id));
    const orders = new Set<number>();

    if (dto.items.length !== terms.length) {
      throw new BadRequestException(
        'Reorder items must include every evaluation term exactly once',
      );
    }

    for (const item of dto.items) {
      if (!termIds.has(item.id)) {
        throw new BadRequestException(
          'Reorder items must belong to the same institution and academic period',
        );
      }

      if (orders.has(item.order)) {
        throw new BadRequestException(
          'Duplicate order values in reorder payload',
        );
      }

      orders.add(item.order);
    }

    // Unique (institutionId, academicPeriodId, order) requires a two-phase
    // write so swaps do not collide mid-transaction.
    await this.prisma.$transaction(async (tx) => {
      for (const [index, item] of dto.items.entries()) {
        await tx.evaluationTerm.update({
          where: { id: item.id },
          data: { order: 10_000 + index },
        });
      }

      for (const item of dto.items) {
        await tx.evaluationTerm.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }
    });

    const updated = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId },
      orderBy: { order: 'asc' },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERMS_REORDERED',
      message: 'Evaluation terms reordered',
      metadata: { institutionId, academicPeriodId, count: dto.items.length },
    });

    return updated.map(toEvaluationTermResponseDto);
  }

  async deactivate(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<EvaluationTermResponseDto> {
    const existing = await this.findTermOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );
    const term = await this.prisma.evaluationTerm.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_DEACTIVATED',
      message: 'Evaluation term deactivated',
      metadata: { termId: id },
    });

    return toEvaluationTermResponseDto(term);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const existing = await this.findTermOrThrow(id);
    await assertActorCanAccessInstitution(
      this.prisma,
      actor,
      existing.institutionId,
    );
    await this.prisma.evaluationTerm.delete({ where: { id } });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_DELETED',
      message: 'Evaluation term deleted',
      metadata: { termId: id, institutionId: existing.institutionId },
    });
  }

  private async assertProspectiveTermWeights(
    institutionId: string,
    academicPeriodId: string,
    overrides: Map<string, number>,
    additionalWeight?: number,
    mode: 'exact' | 'max' = 'exact',
  ): Promise<void> {
    const activeTerms = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId, isActive: true },
      select: { id: true, weight: true },
    });

    const weights = activeTerms.map(
      (term) => overrides.get(term.id) ?? decimalToNumber(term.weight),
    );

    if (additionalWeight !== undefined) {
      weights.push(additionalWeight);
    }

    if (mode === 'max') {
      assertWeightsDoNotExceedTarget(weights, 'Evaluation term');
      return;
    }

    assertWeightsSumToTarget(weights, 'Evaluation term');
  }

  private async findTermOrThrow(id: string) {
    const term = await this.prisma.evaluationTerm.findUnique({ where: { id } });

    if (!term) {
      throw new NotFoundException('Evaluation term not found');
    }

    return term;
  }

  private mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Evaluation term name or order already exists for this period',
      );
    }
  }
}
