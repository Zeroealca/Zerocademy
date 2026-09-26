import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRoles,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicPlanLessonPlanResponseDto } from './dto/academic-plan-lesson-plan-response.dto';
import { LessonPlansService } from './lesson-plans.service';

@ApiTags('lesson-plans')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@Controller('academic-plans/:planId/lesson-plans')
export class AcademicPlanLessonPlansController {
  constructor(private readonly lessons: LessonPlansService) {}

  @Get()
  @ApiOperation({
    summary: 'List lesson plans for an academic plan across its units',
  })
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: AcademicPlanLessonPlanResponseDto, isArray: true })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<AcademicPlanLessonPlanResponseDto[]> {
    return this.lessons
      .listForAcademicPlan(actor, planId)
      .then((lessons) =>
        lessons.map((lesson) => AcademicPlanLessonPlanResponseDto.from(lesson)),
      );
  }
}
