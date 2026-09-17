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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ApiRequireRoles } from '../../common/decorators/api';
import {
  PLATFORM_CATALOG_WRITE_ROLES,
  PLATFORM_READ_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { SubjectHierarchyQueryDto } from './dto/subject-hierarchy-query.dto';
import { SubjectHierarchyResponseDto } from './dto/subject-hierarchy-response.dto';
import { SubjectListResponseDto } from './dto/subject-list-response.dto';
import { SubjectResponseDto } from './dto/subject-response.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'List subjects (paginated)' })
  @ApiOkResponse({ type: SubjectListResponseDto })
  findAll(
    @Query() query: ListSubjectsQueryDto,
  ): Promise<SubjectListResponseDto> {
    return this.subjectsService.findAll(query);
  }

  @Get('hierarchy/catalog')
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
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
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'Get subject by id' })
  @ApiOkResponse({ type: SubjectResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create subject' })
  @ApiCreatedResponse({ type: SubjectResponseDto })
  create(@Body() dto: CreateSubjectDto, @CurrentUser() actor: AuthenticatedUser): Promise<SubjectResponseDto> {
    return this.subjectsService.create(dto, actor);
  }

  @Patch(':id')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Update subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate subject' })
  @ApiOkResponse({ type: SubjectResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete subject (no assignments)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subjectsService.remove(id);
  }
}
