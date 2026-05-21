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
import { CoursesService } from './courses.service';
import { CourseListResponseDto } from './dto/course-list-response.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'List classroom courses (paginated)' })
  @ApiOkResponse({ type: CourseListResponseDto })
  findAll(@Query() query: ListCoursesQueryDto): Promise<CourseListResponseDto> {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'Get classroom course by id' })
  @ApiOkResponse({ type: CourseResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Create classroom course' })
  @ApiCreatedResponse({ type: CourseResponseDto })
  create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Update classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<CourseResponseDto> {
    return this.coursesService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CourseResponseDto> {
    return this.coursesService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete classroom course (inactive only)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}
