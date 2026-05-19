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
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { SubjectHierarchyQueryDto } from './dto/subject-hierarchy-query.dto';
import { SubjectHierarchyResponseDto } from './dto/subject-hierarchy-response.dto';
import { SubjectListResponseDto } from './dto/subject-list-response.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

const READ_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER] as const;
const WRITE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'List subjects (paginated)' })
  @ApiOkResponse({ type: SubjectListResponseDto })
  findAll(
    @Query() query: ListSubjectsQueryDto,
  ): Promise<SubjectListResponseDto> {
    return this.subjectsService.findAll(query);
  }

  @Get('hierarchy/catalog')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({
    summary: 'Get subject catalog hierarchy',
    description:
      'Returns subjects with linked grade levels for curriculum and assignment UIs.',
  })
  @ApiOkResponse({ type: SubjectHierarchyResponseDto })
  getHierarchy(
    @Query() query: SubjectHierarchyQueryDto,
  ): Promise<SubjectHierarchyResponseDto> {
    return this.subjectsService.getHierarchy(query);
  }

  @Get(':id')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'Get subject by id' })
  @ApiOkResponse({ type: SubjectResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create subject' })
  @ApiCreatedResponse({ type: SubjectResponseDto })
  create(@Body() dto: CreateSubjectDto): Promise<SubjectResponseDto> {
    return this.subjectsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Activate subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete subject (no assignments)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subjectsService.remove(id);
  }
}
