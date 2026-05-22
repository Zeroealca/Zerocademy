import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class BulkImportStudentsDto {
  @ApiProperty({
    description:
      'CSV rows: email,password,firstName,lastName,nationalId,birthDate,gender,phone,address,emergencyContact; (optional fields may be empty). Header row is optional.',
  })
  @IsString()
  @MaxLength(500_000)
  csvContent: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;
}
