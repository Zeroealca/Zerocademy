import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateGradeScaleDto } from './create-grade-scale.dto';

export class ReplaceGradeScalesDto {
  @ApiProperty({ type: [CreateGradeScaleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGradeScaleDto)
  scales: CreateGradeScaleDto[];
}
