import { ApiProperty } from '@nestjs/swagger';

/** Pagination metadata for list responses — matches monorepo API contract. */
export class PaginationMetaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ example: 20, minimum: 1, maximum: 100 })
  limit: number;

  @ApiProperty({ example: 150, minimum: 0 })
  total: number;

  @ApiProperty({ example: 8, minimum: 0 })
  totalPages: number;
}
