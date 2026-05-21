import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class TransitionOptionsDto {
  @ApiProperty({
    default: true,
    description: 'Create classroom courses in the target period',
  })
  @IsBoolean()
  copyCourses: boolean;

  @ApiProperty({
    default: false,
    description: 'Copy teacher assignments (requires copyCourses)',
  })
  @IsBoolean()
  copyTeacherAssignments: boolean;

  @ApiProperty({
    default: true,
    description: 'Copy academic terms when creating a new target period',
  })
  @IsBoolean()
  copyTerms: boolean;

  @ApiProperty({
    default: true,
    description: 'Activate the target period for the institution',
  })
  @IsBoolean()
  activateTargetPeriod: boolean;

  @ApiProperty({
    default: true,
    description: 'Close the source period after transition',
  })
  @IsBoolean()
  closeSourcePeriod: boolean;
}

export class CreateTargetPeriodDto {
  @ApiProperty({ example: '2026-2027' })
  name: string;

  @ApiProperty({ example: '2026-04-01' })
  startDate: string;

  @ApiProperty({ example: '2027-02-28' })
  endDate: string;
}
