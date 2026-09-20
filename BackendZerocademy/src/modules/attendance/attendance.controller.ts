import { Body, Controller, Get, Post, Query } from '@nestjs/common';
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
import { AttendanceService } from './attendance.service';
import { AttendanceReportsService } from './attendance-reports.service';
import { AttendanceCourseQueryDto } from './dto/attendance-course-query.dto';
import {
  AttendanceCourseDto,
  BulkAttendanceResultDto,
  DailyAttendanceResponseDto,
} from './dto/attendance-response.dto';
import { BulkUpsertAttendanceDto } from './dto/bulk-upsert-attendance.dto';
import { DailyAttendanceQueryDto } from './dto/daily-attendance-query.dto';
import {
  AttendanceReportQueryDto,
  MyAttendanceHistoryQueryDto,
} from './dto/attendance-report-query.dto';
import {
  CourseAttendanceReportDto,
  MyAttendanceHistoryResponseDto,
} from './dto/attendance-report-response.dto';

@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly attendanceReportsService: AttendanceReportsService,
  ) {}

  @Get('me/history')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({
    summary: 'Get the authenticated student attendance history and summary',
  })
  @ApiOkResponse({ type: MyAttendanceHistoryResponseDto })
  getMyHistory(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: MyAttendanceHistoryQueryDto,
  ): Promise<MyAttendanceHistoryResponseDto> {
    return this.attendanceReportsService.getMyHistory(actor, query);
  }

  @Get('course-summary')
  @ApiRequireRolesStrict(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get course attendance summary for a date range' })
  @ApiOkResponse({ type: CourseAttendanceReportDto })
  getCourseSummary(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AttendanceReportQueryDto,
  ): Promise<CourseAttendanceReportDto> {
    return this.attendanceReportsService.getCourseReport(actor, query);
  }

  @Get('courses')
  @ApiRequireRolesStrict(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List courses available for daily attendance' })
  @ApiOkResponse({ type: [AttendanceCourseDto] })
  getCourses(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AttendanceCourseQueryDto,
  ): Promise<AttendanceCourseDto[]> {
    return this.attendanceService.getCourses(actor, query.academicPeriodId);
  }

  @Get('daily')
  @ApiRequireRolesStrict(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Get a course roster and recorded daily attendance',
  })
  @ApiOkResponse({ type: DailyAttendanceResponseDto })
  getDaily(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: DailyAttendanceQueryDto,
  ): Promise<DailyAttendanceResponseDto> {
    return this.attendanceService.getDaily(actor, query);
  }

  @Post('bulk')
  @ApiRequireRolesStrict(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Create or update daily attendance in one transaction',
  })
  @ApiCreatedResponse({ type: BulkAttendanceResultDto })
  bulkUpsert(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: BulkUpsertAttendanceDto,
  ): Promise<BulkAttendanceResultDto> {
    return this.attendanceService.bulkUpsert(actor, dto);
  }
}
