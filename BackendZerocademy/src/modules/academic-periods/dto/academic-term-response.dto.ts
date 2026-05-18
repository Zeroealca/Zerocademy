import { ApiProperty } from '@nestjs/swagger';

export class AcademicTermResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'First Quimester' })
  name: string;

  @ApiProperty({ example: 1, minimum: 1 })
  order: number;

  @ApiProperty({ example: '2025-04-01' })
  startDate: string;

  @ApiProperty({ example: '2025-07-31' })
  endDate: string;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
