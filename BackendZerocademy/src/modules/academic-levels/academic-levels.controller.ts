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
import {
  PLATFORM_CATALOG_WRITE_ROLES,
  PLATFORM_READ_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { AcademicLevelsService } from './academic-levels.service';
import { AcademicHierarchyResponseDto } from './dto/academic-hierarchy-response.dto';
import { AcademicLevelListResponseDto } from './dto/academic-level-list-response.dto';
import { AcademicLevelResponseDto } from './dto/academic-level-response.dto';
import { CreateAcademicLevelDto } from './dto/create-academic-level.dto';
import { AcademicHierarchyQueryDto } from './dto/hierarchy-query.dto';
import { ListAcademicLevelsQueryDto } from './dto/list-academic-levels-query.dto';
import { UpdateAcademicLevelDto } from './dto/update-academic-level.dto';

@ApiTags('academic-levels')
@Controller('academic-levels')
export class AcademicLevelsController {
  constructor(private readonly academicLevelsService: AcademicLevelsService) {}

  @Get()
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'List academic levels (paginated)' })
  @ApiOkResponse({ type: AcademicLevelListResponseDto })
  findAll(
    @Query() query: ListAcademicLevelsQueryDto,
  ): Promise<AcademicLevelListResponseDto> {
    return this.academicLevelsService.findAll(query);
  }

  @Get('hierarchy/tree')
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({
    summary: 'Get academic structure hierarchy',
    description:
      'Returns levels with nested grade levels and optional courses for an academic period.',
  })
  @ApiOkResponse({ type: AcademicHierarchyResponseDto })
  getHierarchy(
    @Query() query: AcademicHierarchyQueryDto,
  ): Promise<AcademicHierarchyResponseDto> {
    return this.academicLevelsService.getHierarchy(query);
  }

  @Get(':id')
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'Get academic level by id' })
  @ApiOkResponse({ type: AcademicLevelResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicLevelResponseDto> {
    return this.academicLevelsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Create academic level' })
  @ApiCreatedResponse({ type: AcademicLevelResponseDto })
  create(@Body() dto: CreateAcademicLevelDto): Promise<AcademicLevelResponseDto> {
    return this.academicLevelsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Update academic level' })
  @ApiOkResponse({ type: AcademicLevelResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicLevelDto,
  ): Promise<AcademicLevelResponseDto> {
    return this.academicLevelsService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate academic level' })
  @ApiOkResponse({ type: AcademicLevelResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicLevelResponseDto> {
    return this.academicLevelsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate academic level' })
  @ApiOkResponse({ type: AcademicLevelResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicLevelResponseDto> {
    return this.academicLevelsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete academic level (no grade levels)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.academicLevelsService.remove(id);
  }
}
