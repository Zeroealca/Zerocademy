import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { AppConfig } from '../../config/configuration';
import {
  assertActorCanAccessInstitution,
  resolveActorInstitutionIds,
} from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import {
  buildPaginationMeta,
  getPaginationSkip,
} from '../../common/utils/pagination.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  INSTITUTIONS_CONTEXT,
  INSTITUTION_LOG_EVENTS,
} from './constants';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { InstitutionListResponseDto } from './dto/institution-list-response.dto';
import { InstitutionResponseDto } from './dto/institution-response.dto';
import { ListInstitutionsQueryDto } from './dto/list-institutions-query.dto';
import { UpdateInstitutionBrandingDto } from './dto/update-institution-branding.dto';
import { UpdateInstitutionSettingsDto } from './dto/update-institution-settings.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import {
  assertRegionRegimeConsistency,
  assertUniqueInstitutionCode,
  assertValidHexColor,
  assertValidInstitutionCode,
  buildInstitutionListWhere,
  normalizeInstitutionCode,
} from './institution.validation';
import {
  assertValidLogoUpload,
  processAndStoreInstitutionLogo,
} from './institution-logo.storage';
import { toInstitutionResponseDto } from './mappers/institution.mapper';

@Injectable()
export class InstitutionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async findAll(
    query: ListInstitutionsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<InstitutionListResponseDto> {
    const filters = buildInstitutionListWhere(query);
    const where = await this.applyActorInstitutionScope(filters, actor);
    const skip = getPaginationSkip(query.page, query.limit);

    const [total, institutions] = await this.prisma.$transaction([
      this.prisma.institution.count({ where }),
      this.prisma.institution.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: [{ name: 'asc' }],
      }),
    ]);

    return {
      data: institutions.map(toInstitutionResponseDto),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    await assertActorCanAccessInstitution(this.prisma, actor, id);
    const institution = await this.findInstitutionOrThrow(id);
    return toInstitutionResponseDto(institution);
  }

  async create(dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    assertValidInstitutionCode(dto.code);
    const code = normalizeInstitutionCode(dto.code);
    await assertUniqueInstitutionCode(this.prisma, code);
    assertRegionRegimeConsistency(dto.region, dto.regime);
    assertValidHexColor(dto.primaryColor, 'primaryColor');
    assertValidHexColor(dto.secondaryColor, 'secondaryColor');

    try {
      const institution = await this.prisma.institution.create({
        data: {
          name: dto.name.trim(),
          code,
          email: dto.email?.trim() ?? null,
          phone: dto.phone?.trim() ?? null,
          address: dto.address?.trim() ?? null,
          region: dto.region ?? null,
          regime: dto.regime ?? null,
          logoUrl: dto.logoUrl ?? null,
          primaryColor: dto.primaryColor ?? null,
          secondaryColor: dto.secondaryColor ?? null,
          isActive: true,
        },
      });

      this.logger.log({
        context: INSTITUTIONS_CONTEXT,
        event: INSTITUTION_LOG_EVENTS.CREATED,
        message: 'Educational institution created',
        metadata: { institutionId: institution.id, code: institution.code },
      });

      return toInstitutionResponseDto(institution);
    } catch (error) {
      this.handlePrismaError(error, 'create');
      throw error;
    }
  }

  async update(
    id: string,
    dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    const existing = await this.findInstitutionOrThrow(id);

    if (dto.code !== undefined) {
      assertValidInstitutionCode(dto.code);
      await assertUniqueInstitutionCode(
        this.prisma,
        normalizeInstitutionCode(dto.code),
        id,
      );
    }

    const region = dto.region !== undefined ? dto.region : existing.region;
    const regime = dto.regime !== undefined ? dto.regime : existing.regime;
    assertRegionRegimeConsistency(region, regime);
    assertValidHexColor(dto.primaryColor, 'primaryColor');
    assertValidHexColor(dto.secondaryColor, 'secondaryColor');

    const institution = await this.prisma.institution.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined
          ? { code: normalizeInstitutionCode(dto.code) }
          : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim() ?? null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() ?? null } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() ?? null }
          : {}),
        ...(dto.region !== undefined ? { region: dto.region ?? null } : {}),
        ...(dto.regime !== undefined ? { regime: dto.regime ?? null } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl ?? null } : {}),
        ...(dto.primaryColor !== undefined
          ? { primaryColor: dto.primaryColor ?? null }
          : {}),
        ...(dto.secondaryColor !== undefined
          ? { secondaryColor: dto.secondaryColor ?? null }
          : {}),
      },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.UPDATED,
      message: 'Educational institution updated',
      metadata: { institutionId: institution.id },
    });

    return toInstitutionResponseDto(institution);
  }

  async updateSettings(
    id: string,
    dto: UpdateInstitutionSettingsDto,
    actor: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    await assertActorCanAccessInstitution(this.prisma, actor, id);
    const existing = await this.findInstitutionOrThrow(id);
    const region = dto.region !== undefined ? dto.region : existing.region;
    const regime = dto.regime !== undefined ? dto.regime : existing.regime;
    assertRegionRegimeConsistency(region, regime);

    const institution = await this.prisma.institution.update({
      where: { id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email?.trim() ?? null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() ?? null } : {}),
        ...(dto.address !== undefined
          ? { address: dto.address?.trim() ?? null }
          : {}),
        ...(dto.region !== undefined ? { region: dto.region ?? null } : {}),
        ...(dto.regime !== undefined ? { regime: dto.regime ?? null } : {}),
      },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.SETTINGS_UPDATED,
      message: 'Institution settings updated',
      metadata: { institutionId: institution.id },
    });

    return toInstitutionResponseDto(institution);
  }

  async uploadLogo(
    id: string,
    file: Express.Multer.File | undefined,
    actor: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    await assertActorCanAccessInstitution(this.prisma, actor, id);
    await this.findInstitutionOrThrow(id);
    assertValidLogoUpload(file);

    const uploadsRoot = this.configService.get('uploadsDir', { infer: true });
    const logoUrl = await processAndStoreInstitutionLogo({
      uploadsRoot,
      institutionId: id,
      file: file!,
      logger: this.logger,
    });

    const institution = await this.prisma.institution.update({
      where: { id },
      data: { logoUrl },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.LOGO_UPLOADED,
      message: 'Institution logo uploaded',
      metadata: { institutionId: id },
    });

    return toInstitutionResponseDto(institution);
  }

  async updateBranding(
    id: string,
    dto: UpdateInstitutionBrandingDto,
    actor: AuthenticatedUser,
  ): Promise<InstitutionResponseDto> {
    await assertActorCanAccessInstitution(this.prisma, actor, id);
    await this.findInstitutionOrThrow(id);
    assertValidHexColor(dto.primaryColor, 'primaryColor');
    assertValidHexColor(dto.secondaryColor, 'secondaryColor');

    const institution = await this.prisma.institution.update({
      where: { id },
      data: {
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl ?? null } : {}),
        ...(dto.primaryColor !== undefined
          ? { primaryColor: dto.primaryColor ?? null }
          : {}),
        ...(dto.secondaryColor !== undefined
          ? { secondaryColor: dto.secondaryColor ?? null }
          : {}),
      },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.BRANDING_UPDATED,
      message: 'Institution branding updated',
      metadata: { institutionId: institution.id },
    });

    return toInstitutionResponseDto(institution);
  }

  async activate(id: string): Promise<InstitutionResponseDto> {
    await this.findInstitutionOrThrow(id);

    const institution = await this.prisma.institution.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.ACTIVATED,
      message: 'Educational institution activated',
      metadata: { institutionId: institution.id },
    });

    return toInstitutionResponseDto(institution);
  }

  async deactivate(id: string): Promise<InstitutionResponseDto> {
    await this.findInstitutionOrThrow(id);

    const institution = await this.prisma.institution.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.DEACTIVATED,
      message: 'Educational institution deactivated',
      metadata: { institutionId: institution.id },
    });

    return toInstitutionResponseDto(institution);
  }

  async remove(id: string): Promise<void> {
    await this.findInstitutionOrThrow(id);

    const dependents = await this.countDependents(id);

    if (dependents > 0) {
      this.logger.warn({
        context: INSTITUTIONS_CONTEXT,
        event: INSTITUTION_LOG_EVENTS.OWNERSHIP_CONFLICT,
        message: 'Institution delete blocked by dependent records',
        metadata: { institutionId: id, dependents },
      });
      throw new ConflictException(
        'Cannot delete an institution with linked academic or profile records',
      );
    }

    await this.prisma.institution.delete({ where: { id } });

    this.logger.log({
      context: INSTITUTIONS_CONTEXT,
      event: INSTITUTION_LOG_EVENTS.DELETED,
      message: 'Educational institution deleted',
      metadata: { institutionId: id },
    });
  }

  private async applyActorInstitutionScope(
    filters: Prisma.InstitutionWhereInput,
    actor: AuthenticatedUser,
  ): Promise<Prisma.InstitutionWhereInput> {
    if (RoleUtils.isSuperAdmin(actor.role)) {
      return filters;
    }

    const institutionIds = await resolveActorInstitutionIds(this.prisma, actor);

    if (institutionIds.length === 0) {
      return { AND: [filters, { id: { in: [] } }] };
    }

    return {
      AND: [filters, { id: { in: institutionIds } }],
    };
  }

  private async countDependents(institutionId: string): Promise<number> {
    const [
      students,
      teachers,
      representatives,
      periods,
      levels,
      grades,
      courses,
      subjects,
      assignments,
    ] = await this.prisma.$transaction([
      this.prisma.studentProfile.count({ where: { institutionId } }),
      this.prisma.teacherProfile.count({ where: { institutionId } }),
      this.prisma.representativeProfile.count({ where: { institutionId } }),
      this.prisma.academicPeriod.count({ where: { institutionId } }),
      this.prisma.academicLevel.count({ where: { institutionId } }),
      this.prisma.gradeLevel.count({ where: { institutionId } }),
      this.prisma.course.count({ where: { institutionId } }),
      this.prisma.subject.count({ where: { institutionId } }),
      this.prisma.teacherAssignment.count({ where: { institutionId } }),
    ]);

    return (
      students +
      teachers +
      representatives +
      periods +
      levels +
      grades +
      courses +
      subjects +
      assignments
    );
  }

  private async findInstitutionOrThrow(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    return institution;
  }

  private handlePrismaError(error: unknown, operation: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      this.logger.warn({
        context: INSTITUTIONS_CONTEXT,
        event: INSTITUTION_LOG_EVENTS.VALIDATION_FAILED,
        message: `Institution ${operation} validation conflict`,
        metadata: { code: error.code },
      });
      throw new ConflictException('Institution code must be unique');
    }

    if (error instanceof BadRequestException) {
      this.logger.warn({
        context: INSTITUTIONS_CONTEXT,
        event: INSTITUTION_LOG_EVENTS.VALIDATION_FAILED,
        message: error.message,
      });
    }
  }
}
