import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AcademicHierarchyQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Include global catalog plus this institution custom entries',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'When set, includes classroom courses for this academic period',
  })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}
