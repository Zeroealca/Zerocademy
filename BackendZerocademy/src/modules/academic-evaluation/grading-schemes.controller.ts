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
import { ApiRequireRoles, ApiRequireRolesStrict } from '../../common/decorators/api';
import {
  ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  ACADEMIC_EVALUATION_READ_ROLES,
  ACADEMIC_EVALUATION_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { CreateGradingSchemeDto } from './dto/create-grading-scheme.dto';
import { GradingSchemeListResponseDto } from './dto/grading-scheme-list-response.dto';
import { GradingSchemeResponseDto } from './dto/grading-scheme-response.dto';
import { ListGradingSchemesQueryDto } from './dto/list-grading-schemes-query.dto';
import { UpdateGradingSchemeDto } from './dto/update-grading-scheme.dto';
import { GradingSchemesService } from './grading-schemes.service';

@ApiTags('grading-schemes')
@Controller('grading-schemes')
export class GradingSchemesController {
  constructor(private readonly gradingSchemesService: GradingSchemesService) {}

  @Get()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'List grading schemes (paginated)' })
  @ApiOkResponse({ type: GradingSchemeListResponseDto })
  findAll(
    @Query() query: ListGradingSchemesQueryDto,
  ): Promise<GradingSchemeListResponseDto> {
    return this.gradingSchemesService.findAll(query);
  }

  @Post()
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Create institution grading scheme' })
  @ApiCreatedResponse({ type: GradingSchemeResponseDto })
  create(@Body() dto: CreateGradingSchemeDto): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.create(dto);
  }

  @Post('platform/templates')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Create global grading scheme template (SUPER_ADMIN)' })
  @ApiCreatedResponse({ type: GradingSchemeResponseDto })
  createPlatformTemplate(
    @Body() dto: CreateGradingSchemeDto,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.create({ ...dto, institutionId: undefined });
  }

  @Patch('platform/:id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES)
  @ApiOperation({ summary: 'Update global grading scheme template (SUPER_ADMIN)' })
  @ApiOkResponse({ type: GradingSchemeResponseDto })
  updatePlatformScheme(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradingSchemeDto,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.updatePlatformScheme(id, dto);
  }

  @Get(':id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'Get grading scheme by id' })
  @ApiOkResponse({ type: GradingSchemeResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.findOne(id);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Update institution grading scheme' })
  @ApiOkResponse({ type: GradingSchemeResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGradingSchemeDto,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.update(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Activate grading scheme' })
  @ApiOkResponse({ type: GradingSchemeResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate grading scheme' })
  @ApiOkResponse({ type: GradingSchemeResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GradingSchemeResponseDto> {
    return this.gradingSchemesService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete grading scheme' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.gradingSchemesService.remove(id);
  }
}
