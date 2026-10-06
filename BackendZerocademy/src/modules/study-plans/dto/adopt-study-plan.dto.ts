import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AdoptStudyPlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  officialStudyPlanId!: string;
}
