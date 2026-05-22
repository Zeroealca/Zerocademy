import { ApiProperty } from '@nestjs/swagger';
import { EnrollmentStatus } from '@prisma/client';

class EnrollmentStudentSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ nullable: true })
  nationalId: string | null;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;
}

class EnrollmentCourseSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  section: string;
}

class EnrollmentPeriodSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class EnrollmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty({ format: 'uuid' })
  courseId: string;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty({ format: 'date' })
  enrollmentDate: string;

  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus;

  @ApiProperty({ type: EnrollmentStudentSummaryDto })
  student: EnrollmentStudentSummaryDto;

  @ApiProperty({ type: EnrollmentCourseSummaryDto })
  course: EnrollmentCourseSummaryDto;

  @ApiProperty({ type: EnrollmentPeriodSummaryDto })
  academicPeriod: EnrollmentPeriodSummaryDto;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
