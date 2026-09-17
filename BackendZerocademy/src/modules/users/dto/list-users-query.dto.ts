import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const USER_LIST_SORT_FIELDS = ['role', 'isActive', 'createdAt'] as const;
export type UserListSortField = (typeof USER_LIST_SORT_FIELDS)[number];

export const USER_LIST_SORT_ORDERS = ['asc', 'desc'] as const;
export type UserListSortOrder = (typeof USER_LIST_SORT_ORDERS)[number];

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by email, first name, or last name',
    example: 'ada',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: USER_LIST_SORT_FIELDS,
    description: 'Sort column. Defaults to createdAt.',
  })
  @IsOptional()
  @IsIn(USER_LIST_SORT_FIELDS)
  sortBy?: UserListSortField;

  @ApiPropertyOptional({
    enum: USER_LIST_SORT_ORDERS,
    description: 'Sort direction. Defaults to desc for createdAt, asc otherwise.',
  })
  @IsOptional()
  @IsIn(USER_LIST_SORT_ORDERS)
  sortOrder?: UserListSortOrder;
}
