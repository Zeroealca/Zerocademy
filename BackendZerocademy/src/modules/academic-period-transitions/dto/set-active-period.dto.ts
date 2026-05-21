import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetActiveAcademicPeriodDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;
}
