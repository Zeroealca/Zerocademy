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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRoles } from '../../common/decorators/api';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { InstitutionListResponseDto } from './dto/institution-list-response.dto';
import { InstitutionResponseDto } from './dto/institution-response.dto';
import { ListInstitutionsQueryDto } from './dto/list-institutions-query.dto';
import { UpdateInstitutionBrandingDto } from './dto/update-institution-branding.dto';
import { UpdateInstitutionSettingsDto } from './dto/update-institution-settings.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionsService } from './institutions.service';

const READ_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;
const WRITE_ROLES = [Role.SUPER_ADMIN] as const;
const SETTINGS_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'List educational institutions (paginated)' })
  @ApiOkResponse({ type: InstitutionListResponseDto })
  findAll(
    @Query() query: ListInstitutionsQueryDto,
  ): Promise<InstitutionListResponseDto> {
    return this.institutionsService.findAll(query);
  }

  @Get(':id')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'Get institution by id' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create educational institution' })
  @ApiCreatedResponse({ type: InstitutionResponseDto })
  create(@Body() dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    return this.institutionsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update educational institution' })
  @ApiOkResponse({ type: InstitutionResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.update(id, dto);
  }

  @Patch(':id/settings')
  @ApiRequireRoles(...SETTINGS_ROLES)
  @ApiOperation({
    summary: 'Update institution settings',
    description: 'Contact, address, region, and default academic regime.',
  })
  @ApiOkResponse({ type: InstitutionResponseDto })
  updateSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionSettingsDto,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.updateSettings(id, dto);
  }

  @Post(':id/logo')
  @ApiRequireRoles(...SETTINGS_ROLES)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload institution logo',
    description:
      'Optimizes image to WebP (preserves transparency when present). Max 5 MB.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOkResponse({ type: InstitutionResponseDto })
  uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.uploadLogo(id, file);
  }

  @Patch(':id/branding')
  @ApiRequireRoles(...SETTINGS_ROLES)
  @ApiOperation({
    summary: 'Update institution branding',
    description: 'Theme colors for institution-specific UI.',
  })
  @ApiOkResponse({ type: InstitutionResponseDto })
  updateBranding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInstitutionBrandingDto,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.updateBranding(id, dto);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Activate institution',
    description: 'Allows academic operations for this institution.',
  })
  @ApiOkResponse({ type: InstitutionResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Deactivate institution',
    description: 'Blocks new academic operations for this institution.',
  })
  @ApiOkResponse({ type: InstitutionResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Delete institution',
    description: 'Only allowed when no dependent academic or profile records exist.',
  })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.institutionsService.remove(id);
  }
}
