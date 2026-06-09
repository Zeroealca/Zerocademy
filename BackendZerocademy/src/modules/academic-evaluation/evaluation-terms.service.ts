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
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertAcademicPeriodForInstitution,
  assertInstitutionExistsAndActive,
  assertValidWeight,
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
import { toEvaluationTermResponseDto } from './mappers/academic-evaluation.mapper';

@Injectable()
export class EvaluationTermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(
    query: ListEvaluationTermsQueryDto,
  ): Promise<EvaluationTermListResponseDto> {
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

  async findOne(id: string): Promise<EvaluationTermResponseDto> {
    const term = await this.findTermOrThrow(id);
    return toEvaluationTermResponseDto(term);
  }

  async create(dto: CreateEvaluationTermDto): Promise<EvaluationTermResponseDto> {
    await assertInstitutionExistsAndActive(this.prisma, dto.institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      dto.institutionId,
      dto.academicPeriodId,
    );
    assertValidWeight(dto.weight, 'Evaluation term');

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

      await this.validateTermWeights(dto.institutionId, dto.academicPeriodId);

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
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateEvaluationTermDto,
  ): Promise<EvaluationTermResponseDto> {
    const existing = await this.findTermOrThrow(id);

    if (dto.weight !== undefined) {
      assertValidWeight(dto.weight, 'Evaluation term');
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

    await this.validateTermWeights(
      existing.institutionId,
      existing.academicPeriodId,
    );

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_UPDATED',
      message: 'Evaluation term updated',
      metadata: { termId: id },
    });

    return toEvaluationTermResponseDto(term);
  }

  async reorder(
    institutionId: string,
    academicPeriodId: string,
    dto: ReorderEvaluationTermsDto,
  ): Promise<EvaluationTermResponseDto[]> {
    await assertInstitutionExistsAndActive(this.prisma, institutionId);
    await assertAcademicPeriodForInstitution(
      this.prisma,
      institutionId,
      academicPeriodId,
    );

    const terms = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId },
    });

    const termIds = new Set(terms.map((term) => term.id));
    const orders = new Set<number>();

    for (const item of dto.items) {
      if (!termIds.has(item.id)) {
        throw new BadRequestException(
          'Reorder items must belong to the same institution and academic period',
        );
      }

      if (orders.has(item.order)) {
        throw new BadRequestException('Duplicate order values in reorder payload');
      }

      orders.add(item.order);
    }

    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.evaluationTerm.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

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

  async deactivate(id: string): Promise<EvaluationTermResponseDto> {
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

  async remove(id: string): Promise<void> {
    const existing = await this.findTermOrThrow(id);
    await this.prisma.evaluationTerm.delete({ where: { id } });

    this.logger.log({
      context: ACADEMIC_EVALUATION_CONTEXT,
      event: 'EVALUATION_TERM_DELETED',
      message: 'Evaluation term deleted',
      metadata: { termId: id, institutionId: existing.institutionId },
    });
  }

  private async validateTermWeights(
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    const activeTerms = await this.prisma.evaluationTerm.findMany({
      where: { institutionId, academicPeriodId, isActive: true },
      select: { weight: true },
    });

    if (activeTerms.length === 0) {
      return;
    }

    assertWeightsSumToTarget(
      activeTerms.map((term) => decimalToNumber(term.weight)),
      'Evaluation term',
    );
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
