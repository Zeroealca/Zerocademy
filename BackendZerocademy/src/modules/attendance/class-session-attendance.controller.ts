import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ClassSessionAttendanceService } from './class-session-attendance.service';
import {
  ClassSessionAttendanceRosterDto,
  ReplaceClassSessionAttendanceDto,
} from './dto/class-session-attendance.dto';

@ApiTags('attendance')
@Controller(
  'teacher-assignments/:teacherAssignmentId/class-sessions/:classSessionId/attendance',
)
export class ClassSessionAttendanceController {
  constructor(private readonly attendance: ClassSessionAttendanceService) {}

  @Get()
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({ summary: 'Get attendance roster for an owned class session' })
  @ApiOkResponse({ type: ClassSessionAttendanceRosterDto })
  getRoster(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) teacherAssignmentId: string,
    @Param('classSessionId', ParseUUIDPipe) classSessionId: string,
  ): Promise<ClassSessionAttendanceRosterDto> {
    return this.attendance.getRoster(
      actor,
      teacherAssignmentId,
      classSessionId,
    );
  }

  @Put()
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({
    summary: 'Replace attendance for a completed owned class session',
  })
  @ApiOkResponse({ description: 'Attendance replaced successfully' })
  replace(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) teacherAssignmentId: string,
    @Param('classSessionId', ParseUUIDPipe) classSessionId: string,
    @Body() dto: ReplaceClassSessionAttendanceDto,
  ): Promise<void> {
    return this.attendance.replace(
      actor,
      teacherAssignmentId,
      classSessionId,
      dto,
    );
  }
}
