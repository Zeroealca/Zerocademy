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
import { AssessmentCategoriesService } from './assessment-categories.service';
import { AssessmentCategoryListResponseDto } from './dto/assessment-category-list-response.dto';
import { AssessmentCategoryResponseDto } from './dto/assessment-category-response.dto';
import { CreateAssessmentCategoryDto } from './dto/create-assessment-category.dto';
import { ListAssessmentCategoriesQueryDto } from './dto/list-assessment-categories-query.dto';
import { UpdateAssessmentCategoryDto } from './dto/update-assessment-category.dto';

@ApiTags('assessment-categories')
@Controller('assessment-categories')
export class AssessmentCategoriesController {
  constructor(
    private readonly assessmentCategoriesService: AssessmentCategoriesService,
  ) {}

  @Get()
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'List assessment categories (paginated)' })
  @ApiOkResponse({ type: AssessmentCategoryListResponseDto })
  findAll(
    @Query() query: ListAssessmentCategoriesQueryDto,
  ): Promise<AssessmentCategoryListResponseDto> {
    return this.assessmentCategoriesService.findAll(query);
  }

  @Get(':id')
  @ApiRequireRoles(...ACADEMIC_EVALUATION_READ_ROLES)
  @ApiOperation({ summary: 'Get assessment category by id' })
  @ApiOkResponse({ type: AssessmentCategoryResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentCategoryResponseDto> {
    return this.assessmentCategoriesService.findOne(id);
  }

  @Post()
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Create assessment category' })
  @ApiCreatedResponse({ type: AssessmentCategoryResponseDto })
  create(
    @Body() dto: CreateAssessmentCategoryDto,
  ): Promise<AssessmentCategoryResponseDto> {
    return this.assessmentCategoriesService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Update assessment category' })
  @ApiOkResponse({ type: AssessmentCategoryResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAssessmentCategoryDto,
  ): Promise<AssessmentCategoryResponseDto> {
    return this.assessmentCategoriesService.update(id, dto);
  }

  @Post(':id/deactivate')
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate assessment category' })
  @ApiOkResponse({ type: AssessmentCategoryResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentCategoryResponseDto> {
    return this.assessmentCategoriesService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(...ACADEMIC_EVALUATION_WRITE_ROLES)
  @ApiOperation({ summary: 'Delete assessment category' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.assessmentCategoriesService.remove(id);
  }
}
