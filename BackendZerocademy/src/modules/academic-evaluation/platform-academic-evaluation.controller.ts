import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiRequireRoles } from '../../common/decorators/api';
import {
  ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  ACADEMIC_EVALUATION_READ_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { AssessmentCategoryTemplateResponseDto } from './dto/assessment-category-template-response.dto';
import { CreateAssessmentCategoryTemplateDto } from './dto/create-assessment-category-template.dto';
import { CreateEvaluationTermTemplateDto } from './dto/create-evaluation-term-template.dto';
import { EvaluationTermTemplateResponseDto } from './dto/evaluation-term-template-response.dto';
import { PlatformAcademicEvaluationResponseDto } from './dto/platform-academic-evaluation-response.dto';
import { UpdateAssessmentCategoryTemplateDto } from './dto/update-assessment-category-template.dto';
import { UpdateEvaluationTermTemplateDto } from './dto/update-evaluation-term-template.dto';
import { UpsertPlatformAcademicEvaluationDto } from './dto/upsert-platform-academic-evaluation.dto';
import { PlatformAcademicEvaluationService } from './platform-academic-evaluation.service';

@ApiTags('platform-academic-evaluation')
@Controller('academic-evaluation/platform')
export class PlatformAcademicEvaluationController {
  constructor(
    private readonly platformService: PlatformAcademicEvaluationService,
  ) {}

  @Get()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({
    summary: 'Get platform-wide evaluation defaults (all institutions)',
  })
  @ApiOkResponse({ type: PlatformAcademicEvaluationResponseDto })
  getPlatformDefaults(): Promise<PlatformAcademicEvaluationResponseDto | null> {
    return this.platformService.getPlatformDefaults();
  }

  @Post('initialize-ecuador-defaults')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({
    summary: 'Initialize or refresh Ecuador platform defaults (SUPER_ADMIN)',
  })
  @ApiCreatedResponse({ type: PlatformAcademicEvaluationResponseDto })
  initializeEcuadorDefaults(): Promise<PlatformAcademicEvaluationResponseDto> {
    return this.platformService.initializeEcuadorPlatformDefaults();
  }

  @Put()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update platform evaluation settings (SUPER_ADMIN)' })
  @ApiOkResponse({ type: PlatformAcademicEvaluationResponseDto })
  upsertPlatformConfig(
    @Body() dto: UpsertPlatformAcademicEvaluationDto,
  ): Promise<PlatformAcademicEvaluationResponseDto> {
    return this.platformService.upsertPlatformConfig(dto);
  }

  @Post('assessment-category-templates')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create platform assessment category template' })
  @ApiCreatedResponse({ type: AssessmentCategoryTemplateResponseDto })
  createCategoryTemplate(
    @Body() dto: CreateAssessmentCategoryTemplateDto,
  ): Promise<AssessmentCategoryTemplateResponseDto> {
    return this.platformService.createCategoryTemplate(dto);
  }

  @Patch('assessment-category-templates/:id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update platform assessment category template' })
  @ApiOkResponse({ type: AssessmentCategoryTemplateResponseDto })
  updateCategoryTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentCategoryTemplateDto,
  ): Promise<AssessmentCategoryTemplateResponseDto> {
    return this.platformService.updateCategoryTemplate(id, dto);
  }

  @Delete('assessment-category-templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete platform assessment category template' })
  @ApiNoContentResponse()
  deleteCategoryTemplate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.platformService.deleteCategoryTemplate(id);
  }

  @Post('evaluation-term-templates')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create platform evaluation term template' })
  @ApiCreatedResponse({ type: EvaluationTermTemplateResponseDto })
  createTermTemplate(
    @Body() dto: CreateEvaluationTermTemplateDto,
  ): Promise<EvaluationTermTemplateResponseDto> {
    return this.platformService.createTermTemplate(dto);
  }

  @Patch('evaluation-term-templates/:id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update platform evaluation term template' })
  @ApiOkResponse({ type: EvaluationTermTemplateResponseDto })
  updateTermTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationTermTemplateDto,
  ): Promise<EvaluationTermTemplateResponseDto> {
    return this.platformService.updateTermTemplate(id, dto);
  }

  @Delete('evaluation-term-templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete platform evaluation term template' })
  @ApiNoContentResponse()
  deleteTermTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.platformService.deleteTermTemplate(id);
  }
}
