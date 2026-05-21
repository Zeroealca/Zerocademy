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
import { CreateGradeLevelDto } from './dto/create-grade-level.dto';
import { GradeLevelListResponseDto } from './dto/grade-level-list-response.dto';
import { GradeLevelResponseDto } from './dto/grade-level-response.dto';
import { ListGradeLevelsQueryDto } from './dto/list-grade-levels-query.dto';
import { UpdateGradeLevelDto } from './dto/update-grade-level.dto';
import { GradeLevelsService } from './grade-levels.service';

@ApiTags('grade-levels')
@Controller('grade-levels')
export class GradeLevelsController {
  constructor(private readonly gradeLevelsService: GradeLevelsService) {}

  @Get()
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'List grade levels (paginated)' })
  @ApiOkResponse({ type: GradeLevelListResponseDto })
  findAll(
    @Query() query: ListGradeLevelsQueryDto,
  ): Promise<GradeLevelListResponseDto> {
    return this.gradeLevelsService.findAll(query);
  }

  @Get(':id')
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'Get grade level by id' })
  @ApiOkResponse({ type: GradeLevelResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradeLevelResponseDto> {
    return this.gradeLevelsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Create grade level' })
  @ApiCreatedResponse({ type: GradeLevelResponseDto })
  create(@Body() dto: CreateGradeLevelDto): Promise<GradeLevelResponseDto> {
    return this.gradeLevelsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Update grade level' })
  @ApiOkResponse({ type: GradeLevelResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradeLevelDto,
  ): Promise<GradeLevelResponseDto> {
    return this.gradeLevelsService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate grade level' })
  @ApiOkResponse({ type: GradeLevelResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradeLevelResponseDto> {
    return this.gradeLevelsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate grade level' })
  @ApiOkResponse({ type: GradeLevelResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradeLevelResponseDto> {
    return this.gradeLevelsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...PLATFORM_CATALOG_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete grade level (no courses)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gradeLevelsService.remove(id);
  }
}
