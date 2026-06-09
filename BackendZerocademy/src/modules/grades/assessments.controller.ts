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
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import {
  ASSESSMENTS_READ_ROLES,
  ASSESSMENTS_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AssessmentsService } from './assessments.service';
import { AssessmentListResponseDto } from './dto/assessment-list-response.dto';
import { AssessmentResponseDto } from './dto/assessment-response.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { ListAssessmentsQueryDto } from './dto/list-assessments-query.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  @ApiRequireRolesStrict(...ASSESSMENTS_READ_ROLES)
  @ApiOperation({ summary: 'List assessments (paginated)' })
  @ApiOkResponse({ type: AssessmentListResponseDto })
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListAssessmentsQueryDto,
  ): Promise<AssessmentListResponseDto> {
    return this.assessmentsService.findAll(actor, query);
  }

  @Get(':id')
  @ApiRequireRolesStrict(...ASSESSMENTS_READ_ROLES)
  @ApiOperation({ summary: 'Get assessment details' })
  @ApiOkResponse({ type: AssessmentResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.findOne(actor, id);
  }

  @Post()
  @ApiRequireRolesStrict(...ASSESSMENTS_WRITE_ROLES)
  @ApiOperation({ summary: 'Create assessment' })
  @ApiCreatedResponse({ type: AssessmentResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.create(actor, dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...ASSESSMENTS_WRITE_ROLES)
  @ApiOperation({ summary: 'Update assessment' })
  @ApiOkResponse({ type: AssessmentResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.update(actor, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...ASSESSMENTS_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete assessment (only when no grades exist)' })
  @ApiNoContentResponse()
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.assessmentsService.remove(actor, id);
  }
}
