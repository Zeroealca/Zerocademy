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
  ApiRequireRoles,
  ApiRequireRolesStrict,
} from '../../common/decorators/api';
import {
  INSTITUTION_OPS_READ_ROLES,
  INSTITUTION_OPS_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { AssignmentHierarchyQueryDto } from './dto/assignment-hierarchy-query.dto';
import { AssignmentHierarchyResponseDto } from './dto/assignment-hierarchy-response.dto';
import { CreateTeacherAssignmentDto } from './dto/create-teacher-assignment.dto';
import { ListTeacherAssignmentsQueryDto } from './dto/list-teacher-assignments-query.dto';
import { TeacherAssignmentListResponseDto } from './dto/teacher-assignment-list-response.dto';
import { TeacherAssignmentResponseDto } from './dto/teacher-assignment-response.dto';
import { UpdateTeacherAssignmentDto } from './dto/update-teacher-assignment.dto';
import { TeacherAssignmentsService } from './teacher-assignments.service';

@ApiTags('teacher-assignments')
@Controller('teacher-assignments')
export class TeacherAssignmentsController {
  constructor(
    private readonly teacherAssignmentsService: TeacherAssignmentsService,
  ) {}

  @Get()
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'List teacher assignments (paginated)' })
  @ApiOkResponse({ type: TeacherAssignmentListResponseDto })
  findAll(
    @Query() query: ListTeacherAssignmentsQueryDto,
  ): Promise<TeacherAssignmentListResponseDto> {
    return this.teacherAssignmentsService.findAll(query);
  }

  @Get('hierarchy/by-period')
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({
    summary: 'Get assignments for an academic period',
    description:
      'Returns staffing assignments for scheduling and academic hierarchy views.',
  })
  @ApiOkResponse({ type: AssignmentHierarchyResponseDto })
  getHierarchy(
    @Query() query: AssignmentHierarchyQueryDto,
  ): Promise<AssignmentHierarchyResponseDto> {
    return this.teacherAssignmentsService.getHierarchy(query);
  }

  @Get(':id')
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'Get teacher assignment by id' })
  @ApiOkResponse({ type: TeacherAssignmentResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TeacherAssignmentResponseDto> {
    return this.teacherAssignmentsService.findOne(id);
  }

  @Post()
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Create teacher assignment' })
  @ApiCreatedResponse({ type: TeacherAssignmentResponseDto })
  create(
    @Body() dto: CreateTeacherAssignmentDto,
  ): Promise<TeacherAssignmentResponseDto> {
    return this.teacherAssignmentsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Update teacher assignment' })
  @ApiOkResponse({ type: TeacherAssignmentResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherAssignmentDto,
  ): Promise<TeacherAssignmentResponseDto> {
    return this.teacherAssignmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Remove teacher assignment' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teacherAssignmentsService.remove(id);
  }
}
