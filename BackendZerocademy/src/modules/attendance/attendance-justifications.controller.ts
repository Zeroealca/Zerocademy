import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AttendanceJustificationsService } from './attendance-justifications.service';
import {
  CreateAttendanceJustificationDto,
  ReviewAttendanceJustificationDto,
} from './dto/attendance-justification.dto';
import { AttendanceJustificationQueryDto } from './dto/attendance-justification-query.dto';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceJustificationsController {
  constructor(
    private readonly justificationsService: AttendanceJustificationsService,
  ) {}

  @Post(':attendanceRecordId/justifications')
  @ApiRequireRolesStrict(Role.STUDENT, Role.REPRESENTATIVE)
  @ApiOperation({
    summary:
      'Submit a justification for an absent attendance record owned by the student or an associated representative student',
  })
  @ApiCreatedResponse({ description: 'Justification submitted' })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('attendanceRecordId') attendanceRecordId: string,
    @Body() dto: CreateAttendanceJustificationDto,
  ) {
    return this.justificationsService.create(actor, attendanceRecordId, dto);
  }

  @Get('justifications')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary:
      'List justifications pending review for the administrator institution',
  })
  @ApiOkResponse({ description: 'Justifications visible to the administrator' })
  list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AttendanceJustificationQueryDto,
  ) {
    return this.justificationsService.listForReview(actor, query.status);
  }

  @Post('justifications/:justificationId/review')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({
    summary: 'Approve or reject a pending attendance justification',
  })
  @ApiOkResponse({ description: 'Justification reviewed' })
  review(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('justificationId') justificationId: string,
    @Body() dto: ReviewAttendanceJustificationDto,
  ) {
    return this.justificationsService.review(actor, justificationId, dto);
  }
}
