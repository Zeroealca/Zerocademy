import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReportCardQueryDto {
  @ApiProperty({ description: 'Academic period used to build the report card' })
  @IsUUID()
  academicPeriodId: string;
}
