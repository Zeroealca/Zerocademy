import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetSelectedAcademicPeriodDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;
}
