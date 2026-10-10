import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRolesStrict,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ConfigureTeachingLoadDto } from './dto/configure-teaching-load.dto';
import { ListTeachingLoadsQueryDto } from './dto/list-teaching-loads-query.dto';
import {
  TeachingLoadListResponseDto,
  TeachingLoadResponseDto,
  TeachingLoadValidationResponseDto,
} from './dto/teaching-load-response.dto';
import { TimetablesService } from './timetables.service';

@ApiTags('timetables')
@ApiStandardErrorResponses()
@Controller()
export class TimetablesController {
  constructor(private readonly timetables: TimetablesService) {}

  @Get(
    'teaching-loads/institutions/:institutionId/academic-periods/:academicPeriodId',
  )
  @ApiRequireRolesStrict(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary:
      'List configured and unconfigured teaching loads for an institution period',
  })
  @ApiOkResponse({ type: TeachingLoadListResponseDto })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Query() query: ListTeachingLoadsQueryDto,
  ): Promise<TeachingLoadListResponseDto> {
    return this.timetables.listTeachingLoads(
      actor,
      institutionId,
      academicPeriodId,
      query,
    );
  }

  @Get(
    'teaching-loads/institutions/:institutionId/academic-periods/:academicPeriodId/validation',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Assess teaching-load configuration and staffing readiness',
  })
  @ApiOkResponse({ type: TeachingLoadValidationResponseDto })
  validate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ): Promise<TeachingLoadValidationResponseDto> {
    return this.timetables.validateConfiguration(
      actor,
      institutionId,
      academicPeriodId,
    );
  }

  @Get('teacher-assignments/:teacherAssignmentId/teaching-load')
  @ApiRequireRolesStrict(Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Get one TeacherAssignment operational teaching load',
  })
  @ApiOkResponse({ type: TeachingLoadResponseDto })
  getOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) teacherAssignmentId: string,
  ): Promise<TeachingLoadResponseDto> {
    return this.timetables.getTeachingLoad(actor, teacherAssignmentId);
  }

  @Put('teacher-assignments/:teacherAssignmentId/teaching-load')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary:
      'Create or update final operational weekly periods for a TeacherAssignment',
  })
  @ApiOkResponse({ type: TeachingLoadResponseDto })
  configure(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) teacherAssignmentId: string,
    @Body() dto: ConfigureTeachingLoadDto,
  ): Promise<TeachingLoadResponseDto> {
    return this.timetables.configureTeachingLoad(
      actor,
      teacherAssignmentId,
      dto,
    );
  }
}
