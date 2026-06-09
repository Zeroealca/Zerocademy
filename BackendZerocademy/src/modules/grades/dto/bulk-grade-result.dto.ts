import { ApiProperty } from '@nestjs/swagger';

export class BulkGradeErrorDto {
  @ApiProperty({ format: 'uuid' })
  enrollmentId: string;

  @ApiProperty()
  message: string;
}

export class BulkGradeResultDto {
  @ApiProperty()
  createdCount: number;

  @ApiProperty()
  updatedCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [BulkGradeErrorDto] })
  errors: BulkGradeErrorDto[];
}
