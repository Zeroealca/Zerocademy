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
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiRequireRolesStrict,
} from '../../common/decorators/api';
import {
  STUDENT_ENROLLMENT_READ_ROLES,
  STUDENT_ENROLLMENT_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { BulkImportResultDto } from './dto/bulk-import-result.dto';
import { BulkImportStudentsDto } from './dto/bulk-import-students.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { ListStudentsQueryDto } from './dto/list-students-query.dto';
import { StudentListResponseDto } from './dto/student-list-response.dto';
import { StudentResponseDto } from './dto/student-response.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentBulkImportService } from './student-bulk-import.service';
import { StudentsService } from './students.service';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly bulkImportService: StudentBulkImportService,
  ) {}

  @Get()
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_READ_ROLES)
  @ApiOperation({ summary: 'List students (paginated, scoped by role)' })
  @ApiOkResponse({ type: StudentListResponseDto })
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListStudentsQueryDto,
  ): Promise<StudentListResponseDto> {
    return this.studentsService.findAll(actor, query);
  }

  @Get('me')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({ summary: 'Get current student profile' })
  @ApiOkResponse({ type: StudentResponseDto })
  findMe(@CurrentUser() actor: AuthenticatedUser): Promise<StudentResponseDto> {
    return this.studentsService.findMe(actor);
  }

  @Post('bulk-import')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Bulk import students from CSV and enroll in course' })
  @ApiCreatedResponse({ type: BulkImportResultDto })
  bulkImport(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: BulkImportStudentsDto,
  ): Promise<BulkImportResultDto> {
    return this.bulkImportService.importFromCsv(actor, dto);
  }

  @Post()
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Create student (user + profile)' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.create(actor, dto);
  }

  @Get(':id')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_READ_ROLES)
  @ApiOperation({ summary: 'Get student by id' })
  @ApiOkResponse({ type: StudentResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StudentResponseDto> {
    return this.studentsService.findOne(actor, id);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Update student profile' })
  @ApiOkResponse({ type: StudentResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(actor, id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate student account and profile' })
  @ApiOkResponse({ type: StudentResponseDto })
  activate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StudentResponseDto> {
    return this.studentsService.activate(actor, id);
  }

  @Post(':id/deactivate')
  @ApiRequireRolesStrict(...STUDENT_ENROLLMENT_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate student account and profile' })
  @ApiOkResponse({ type: StudentResponseDto })
  deactivate(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StudentResponseDto> {
    return this.studentsService.deactivate(actor, id);
  }
}
