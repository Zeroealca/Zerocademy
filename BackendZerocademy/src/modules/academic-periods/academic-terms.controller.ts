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
  PLATFORM_CALENDAR_WRITE_ROLES,
  PLATFORM_READ_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';
import { AcademicTermResponseDto } from './dto/academic-term-response.dto';

@ApiTags('academic-periods')
@Controller('academic-periods/:periodId/terms')
export class AcademicTermsController {
  constructor(private readonly academicTermsService: AcademicTermsService) {}

  @Get()
  @ApiRequireRoles(...PLATFORM_READ_ROLES)
  @ApiOperation({ summary: 'List terms for an academic period' })
  @ApiOkResponse({ type: [AcademicTermResponseDto] })
  findAll(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ): Promise<AcademicTermResponseDto[]> {
    return this.academicTermsService.findAllByPeriod(periodId);
  }

  @Post()
  @ApiRequireRoles(...PLATFORM_CALENDAR_WRITE_ROLES)
  @ApiOperation({ summary: 'Create academic term (quimester)' })
  @ApiCreatedResponse({ type: AcademicTermResponseDto })
  create(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Body() dto: CreateAcademicTermDto,
  ): Promise<AcademicTermResponseDto> {
    return this.academicTermsService.create(periodId, dto);
  }

  @Patch(':termId')
  @ApiRequireRoles(...PLATFORM_CALENDAR_WRITE_ROLES)
  @ApiOperation({ summary: 'Update academic term' })
  @ApiOkResponse({ type: AcademicTermResponseDto })
  update(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('termId', ParseUUIDPipe) termId: string,
    @Body() dto: UpdateAcademicTermDto,
  ): Promise<AcademicTermResponseDto> {
    return this.academicTermsService.update(periodId, termId, dto);
  }

  @Delete(':termId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...PLATFORM_CALENDAR_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete academic term' })
  @ApiNoContentResponse()
  remove(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Param('termId', ParseUUIDPipe) termId: string,
  ): Promise<void> {
    return this.academicTermsService.remove(periodId, termId);
  }
}
