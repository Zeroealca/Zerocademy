import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSubLevelDto {
  @ApiProperty({ example: 'Educación General Básica Media' })
  @IsString()
  @MaxLength(120)
  name: string;
  @ApiProperty({ example: 'EGB-MEDIA' })
  @IsString()
  @MaxLength(32)
  code: string;
  @ApiProperty({ example: 1, minimum: 1 }) @IsInt() @Min(1) order: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() academicLevelId: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
