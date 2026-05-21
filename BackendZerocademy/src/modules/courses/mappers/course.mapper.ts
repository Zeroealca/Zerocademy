import { Course } from '@prisma/client';
import { CourseResponseDto } from '../dto/course-response.dto';

export function toCourseResponseDto(course: Course): CourseResponseDto {
  return {
    id: course.id,
    name: course.name,
    section: course.section,
    capacity: course.capacity,
    institutionId: course.institutionId,
    academicPeriodId: course.academicPeriodId,
    gradeLevelId: course.gradeLevelId,
    isActive: course.isActive,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}
