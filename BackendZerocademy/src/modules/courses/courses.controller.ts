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
import { ApiRequireRoles } from '../../common/decorators/api';
import { CoursesService } from './courses.service';
import { CourseListResponseDto } from './dto/course-list-response.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

const READ_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER] as const;
const WRITE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'List classroom courses (paginated)' })
  @ApiOkResponse({ type: CourseListResponseDto })
  findAll(@Query() query: ListCoursesQueryDto): Promise<CourseListResponseDto> {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'Get classroom course by id' })
  @ApiOkResponse({ type: CourseResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create classroom course' })
  @ApiCreatedResponse({ type: CourseResponseDto })
  create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Activate classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  activate(@Param('id', ParseUUIDPipe) id: string): Promise<CourseResponseDto> {
    return this.coursesService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate classroom course' })
  @ApiOkResponse({ type: CourseResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CourseResponseDto> {
    return this.coursesService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete classroom course (inactive only)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}
