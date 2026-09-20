import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
export class CreateAcademicUnitDto {
  @IsString() @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() objectives?: string;
  @IsOptional() @IsString() contents?: string;
  @IsOptional() @IsString() activities?: string;
  @IsOptional() @IsString() resources?: string;
  @IsOptional() @IsString() evaluationNotes?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
export class UpdateAcademicUnitDto extends PartialType(CreateAcademicUnitDto) {}
export class ReorderAcademicUnitsDto {
  @IsArray() @IsUUID('4', { each: true }) unitIds: string[];
}
