import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassroomCourseNodeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  section: string;

  @ApiPropertyOptional()
  capacity?: number | null;

  @ApiProperty()
  isActive: boolean;
}

export class GradeLevelNodeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [ClassroomCourseNodeDto] })
  courses: ClassroomCourseNodeDto[];
}

export class AcademicLevelNodeDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [GradeLevelNodeDto] })
  gradeLevels: GradeLevelNodeDto[];
}

export class AcademicHierarchyResponseDto {
  @ApiProperty({ type: [AcademicLevelNodeDto] })
  levels: AcademicLevelNodeDto[];
}
