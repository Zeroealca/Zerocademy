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
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRoles,
  ApiRequireRolesStrict,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicUnitsService } from './academic-units.service';
import {
  CreateAcademicUnitDto,
  ReorderAcademicUnitsDto,
  UpdateAcademicUnitDto,
} from './dto/academic-unit.dto';
import { AcademicUnitResponseDto } from './dto/academic-unit-response.dto';
@ApiTags('academic-units')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@Controller('academic-plans/:planId/units')
export class AcademicUnitsController {
  constructor(private readonly units: AcademicUnitsService) {}
  @Get()
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: AcademicUnitResponseDto, isArray: true })
  list(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
  ) {
    return this.units.list(a, p);
  }
  @Patch('reorder')
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({ summary: 'Reorder all units of a draft plan' })
  @ApiOkResponse({
    description: 'Units reordered successfully; the operation returns no body.',
  })
  reorder(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
    @Body() b: ReorderAcademicUnitsDto,
  ) {
    return this.units.reorder(a, p, b.unitIds);
  }
  @Get(':unitId')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: AcademicUnitResponseDto })
  one(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
    @Param('unitId', ParseUUIDPipe) u: string,
  ) {
    return this.units.one(a, p, u);
  }
  @Post()
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiCreatedResponse({ type: AcademicUnitResponseDto })
  create(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
    @Body() b: CreateAcademicUnitDto,
  ) {
    return this.units.create(a, p, b);
  }
  @Patch(':unitId')
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOkResponse({ type: AcademicUnitResponseDto })
  update(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
    @Param('unitId', ParseUUIDPipe) u: string,
    @Body() b: UpdateAcademicUnitDto,
  ) {
    return this.units.update(a, p, u, b);
  }
  @Delete(':unitId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiNoContentResponse()
  remove(
    @CurrentUser() a: AuthenticatedUser,
    @Param('planId', ParseUUIDPipe) p: string,
    @Param('unitId', ParseUUIDPipe) u: string,
  ) {
    return this.units.remove(a, p, u);
  }
}
