import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PerformanceBaseQueryDto } from './performance-base-query.dto';

export class StudentSubjectAveragesQueryDto extends PerformanceBaseQueryDto {}

export class StudentTermAveragesQueryDto extends PerformanceBaseQueryDto {
  @ApiPropertyOptional({ description: 'Filter by subject' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by calendar academic term' })
  @IsOptional()
  @IsUUID()
  academicTermId?: string;
}

export class StudentPerformanceSummaryQueryDto extends PerformanceBaseQueryDto {}
