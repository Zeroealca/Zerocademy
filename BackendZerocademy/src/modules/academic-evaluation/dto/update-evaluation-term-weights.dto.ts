import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class EvaluationTermWeightItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  weight: number;
}

export class UpdateEvaluationTermWeightsDto {
  @ApiProperty({ type: [EvaluationTermWeightItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EvaluationTermWeightItemDto)
  items: EvaluationTermWeightItemDto[];
}
