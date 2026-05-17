import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Validation field error — aligns with global exception filter shape (§14). */
export class ApiErrorDetailDto {
  @ApiProperty({ example: 'firstName' })
  field: string;

  @ApiProperty({ example: 'firstName must be a string' })
  message: string | string[];
}

/**
 * Standard API error envelope documented on all endpoints.
 * @see BackendZerocademy/agent.md §12–§14
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}
