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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRoles } from '../../common/decorators/api';
import { AcademicPeriodsService } from './academic-periods.service';
import { ActivePeriodQueryDto } from './dto/active-period-query.dto';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { ListAcademicPeriodsQueryDto } from './dto/list-academic-periods-query.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { AcademicPeriodListResponseDto } from './dto/academic-period-list-response.dto';
import { AcademicPeriodResponseDto } from './dto/academic-period-response.dto';

const READ_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER] as const;
const WRITE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;

@ApiTags('academic-periods')
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(private readonly academicPeriodsService: AcademicPeriodsService) {}

  @Get()
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'List academic periods (paginated)' })
  @ApiOkResponse({ type: AcademicPeriodListResponseDto })
  findAll(
    @Query() query: ListAcademicPeriodsQueryDto,
  ): Promise<AcademicPeriodListResponseDto> {
    return this.academicPeriodsService.findAll(query);
  }

  @Get('active')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({
    summary: 'Get current active period for a regime',
    description:
      'Returns the active academic period for the given Ecuadorian regime, or null.',
  })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  @ApiNotFoundResponse({ description: 'No active period for the regime' })
  async findActive(
    @Query() query: ActivePeriodQueryDto,
  ): Promise<AcademicPeriodResponseDto | null> {
    return this.academicPeriodsService.findActiveByRegime(query.regime);
  }

  @Get(':id')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'Get academic period by id (includes terms)' })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.findOne(id);
  }

  @Post()
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create academic period' })
  @ApiCreatedResponse({ type: AcademicPeriodResponseDto })
  create(@Body() dto: CreateAcademicPeriodDto): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.create(dto);
  }

  @Patch(':id')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update academic period' })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete academic period (non-active only)' })
  @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.academicPeriodsService.remove(id);
  }

  @Post(':id/activate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({
    summary: 'Activate academic period',
    description:
      'Sets period as active for its regime and closes any other active period in the same regime.',
  })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate academic period' })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.deactivate(id);
  }

  @Post(':id/archive')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Archive academic period' })
  @ApiOkResponse({ type: AcademicPeriodResponseDto })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPeriodResponseDto> {
    return this.academicPeriodsService.archive(id);
  }
}
