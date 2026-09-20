import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportCardQualitativeResultDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  description: string;
}

export class ReportCardTermDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional({ nullable: true })
  average: number | null;

  @ApiPropertyOptional({ type: ReportCardQualitativeResultDto, nullable: true })
  qualitativeResult: ReportCardQualitativeResultDto | null;
}

export class ReportCardSubjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ type: [ReportCardTermDto] })
  terms: ReportCardTermDto[];

  @ApiPropertyOptional({ nullable: true })
  average: number | null;

  @ApiPropertyOptional({ type: ReportCardQualitativeResultDto, nullable: true })
  qualitativeResult: ReportCardQualitativeResultDto | null;
}

export class ReportCardResponseDto {
  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  student: {
    id: string;
    fullName: string;
    nationalId: string | null;
    registrationNumber: string | null;
  };

  @ApiProperty()
  institution: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };

  @ApiProperty()
  academicPeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };

  @ApiProperty()
  enrollment: {
    courseId: string;
    courseName: string;
    section: string;
    gradeLevelName: string;
  };

  @ApiProperty({ type: [ReportCardSubjectDto] })
  subjects: ReportCardSubjectDto[];

  @ApiPropertyOptional({ nullable: true })
  overallAverage: number | null;

  @ApiPropertyOptional({ type: ReportCardQualitativeResultDto, nullable: true })
  overallQualitativeResult: ReportCardQualitativeResultDto | null;
}
