import { ApiProperty } from '@nestjs/swagger';

export class BulkImportRowErrorDto {
  @ApiProperty({ example: 2 })
  row: number;

  @ApiProperty({ example: 'student1@example.com' })
  email: string;

  @ApiProperty({ example: 'Email already exists for a non-student user' })
  message: string;
}

export class BulkImportDuplicateWarningDto {
  @ApiProperty({ example: 3 })
  row: number;

  @ApiProperty({ example: '0912345678' })
  nationalId: string;

  @ApiProperty()
  message: string;
}

export class BulkImportResultDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  rows: {
    row: number;
    email: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    birthDate?: string;
    gender?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    status: 'imported' | 'skipped' | 'failed';
    message?: string;
  }[];
  @ApiProperty()
  importedCount: number;

  @ApiProperty()
  skippedCount: number;

  @ApiProperty()
  failedCount: number;

  @ApiProperty({ type: [BulkImportRowErrorDto] })
  errors: BulkImportRowErrorDto[];

  @ApiProperty({ type: [BulkImportDuplicateWarningDto] })
  duplicateWarnings: BulkImportDuplicateWarningDto[];
}
