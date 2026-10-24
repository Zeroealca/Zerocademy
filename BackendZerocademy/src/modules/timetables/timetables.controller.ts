import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
import { TimetableAdminService } from './timetable-admin.service';
import {
  CreateTimetableDto,
  GenerateTimetableDto,
  ReplaceTimetableSlotsDto,
  TransitionTimetableDto,
  TimetableGenerationResponseDto,
  TimetableListResponseDto,
  TimetableResponseDto,
  TimetableValidationResponseDto,
} from './dto/timetable-admin.dto';
import { ScheduleStructuresService } from './schedule-structures.service';
import { UpdateScheduleStructureDto } from './dto/update-schedule-structure.dto';
import {
  CreateScheduleBlockDto,
  UpdateScheduleBlockDto,
} from './dto/schedule-block.dto';
import { ReorderScheduleBlocksDto } from './dto/reorder-schedule-blocks.dto';
import {
  ScheduleBlockResponseDto,
  ScheduleStructureDetailResponseDto,
  ScheduleStructureResponseDto,
  ScheduleStructureValidationResponseDto,
} from './dto/schedule-structure-response.dto';

@ApiTags('timetables')
@ApiStandardErrorResponses()
@Controller()
export class TimetablesController {
  constructor(
    private readonly timetables: TimetablesService,
    private readonly scheduleStructures: ScheduleStructuresService,
    private readonly timetableAdmin: TimetableAdminService,
  ) {}

  @Get(
    'institutions/:institutionId/academic-periods/:academicPeriodId/timetables',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'List institution academic-period timetables' })
  @ApiOkResponse({ type: TimetableListResponseDto })
  listTimetables(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ): Promise<TimetableListResponseDto> {
    return this.timetableAdmin.list(actor, institutionId, academicPeriodId);
  }

  @Post(
    'institutions/:institutionId/academic-periods/:academicPeriodId/timetables/generate',
  )
  @HttpCode(HttpStatus.OK)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Generate a non-persistent deterministic timetable proposal',
  })
  @ApiOkResponse({ type: TimetableGenerationResponseDto })
  generateTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: GenerateTimetableDto,
  ) {
    return this.timetableAdmin.generate(
      actor,
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Post(
    'institutions/:institutionId/academic-periods/:academicPeriodId/timetables',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Create a validated draft timetable atomically' })
  @ApiCreatedResponse({ type: TimetableResponseDto })
  createTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: CreateTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.timetableAdmin.create(
      actor,
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Get('timetables/:timetableId')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Retrieve a timetable with ordered slots' })
  @ApiOkResponse({ type: TimetableResponseDto })
  getTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
  ): Promise<TimetableResponseDto> {
    return this.timetableAdmin.findOne(actor, timetableId);
  }

  @Get('timetables/:timetableId/validation')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Validate persisted timetable slots in COMPLETE mode',
  })
  @ApiOkResponse({ type: TimetableValidationResponseDto })
  validateTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
  ): Promise<TimetableValidationResponseDto> {
    return this.timetableAdmin.validation(actor, timetableId);
  }

  @Put('timetables/:timetableId/slots')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Atomically replace draft slots using optimistic version control',
  })
  @ApiOkResponse({ type: TimetableResponseDto })
  replaceTimetableSlots(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
    @Body() dto: ReplaceTimetableSlotsDto,
  ): Promise<TimetableResponseDto> {
    return this.timetableAdmin.replaceSlots(actor, timetableId, dto);
  }

  @Post('timetables/:timetableId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary:
      'Validate and publish a draft timetable using optimistic version control',
  })
  @ApiOkResponse({ type: TimetableResponseDto })
  publishTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
    @Body() dto: TransitionTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.timetableAdmin.publish(actor, timetableId, dto);
  }

  @Post('timetables/:timetableId/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary:
      'Return a published timetable to its editable draft state using optimistic version control',
  })
  @ApiOkResponse({ type: TimetableResponseDto })
  unpublishTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
    @Body() dto: TransitionTimetableDto,
  ): Promise<TimetableResponseDto> {
    return this.timetableAdmin.unpublish(actor, timetableId, dto);
  }

  @Delete('timetables/:timetableId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Discard a draft timetable' })
  @ApiNoContentResponse()
  discardTimetable(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('timetableId', ParseUUIDPipe) timetableId: string,
  ): Promise<void> {
    return this.timetableAdmin.discard(actor, timetableId);
  }

  @Get(
    'institutions/:institutionId/academic-periods/:academicPeriodId/schedule-structure',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary:
      'Get an institution academic-period schedule structure and capacity',
  })
  @ApiOkResponse({ type: ScheduleStructureDetailResponseDto })
  getScheduleStructure(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ): Promise<ScheduleStructureDetailResponseDto> {
    return this.scheduleStructures.findOne(
      actor,
      institutionId,
      academicPeriodId,
    );
  }

  @Put(
    'institutions/:institutionId/academic-periods/:academicPeriodId/schedule-structure',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Create or update enabled weekdays for a schedule structure',
  })
  @ApiOkResponse({ type: ScheduleStructureResponseDto })
  upsertScheduleStructure(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: UpdateScheduleStructureDto,
  ): Promise<ScheduleStructureResponseDto> {
    return this.scheduleStructures.upsert(
      actor,
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Post(
    'institutions/:institutionId/academic-periods/:academicPeriodId/schedule-structure/blocks',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Create an ordered schedule block' })
  @ApiCreatedResponse({ type: ScheduleBlockResponseDto })
  createScheduleBlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: CreateScheduleBlockDto,
  ): Promise<ScheduleBlockResponseDto> {
    return this.scheduleStructures.createBlock(
      actor,
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Patch('schedule-blocks/:scheduleBlockId')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Update a schedule block' })
  @ApiOkResponse({ type: ScheduleBlockResponseDto })
  updateScheduleBlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('scheduleBlockId', ParseUUIDPipe) scheduleBlockId: string,
    @Body() dto: UpdateScheduleBlockDto,
  ): Promise<ScheduleBlockResponseDto> {
    return this.scheduleStructures.updateBlock(actor, scheduleBlockId, dto);
  }

  @Delete('schedule-blocks/:scheduleBlockId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an unreferenced schedule block' })
  @ApiNoContentResponse()
  deleteScheduleBlock(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('scheduleBlockId', ParseUUIDPipe) scheduleBlockId: string,
  ): Promise<void> {
    return this.scheduleStructures.removeBlock(actor, scheduleBlockId);
  }

  @Put(
    'institutions/:institutionId/academic-periods/:academicPeriodId/schedule-structure/blocks/order',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Atomically reorder every schedule block in a structure',
  })
  @ApiOkResponse({ type: ScheduleStructureResponseDto })
  reorderScheduleBlocks(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: ReorderScheduleBlocksDto,
  ): Promise<ScheduleStructureResponseDto> {
    return this.scheduleStructures.reorderBlocks(
      actor,
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Get(
    'institutions/:institutionId/academic-periods/:academicPeriodId/schedule-structure/validation',
  )
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Validate schedule structure readiness' })
  @ApiOkResponse({ type: ScheduleStructureValidationResponseDto })
  validateScheduleStructure(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
  ): Promise<ScheduleStructureValidationResponseDto> {
    return this.scheduleStructures.validate(
      actor,
      institutionId,
      academicPeriodId,
    );
  }

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
