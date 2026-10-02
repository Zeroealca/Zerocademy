import { ApiProperty } from '@nestjs/swagger';

export class BulkGradeResultDto {
  @ApiProperty()
  createdCount: number;

  @ApiProperty()
  updatedCount: number;

  @ApiProperty()
  clearedCount: number;

  @ApiProperty()
  unchangedCount: number;
}
