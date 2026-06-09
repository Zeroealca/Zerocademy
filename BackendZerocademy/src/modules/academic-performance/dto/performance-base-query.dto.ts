import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Academic period scope for calculations' })
  @IsUUID()
  academicPeriodId: string;
}
