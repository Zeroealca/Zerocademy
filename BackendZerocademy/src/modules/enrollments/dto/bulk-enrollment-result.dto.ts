import { ApiProperty } from '@nestjs/swagger';

export class BulkEnrollmentErrorDto {
  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty()
  message: string;
}

export class BulkEnrollmentResultDto {
  @ApiProperty()
  enrolledCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [BulkEnrollmentErrorDto] })
  errors: BulkEnrollmentErrorDto[];
}
