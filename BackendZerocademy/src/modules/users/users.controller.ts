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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiStandardErrorResponses } from '../../common/decorators/api';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListResponseDto } from './dto/user-list-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
// @Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List users',
    description: 'Requires role: SUPER_ADMIN or ADMIN. Paginated list.',
  })
  @ApiOkResponse({ type: UserListResponseDto })
  @ApiStandardErrorResponses()
  findAll(@Query() query: ListUsersQueryDto): Promise<UserListResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Requires role: SUPER_ADMIN or ADMIN.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiStandardErrorResponses()
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create user',
    description: 'Requires role: SUPER_ADMIN or ADMIN.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiStandardErrorResponses()
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Requires role: SUPER_ADMIN or ADMIN.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiStandardErrorResponses()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Soft-delete user',
    description:
      'Requires role: SUPER_ADMIN or ADMIN. Sets deletedAt and revokes refresh tokens.',
  })
  @ApiNoContentResponse({ description: 'User soft-deleted' })
  @ApiStandardErrorResponses()
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.softDelete(id);
  }
}
