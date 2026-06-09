import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryAverageResponseDto {
  @ApiProperty()
  assessmentCategoryId: string;

  @ApiProperty()
  assessmentCategoryName: string;

  @ApiProperty()
  weight: number;

  @ApiPropertyOptional({ nullable: true })
  average: number | null;

  @ApiProperty()
  gradeCount: number;
}

export class TermAverageResponseDto {
  @ApiProperty()
  academicTermId: string;

  @ApiProperty()
  academicTermName: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  weight: number;

  @ApiPropertyOptional({ nullable: true })
  average: number | null;

  @ApiProperty({ type: [CategoryAverageResponseDto] })
  categories: CategoryAverageResponseDto[];
}

export class SubjectAverageResponseDto {
  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiPropertyOptional({ nullable: true })
  average: number | null;

  @ApiPropertyOptional({ nullable: true })
  isPassing: boolean | null;

  @ApiProperty({ type: [TermAverageResponseDto] })
  terms: TermAverageResponseDto[];
}

export class StudentSubjectAveragesResponseDto {
  @ApiProperty()
  academicPeriodId: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiProperty({ type: [SubjectAverageResponseDto] })
  subjects: SubjectAverageResponseDto[];
}

export class StudentTermAveragesResponseDto {
  @ApiProperty()
  academicPeriodId: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiProperty({ type: [TermAverageResponseDto] })
  terms: TermAverageResponseDto[];
}

export class StudentPerformanceSummaryResponseDto {
  @ApiProperty()
  academicPeriodId: string;

  @ApiProperty()
  enrollmentId: string;

  @ApiPropertyOptional({ nullable: true })
  overallAverage: number | null;

  @ApiProperty()
  subjectCount: number;

  @ApiProperty()
  passingSubjectCount: number;

  @ApiProperty({ type: [SubjectAverageResponseDto] })
  subjects: SubjectAverageResponseDto[];
}

export class CourseSubjectAverageItemDto {
  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiPropertyOptional({ nullable: true })
  classAverage: number | null;

  @ApiProperty()
  studentCount: number;

  @ApiProperty()
  gradedStudentCount: number;
}

export class TeacherCourseAveragesResponseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiProperty({ type: [CourseSubjectAverageItemDto] })
  subjects: CourseSubjectAverageItemDto[];
}

export class StudentPerformanceItemDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiPropertyOptional({ nullable: true })
  subjectAverage: number | null;

  @ApiPropertyOptional({ nullable: true })
  isPassing: boolean | null;
}

export class TeacherSubjectPerformanceResponseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiPropertyOptional({ nullable: true })
  classAverage: number | null;

  @ApiProperty({ type: [StudentPerformanceItemDto] })
  students: StudentPerformanceItemDto[];
}

export class TeacherStudentPerformanceResponseDto {
  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiPropertyOptional()
  courseId?: string;

  @ApiPropertyOptional({ nullable: true })
  overallAverage: number | null;

  @ApiProperty({ type: [SubjectAverageResponseDto] })
  subjects: SubjectAverageResponseDto[];
}

export class InstitutionCourseSummaryItemDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiPropertyOptional({ nullable: true })
  averagePerformance: number | null;

  @ApiProperty()
  studentCount: number;
}

export class AdminInstitutionPerformanceResponseDto {
  @ApiProperty()
  institutionId: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiPropertyOptional({ nullable: true })
  institutionAverage: number | null;

  @ApiProperty()
  courseCount: number;

  @ApiProperty({ type: [InstitutionCourseSummaryItemDto] })
  courses: InstitutionCourseSummaryItemDto[];
}

export class AdminCoursePerformanceResponseDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseName: string;

  @ApiProperty()
  academicPeriodId: string;

  @ApiPropertyOptional({ nullable: true })
  courseAverage: number | null;

  @ApiProperty({ type: [CourseSubjectAverageItemDto] })
  subjects: CourseSubjectAverageItemDto[];
}

export class AdminStudentPerformanceResponseDto extends TeacherStudentPerformanceResponseDto {}
