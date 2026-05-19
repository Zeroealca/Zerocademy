import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AssignmentHierarchyQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  teacherId?: string;
}
