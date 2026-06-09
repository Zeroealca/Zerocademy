import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiRequireRoles, ApiRequireRolesStrict } from '../../common/decorators/api';
import {
  ACADEMIC_EVALUATION_READ_ROLES,
  ACADEMIC_EVALUATION_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { EcuadorDefaultsService } from './ecuador-defaults.service';
import { EvaluationConfigPreviewDto } from './dto/evaluation-config-preview.dto';
import { InstitutionAcademicConfigurationResponseDto } from './dto/institution-academic-configuration-response.dto';
import { UpsertInstitutionAcademicConfigurationDto } from './dto/upsert-institution-academic-configuration.dto';
import { InstitutionAcademicConfigurationService } from './institution-academic-configuration.service';

@ApiTags('institution-academic-configuration')
@Controller('institutions/:institutionId/academic-evaluation')
export class InstitutionAcademicConfigurationController {
  constructor(
    private readonly configurationService: InstitutionAcademicConfigurationService,
    private readonly ecuadorDefaultsService: EcuadorDefaultsService,
  ) {}

  @Get('configuration')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'Get institution academic evaluation configuration' })
  @ApiOkResponse({ type: InstitutionAcademicConfigurationResponseDto })
  getConfiguration(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
  ): Promise<InstitutionAcademicConfigurationResponseDto | null> {
    return this.configurationService.findByInstitution(institutionId);
  }

  @Put('configuration')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Create or update institution evaluation configuration' })
  @ApiOkResponse({ type: InstitutionAcademicConfigurationResponseDto })
  upsertConfiguration(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() dto: UpsertInstitutionAcademicConfigurationDto,
  ): Promise<InstitutionAcademicConfigurationResponseDto> {
    return this.configurationService.upsert(institutionId, dto);
  }

  @Get('preview')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'Preview evaluation configuration dashboard' })
  @ApiOkResponse({ type: EvaluationConfigPreviewDto })
  getPreview(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query('academicPeriodId') academicPeriodId?: string,
  ): Promise<EvaluationConfigPreviewDto> {
    return this.configurationService.getPreview(
      institutionId,
      academicPeriodId,
    );
  }

  @Post('apply-platform-defaults')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({
    summary:
      'Apply platform evaluation defaults to institution (copy scheme, categories, terms)',
  })
  @ApiCreatedResponse({ type: InstitutionAcademicConfigurationResponseDto })
  applyPlatformDefaults(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
  ): Promise<InstitutionAcademicConfigurationResponseDto> {
    return this.ecuadorDefaultsService.initializeForInstitution(institutionId);
  }

  /** @deprecated Use apply-platform-defaults */
  @Post('initialize-ecuador')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({
    summary: 'Apply platform defaults to institution (alias)',
  })
  @ApiCreatedResponse({ type: InstitutionAcademicConfigurationResponseDto })
  initializeEcuadorForInstitution(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
  ): Promise<InstitutionAcademicConfigurationResponseDto> {
    return this.ecuadorDefaultsService.initializeForInstitution(institutionId);
  }
}
