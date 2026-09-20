import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class AcademicUnitResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) academicPlanId: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiPropertyOptional({ nullable: true }) objectives: string | null;
  @ApiPropertyOptional({ nullable: true }) contents: string | null;
  @ApiPropertyOptional({ nullable: true }) activities: string | null;
  @ApiPropertyOptional({ nullable: true }) resources: string | null;
  @ApiPropertyOptional({ nullable: true }) evaluationNotes: string | null;
  @ApiPropertyOptional({ format: 'date', nullable: true }) startDate:
    | string
    | null;
  @ApiPropertyOptional({ format: 'date', nullable: true }) endDate:
    | string
    | null;
  @ApiProperty({ example: 1 }) position: number;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}
