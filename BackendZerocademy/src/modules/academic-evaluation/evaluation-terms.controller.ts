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
  ACADEMIC_EVALUATION_READ_ROLES,
  ACADEMIC_EVALUATION_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { CreateEvaluationTermDto } from './dto/create-evaluation-term.dto';
import { EvaluationTermListResponseDto } from './dto/evaluation-term-list-response.dto';
import { EvaluationTermResponseDto } from './dto/evaluation-term-response.dto';
import { ListEvaluationTermsQueryDto } from './dto/list-evaluation-terms-query.dto';
import { ReorderEvaluationTermsDto } from './dto/reorder-evaluation-terms.dto';
import { UpdateEvaluationTermDto } from './dto/update-evaluation-term.dto';
import { EvaluationTermsService } from './evaluation-terms.service';

@ApiTags('evaluation-terms')
@Controller('evaluation-terms')
export class EvaluationTermsController {
  constructor(private readonly evaluationTermsService: EvaluationTermsService) {}

  @Get()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'List evaluation terms (paginated)' })
  @ApiOkResponse({ type: EvaluationTermListResponseDto })
  findAll(
    @Query() query: ListEvaluationTermsQueryDto,
  ): Promise<EvaluationTermListResponseDto> {
    return this.evaluationTermsService.findAll(query);
  }

  @Post()
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Create evaluation term' })
  @ApiCreatedResponse({ type: EvaluationTermResponseDto })
  create(
    @Body() dto: CreateEvaluationTermDto,
  ): Promise<EvaluationTermResponseDto> {
    return this.evaluationTermsService.create(dto);
  }

  @Post('reorder')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Reorder evaluation terms' })
  @ApiOkResponse({ type: [EvaluationTermResponseDto] })
  reorder(
    @Query('institutionId', ParseUUIDPipe) institutionId: string,
    @Query('academicPeriodId', ParseUUIDPipe) academicPeriodId: string,
    @Body() dto: ReorderEvaluationTermsDto,
  ): Promise<EvaluationTermResponseDto[]> {
    return this.evaluationTermsService.reorder(
      institutionId,
      academicPeriodId,
      dto,
    );
  }

  @Get(':id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'Get evaluation term by id' })
  @ApiOkResponse({ type: EvaluationTermResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EvaluationTermResponseDto> {
    return this.evaluationTermsService.findOne(id);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Update evaluation term' })
  @ApiOkResponse({ type: EvaluationTermResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEvaluationTermDto,
  ): Promise<EvaluationTermResponseDto> {
    return this.evaluationTermsService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate evaluation term' })
  @ApiOkResponse({ type: EvaluationTermResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EvaluationTermResponseDto> {
    return this.evaluationTermsService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete evaluation term' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.evaluationTermsService.remove(id);
  }
}
