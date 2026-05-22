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
  STUDENT_ENROLLMENT_READ_ROLES,
  STUDENT_ENROLLMENT_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BulkCreateEnrollmentsDto } from './dto/bulk-create-enrollments.dto';
import { BulkEnrollmentResultDto } from './dto/bulk-enrollment-result.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentListResponseDto } from './dto/enrollment-list-response.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { ListAvailableStudentsQueryDto } from './dto/list-available-students-query.dto';
import { ListEnrollmentsQueryDto } from './dto/list-enrollments-query.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';
import { StudentListResponseDto } from '../students/dto/student-list-response.dto';

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_READ_ROLES)
  @ApiOperation({ summary: 'List enrollments (paginated)' })
  @ApiOkResponse({ type: EnrollmentListResponseDto })
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListEnrollmentsQueryDto,
  ): Promise<EnrollmentListResponseDto> {
    return this.enrollmentsService.findAll(actor, query);
  }

  @Get('student/:studentId/history')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_READ_ROLES)
  @ApiOperation({ summary: 'Academic enrollment history for a student' })
  @ApiOkResponse({ type: EnrollmentListResponseDto })
  findStudentHistory(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: ListEnrollmentsQueryDto,
  ): Promise<EnrollmentListResponseDto> {
    return this.enrollmentsService.findStudentHistory(actor, studentId, query);
  }

  @Get('available-students')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({
    summary:
      'List active students not yet enrolled in the selected course and period',
  })
  @ApiOkResponse({ type: StudentListResponseDto })
  findAvailableStudents(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListAvailableStudentsQueryDto,
  ): Promise<StudentListResponseDto> {
    return this.enrollmentsService.findAvailableStudents(actor, query);
  }

  @Post('bulk')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Enroll multiple students in a course for a period' })
  @ApiCreatedResponse({ type: BulkEnrollmentResultDto })
  bulkCreate(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: BulkCreateEnrollmentsDto,
  ): Promise<BulkEnrollmentResultDto> {
    return this.enrollmentsService.bulkCreate(actor, dto);
  }

  @Get(':id')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_READ_ROLES)
  @ApiOperation({ summary: 'Get enrollment by id' })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.findOne(actor, id);
  }

  @Post()
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Enroll a student in a course for a period' })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.create(actor, dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({
    summary: 'Update enrollment status or date (does not change student/course/period)',
  })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEnrollmentDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.update(actor, id, dto);
  }
}
