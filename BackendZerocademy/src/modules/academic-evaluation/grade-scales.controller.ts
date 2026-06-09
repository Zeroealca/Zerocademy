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
import { ApiRequireRoles } from '../../common/decorators/api';
import {
  ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  ACADEMIC_EVALUATION_READ_ROLES,
  ACADEMIC_EVALUATION_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { CreateGradeScaleDto } from './dto/create-grade-scale.dto';
import { GradeScaleResponseDto } from './dto/grade-scale-response.dto';
import { UpdateGradeScaleDto } from './dto/update-grade-scale.dto';
import { GradeScalesService } from './grade-scales.service';

@ApiTags('grade-scales')
@Controller('grading-schemes/:schemeId/grade-scales')
export class GradeScalesController {
  constructor(private readonly gradeScalesService: GradeScalesService) {}

  @Get()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'List grade scales for a grading scheme' })
  @ApiOkResponse({ type: [GradeScaleResponseDto] })
  findAll(
    @Param('schemeId', ParseUUIDPipe) schemeId: string,
  ): Promise<GradeScaleResponseDto[]> {
    return this.gradeScalesService.findAllByScheme(schemeId);
  }

  @Post()
  @ApiRequireRoles(
    ...ACADEMIC_EVALUATION_WRITE_ROLES,
    ...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  )
  @ApiOperation({ summary: 'Create grade scale' })
  @ApiCreatedResponse({ type: GradeScaleResponseDto })
  create(
    @Param('schemeId', ParseUUIDPipe) schemeId: string,
    @Body() dto: CreateGradeScaleDto,
  ): Promise<GradeScaleResponseDto> {
    return this.gradeScalesService.create(schemeId, dto);
  }

  @Patch(':scaleId')
  @ApiRequireRoles(
    ...ACADEMIC_EVALUATION_WRITE_ROLES,
    ...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  )
  @ApiOperation({ summary: 'Update grade scale' })
  @ApiOkResponse({ type: GradeScaleResponseDto })
  update(
    @Param('schemeId', ParseUUIDPipe) schemeId: string,
    @Param('scaleId', ParseUUIDPipe) scaleId: string,
    @Body() dto: UpdateGradeScaleDto,
  ): Promise<GradeScaleResponseDto> {
    return this.gradeScalesService.update(schemeId, scaleId, dto);
  }

  @Delete(':scaleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(
    ...ACADEMIC_EVALUATION_WRITE_ROLES,
    ...ACADEMIC_EVALUATION_PLATFORM_WRITE_ROLES,
  )
  @ApiOperation({ summary: 'Delete grade scale' })
  @ApiNoContentResponse()
  remove(
    @Param('schemeId', ParseUUIDPipe) schemeId: string,
    @Param('scaleId', ParseUUIDPipe) scaleId: string,
  ): Promise<void> {
    return this.gradeScalesService.remove(schemeId, scaleId);
  }
}
