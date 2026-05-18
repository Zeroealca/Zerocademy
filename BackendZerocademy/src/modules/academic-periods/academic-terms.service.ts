import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AcademicPeriodStatus, Prisma } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  assertTermWithinPeriod,
  assertTermsDoNotOverlap,
  assertValidPeriodDates,
  parseDateOnly,
} from './academic-period.validation';
import { ACADEMIC_PERIODS_CONTEXT } from './constants';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';
import { AcademicTermResponseDto } from './dto/academic-term-response.dto';
import { toAcademicTermResponseDto } from './mappers/academic-period.mapper';

@Injectable()
export class AcademicTermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async findAllByPeriod(periodId: string): Promise<AcademicTermResponseDto[]> {
    await this.assertPeriodExists(periodId);

    const terms = await this.prisma.academicTerm.findMany({
      where: { academicPeriodId: periodId },
      orderBy: { order: 'asc' },
    });

    return terms.map(toAcademicTermResponseDto);
  }

  async create(
    periodId: string,
    dto: CreateAcademicTermDto,
  ): Promise<AcademicTermResponseDto> {
    const period = await this.assertPeriodExists(periodId);
    this.assertPeriodAllowsTermChanges(period.status);

    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);

    assertValidPeriodDates({ startDate, endDate });
    assertTermWithinPeriod(
      { startDate: period.startDate, endDate: period.endDate },
      { startDate, endDate },
      dto.name,
    );

    await this.assertNoTermOverlap(periodId, { startDate, endDate });

    try {
      const term = await this.prisma.academicTerm.create({
        data: {
          academicPeriodId: periodId,
          name: dto.name.trim(),
          order: dto.order,
          startDate,
          endDate,
        },
      });

      this.logger.log({
        context: ACADEMIC_PERIODS_CONTEXT,
        event: 'TERM_CREATED',
        message: 'Academic term created',
        metadata: { periodId, termId: term.id },
      });

      return toAcademicTermResponseDto(term);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async update(
    periodId: string,
    termId: string,
    dto: UpdateAcademicTermDto,
  ): Promise<AcademicTermResponseDto> {
    const period = await this.assertPeriodExists(periodId);
    this.assertPeriodAllowsTermChanges(period.status);

    const existing = await this.findTermOrThrow(periodId, termId);

    const startDate = dto.startDate
      ? parseDateOnly(dto.startDate)
      : existing.startDate;
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : existing.endDate;

    assertValidPeriodDates({ startDate, endDate });
    assertTermWithinPeriod(
      { startDate: period.startDate, endDate: period.endDate },
      { startDate, endDate },
      dto.name ?? existing.name,
    );

    await this.assertNoTermOverlap(
      periodId,
      { startDate, endDate },
      termId,
    );

    try {
      const term = await this.prisma.academicTerm.update({
        where: { id: termId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.startDate !== undefined ? { startDate } : {}),
          ...(dto.endDate !== undefined ? { endDate } : {}),
        },
      });

      this.logger.log({
        context: ACADEMIC_PERIODS_CONTEXT,
        event: 'TERM_UPDATED',
        message: 'Academic term updated',
        metadata: { periodId, termId },
      });

      return toAcademicTermResponseDto(term);
    } catch (error) {
      this.mapPrismaError(error);
      throw error;
    }
  }

  async remove(periodId: string, termId: string): Promise<void> {
    const period = await this.assertPeriodExists(periodId);
    this.assertPeriodAllowsTermChanges(period.status);
    await this.findTermOrThrow(periodId, termId);

    await this.prisma.academicTerm.delete({ where: { id: termId } });

    this.logger.log({
      context: ACADEMIC_PERIODS_CONTEXT,
      event: 'TERM_DELETED',
      message: 'Academic term deleted',
      metadata: { periodId, termId },
    });
  }

  private async assertPeriodExists(periodId: string) {
    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      throw new NotFoundException('Academic period not found');
    }

    return period;
  }

  private assertPeriodAllowsTermChanges(status: AcademicPeriodStatus): void {
    if (status === AcademicPeriodStatus.ARCHIVED) {
      throw new ConflictException('Cannot modify terms on an archived period');
    }
  }

  private async findTermOrThrow(periodId: string, termId: string) {
    const term = await this.prisma.academicTerm.findFirst({
      where: { id: termId, academicPeriodId: periodId },
    });

    if (!term) {
      throw new NotFoundException('Academic term not found');
    }

    return term;
  }

  private async assertNoTermOverlap(
    periodId: string,
    candidate: { startDate: Date; endDate: Date },
    excludeTermId?: string,
  ): Promise<void> {
    const terms = await this.prisma.academicTerm.findMany({
      where: {
        academicPeriodId: periodId,
        ...(excludeTermId ? { id: { not: excludeTermId } } : {}),
      },
    });

    const combined = [
      ...terms.map((term) => ({
        name: term.name,
        order: term.order,
        startDate: term.startDate,
        endDate: term.endDate,
      })),
      {
        name: 'candidate',
        order: -1,
        startDate: candidate.startDate,
        endDate: candidate.endDate,
      },
    ];

    assertTermsDoNotOverlap(combined);
  }

  private mapPrismaError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A term with this order already exists for the period',
      );
    }
  }
}
