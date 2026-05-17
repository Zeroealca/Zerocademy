import { PaginationMetaDto } from '../dto/swagger/pagination-meta.dto';

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMetaDto {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export function getPaginationSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}
