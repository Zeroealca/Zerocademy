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
import { ApiRequireRoles } from '../../common/decorators/api';
import {
  PLATFORM_CATALOG_WRITE_ROLES,
  PLATFORM_READ_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { CreateSubLevelDto } from './dto/create-sub-level.dto';
import { ListSubLevelsQueryDto } from './dto/list-sub-levels-query.dto';
import { SubLevelListResponseDto } from './dto/sub-level-list-response.dto';
import { SubLevelResponseDto } from './dto/sub-level-response.dto';
import { UpdateSubLevelDto } from './dto/update-sub-level.dto';
import { SubLevelsService } from './sub-levels.service';

@ApiTags('sub-levels')
@Controller('sub-levels')
export class SubLevelsController {
  constructor(private readonly subLevelsService: SubLevelsService) {}
  @Get()
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'List academic sublevels (paginated)' })
  @ApiOkResponse({ type: SubLevelListResponseDto })
  findAll(
    @Query() query: ListSubLevelsQueryDto,
  ): Promise<SubLevelListResponseDto> {
    return this.subLevelsService.findAll(query);
  }
  @Get(':id')
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'Get academic sublevel by id' })
  @ApiOkResponse({ type: SubLevelResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubLevelResponseDto> {
    return this.subLevelsService.findOne(id);
  }
  @Post()
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Create academic sublevel' })
  @ApiCreatedResponse({ type: SubLevelResponseDto })
  create(@Body() dto: CreateSubLevelDto): Promise<SubLevelResponseDto> {
    return this.subLevelsService.create(dto);
  }
  @Patch(':id')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Update academic sublevel' })
  @ApiOkResponse({ type: SubLevelResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubLevelDto,
  ): Promise<SubLevelResponseDto> {
    return this.subLevelsService.update(id, dto);
  }
  @Post(':id/activate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate academic sublevel' })
  @ApiOkResponse({ type: SubLevelResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubLevelResponseDto> {
    return this.subLevelsService.activate(id);
  }
  @Post(':id/deactivate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate academic sublevel' })
  @ApiOkResponse({ type: SubLevelResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SubLevelResponseDto> {
    return this.subLevelsService.deactivate(id);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete academic sublevel (no courses)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subLevelsService.remove(id);
  }
}
