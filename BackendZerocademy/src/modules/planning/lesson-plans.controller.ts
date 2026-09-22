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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRoles,
  ApiRequireRolesStrict,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  CreateLessonPlanDto,
  ReorderLessonPlansDto,
  UpdateLessonPlanDto,
} from './dto/lesson-plan.dto';
import { LessonPlanResponseDto } from './dto/lesson-plan-response.dto';
import { LessonPlansService } from './lesson-plans.service';

@ApiTags('lesson-plans')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@Controller('academic-plans/:planId/units/:unitId/lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessons: LessonPlansService) {}

  @Get()
  @ApiOperation({ summary: 'List lesson plans for an academic unit' })
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: LessonPlanResponseDto, isArray: true })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
  ) {
    return this.lessons.list(actor, planId, unitId);
  }

  @Get(':lessonPlanId')
  @ApiOperation({ summary: 'Read a lesson plan within an academic unit' })
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: LessonPlanResponseDto })
  one(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('lessonPlanId', ParseUUIDPipe) lessonPlanId: string,
  ) {
    return this.lessons.one(actor, planId, unitId, lessonPlanId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a lesson plan in a mutable academic unit' })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiCreatedResponse({ type: LessonPlanResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: CreateLessonPlanDto,
  ) {
    return this.lessons.create(actor, planId, unitId, dto);
  }

  @Patch('reorder')
  @ApiOperation({
    summary: 'Reorder all lesson plans of a draft academic unit',
  })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOkResponse({
    description:
      'Lesson plans reordered successfully; the operation returns no body.',
  })
  reorder(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: ReorderLessonPlansDto,
  ) {
    return this.lessons.reorder(actor, planId, unitId, dto.lessonPlanIds);
  }

  @Patch(':lessonPlanId')
  @ApiOperation({ summary: 'Update a lesson plan in a mutable academic unit' })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOkResponse({ type: LessonPlanResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('lessonPlanId', ParseUUIDPipe) lessonPlanId: string,
    @Body() dto: UpdateLessonPlanDto,
  ) {
    return this.lessons.update(actor, planId, unitId, lessonPlanId, dto);
  }

  @Delete(':lessonPlanId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a lesson plan from a mutable academic unit',
  })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiNoContentResponse()
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Param('lessonPlanId', ParseUUIDPipe) lessonPlanId: string,
  ) {
    return this.lessons.remove(actor, planId, unitId, lessonPlanId);
  }
}
