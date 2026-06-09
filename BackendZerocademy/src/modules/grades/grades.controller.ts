import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import {
  GRADES_ENTRY_READ_ROLES,
  GRADES_READ_ROLES,
  GRADES_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BulkGradeResultDto } from './dto/bulk-grade-result.dto';
import { BulkUpsertGradesDto } from './dto/bulk-upsert-grades.dto';
import { CreateGradeDto } from './dto/create-grade.dto';
import { GradeEntrySheetResponseDto } from './dto/grade-entry-sheet-response.dto';
import { GradeListResponseDto } from './dto/grade-list-response.dto';
import { GradeResponseDto } from './dto/grade-response.dto';
import { ListGradesQueryDto } from './dto/list-grades-query.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradesService } from './grades.service';

@ApiTags('grades')
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get()
  @ApiRequireRolesStrict(...GRADES_READ_ROLES)
  @ApiOperation({
    summary: 'List grades (paginated)',
    description:
      'Teachers see assigned subjects; students see own grades; admins monitor institution data.',
  })
  @ApiOkResponse({ type: GradeListResponseDto })
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListGradesQueryDto,
  ): Promise<GradeListResponseDto> {
    return this.gradesService.findAll(actor, query);
  }

  @Get('entry-sheet/:assessmentId')
  @ApiRequireRolesStrict(...GRADES_ENTRY_READ_ROLES)
  @ApiOperation({
    summary: 'Grade entry sheet for an assessment',
    description:
      'Returns enrolled students and existing grades for bulk entry.',
  })
  @ApiOkResponse({ type: GradeEntrySheetResponseDto })
  getEntrySheet(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('assessmentId', ParseUUIDPipe) assessmentId: string,
  ): Promise<GradeEntrySheetResponseDto> {
    return this.gradesService.getEntrySheet(actor, assessmentId);
  }

  @Get(':id')
  @ApiRequireRolesStrict(...GRADES_READ_ROLES)
  @ApiOperation({ summary: 'Get grade by id' })
  @ApiOkResponse({ type: GradeResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradeResponseDto> {
    return this.gradesService.findOne(actor, id);
  }

  @Post()
  @ApiRequireRolesStrict(...GRADES_WRITE_ROLES)
  @ApiOperation({ summary: 'Create a grade' })
  @ApiCreatedResponse({ type: GradeResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.create(actor, dto);
  }

  @Post('bulk')
  @ApiRequireRolesStrict(...GRADES_WRITE_ROLES)
  @ApiOperation({ summary: 'Bulk create or update grades for an assessment' })
  @ApiCreatedResponse({ type: BulkGradeResultDto })
  bulkUpsert(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: BulkUpsertGradesDto,
  ): Promise<BulkGradeResultDto> {
    return this.gradesService.bulkUpsert(actor, dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...GRADES_WRITE_ROLES)
  @ApiOperation({ summary: 'Update a grade' })
  @ApiOkResponse({ type: GradeResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(actor, id, dto);
  }
}
